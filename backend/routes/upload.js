// backend/routes/upload.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const auth = require('../middleware/auth');
const CSVService = require('../services/csvService');
const db = require('../config/db');
const { buildCategorizationPrompt } = require('../services/promptBuilder');
const Category = require('../models/Category');
const geminiService = require('../services/geminiService');

// Configure multer for memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        console.log('📁 File received:', file.originalname, file.mimetype);
        
        // Accept CSV files
        if (file.mimetype === 'text/csv' || 
            file.mimetype === 'application/vnd.ms-excel' ||
            file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'), false);
        }
    }
});

// @route   POST api/upload/csv
// @desc    Upload and process CSV file (replaces old data)
router.post('/csv', auth, upload.single('file'), async (req, res) => {
    try {
        console.log('🟢 CSV upload endpoint called');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        console.log(`📄 Processing: ${req.file.originalname} (${req.file.size} bytes)`);
        
        // First, get count of existing expenses for logging
        const [existingCount] = await db.execute(
            'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', 
            [req.user.id]
        );
        console.log(`🗑️ Found ${existingCount[0].count} existing expenses for user ${req.user.id}`);
        
        // Delete all existing expenses for this user
        if (existingCount[0].count > 0) {
            await db.execute('DELETE FROM expenses WHERE user_id = ?', [req.user.id]);
            console.log(`✅ Deleted ${existingCount[0].count} old expenses`);
        }
        
        // Then process and save new CSV data
        const result = await CSVService.processCSV(req.file.buffer, req.user.id);


        // Invalidate AI insights cache for this user and trigger fresh insights
        try {
            const aiService = require('../services/aiService');
            const cache = require('../utils/cache');
            const cacheKey = `insights_${req.user.id}`;
            cache.delete(cacheKey);
            console.log(`🧹 Cleared AI insights cache for user ${req.user.id}`);
            // Optionally, trigger fresh insights generation
            aiService.generateInsights(req.user.id).then(() => {
                console.log('🤖 AI insights regenerated after CSV upload');
            }).catch(e => {
                console.warn('AI insights regeneration failed:', e.message);
            });
        } catch (e) {
            console.warn('Could not clear AI insights cache:', e.message);
        }

        // Get new count for verification
        const [newCount] = await db.execute(
            'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', 
            [req.user.id]
        );

        console.log(`📊 Final count: ${newCount[0].count} expenses in database`);
        console.log(`✅ Successfully processed ${result.valid_records} new records`);

        // Add file info to result
        result.fileName = req.file.originalname;
        result.fileSize = req.file.size;

        res.json(result);
        
    } catch (error) {
        console.error('❌ Upload error:', error);
        
        // If there was an error, try to restore data? 
        // For now, just send error response
        res.status(500).json({ 
            success: false,
            message: 'Error processing CSV file',
            error: error.message 
        });
    }
});

// @route   GET api/upload/template
// @desc    Download CSV template
router.get('/template', auth, async (req, res) => {
    try {
        const template = CSVService.generateTemplate();
        
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=expense_template.csv');
        res.send(template);
        
    } catch (error) {
        console.error('Template error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Error generating template' 
        });
    }
});

// @route   POST api/upload/validate
// @desc    Validate CSV without saving
router.post('/validate', auth, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        const records = await CSVService.parseCSV(req.file.buffer);
        const mapping = CSVService.detectColumns(records[0] || {});
        
        res.json({
            success: true,
            row_count: records.length,
            column_mapping: mapping,
            sample: records
        });
        
    } catch (error) {
        console.error('Validation error:', error);
        res.status(400).json({ 
            success: false,
            message: error.message 
        });
    }
});

// @route   DELETE api/upload/clear-all
// @desc    Delete all expenses for current user
router.delete('/clear-all', auth, async (req, res) => {
    try {
        // Get count before deletion
        const [existingCount] = await db.execute(
            'SELECT COUNT(*) as count FROM expenses WHERE user_id = ?', 
            [req.user.id]
        );
        
        // Delete all expenses
        await db.execute('DELETE FROM expenses WHERE user_id = ?', [req.user.id]);
        
        console.log(`🗑️ Deleted ${existingCount[0].count} expenses for user ${req.user.id}`);
        
        res.json({ 
            success: true, 
            message: `Successfully deleted ${existingCount[0].count} transactions`,
            deletedCount: existingCount[0].count
        });
        
    } catch (error) {
        console.error('Clear all error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// @route   GET api/upload/stats
// @desc    Get upload statistics
router.get('/stats', auth, async (req, res) => {
    try {
        const [result] = await db.execute(`
            SELECT 
                COUNT(*) as total_transactions,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
                COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
                MIN(date) as earliest_date,
                MAX(date) as latest_date
            FROM expenses 
            WHERE user_id = ?
        `, [req.user.id]);
        
        res.json({
            success: true,
            stats: result[0]
        });
        
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ 
            success: false, 
            message: error.message 
        });
    }
});

// @route   POST api/upload/categorize-preview
// @desc    Get AI suggestions for transaction categorization
router.post('/categorize-preview', auth, async (req, res) => {
  const { transactions } = req.body;
  // transactions = [{ description, amount }, ...]

  if (!transactions || transactions.length === 0) {
    return res.status(400).json({ error: 'No transactions provided' });
  }

  try {
    // Fetch this user's categories
    const categories = await Category.findAll(req.user.id);

    // Only send uncategorized ones to Gemini (max 20 at a time to manage tokens)
    const batch = transactions.slice(0, 20);

    const prompt = buildCategorizationPrompt(batch, categories);
    const rawResponse = await geminiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    // Map results back to original transactions
    const enriched = batch.map((t, i) => {
      const match = parsed.categorizations.find(c => c.index === i);
      return {
        ...t,
        suggested_category: match?.category_name || null,
        suggested_category_id: match?.category_id || null,
        confidence: match?.confidence || 'low'
      };
    });

    res.json({ transactions: enriched });
  } catch (err) {
    console.error('❌ Categorization error:', err.message);
    
    // If Gemini fails, return transactions without categorization
    // This allows the upload to continue with manual categorization
    const fallbackTransactions = transactions.map(t => ({
      ...t,
      suggested_category: null,
      suggested_category_id: null,
      confidence: 'none'
    }));
    
    console.log('🔄 Using fallback categorization (no AI suggestions)');
    res.json({ 
      transactions: fallbackTransactions,
      fallback: true,
      message: 'AI categorization unavailable - please categorize manually'
    });
  }
});

module.exports = router;