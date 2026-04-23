// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AIService = require('../services/aiService');
const AISuggestion = require('../models/AISuggestion');
const WeeklyDigest = require('../models/WeeklyDigest');
const { generateDigestForUser, runDigestForAllUsers, getWeekRange } = require('../services/weeklyDigestService');
const Expense = require('../models/Expense');
const UserModel = require('../models/User');
const geminiService = require('../services/geminiService');
const db = require('../config/db');

const isMissingTableError = (err) =>
    err && (err.code === 'ER_NO_SUCH_TABLE' || String(err.message || '').includes("doesn't exist"));


// @route   GET api/ai/insights
// @desc    Get AI-powered spending insights
router.get('/insights', auth, async (req, res) => {
    try {
        const insights = await AIService.generateInsights(req.user.id);
        res.json(insights);
    } catch (err) {
        console.error('AI Insights Error:', err);
        res.status(500).json({ message: 'Error generating insights', error: err.message });
    }
});

// Temporary test route for Phase 1
router.get('/test-prompt', auth, async (req, res) => {
    try {
        const result = await AIService.generateInsights(req.user.id);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// @route   GET api/ai/patterns
// @desc    Get spending patterns
router.get('/patterns', auth, async (req, res) => {
    try {
        const expenses = await Expense.findByUserId(req.user.id);
        const categorySummary = await Expense.getCategorySummary(
            req.user.id,
            new Date().getMonth() + 1,
            new Date().getFullYear()
        );
        const patterns = await AIService.detectPatterns(expenses, categorySummary);
        res.json(patterns);
    } catch (err) {
        console.error('Pattern detection error:', err);
        res.status(500).json({ message: 'Error detecting patterns' });
    }
});

// @route   GET api/ai/forecast
// @desc    Get spending forecast
router.get('/forecast', auth, async (req, res) => {
    try {
        const expenses = await Expense.findByUserId(req.user.id);
        const forecast = await AIService.forecastSpending(expenses);
        res.json(forecast);
    } catch (err) {
        console.error('Forecast error:', err);
        res.status(500).json({ message: 'Error generating forecast' });
    }
});

// @route   GET api/ai/anomalies
// @desc    Detect spending anomalies
router.get('/anomalies', auth, async (req, res) => {
    try {
        const expenses = await Expense.findByUserId(req.user.id);
        const anomalies = await AIService.detectAnomalies(expenses);
        res.json(anomalies);
    } catch (err) {
        console.error('Anomaly detection error:', err);
        res.status(500).json({ message: 'Error detecting anomalies' });
    }
});

// @route   GET api/ai/savings
// @desc    Find savings opportunities
router.get('/savings', auth, async (req, res) => {
    try {
        const categorySummary = await Expense.getCategorySummary(
            req.user.id,
            new Date().getMonth() + 1,
            new Date().getFullYear()
        );
        const savings = await AIService.findSavingsOpportunities(categorySummary);
        res.json(savings);
    } catch (err) {
        console.error('Savings opportunities error:', err);
        res.status(500).json({ message: 'Error finding savings opportunities' });
    }
});

// @route   GET api/ai/gemini-insights
// @desc    Get advanced Gemini AI-powered insights
router.get('/gemini-insights', auth, async (req, res) => {
    try {
        const user = await UserModel.findById(req.user.id);
        const expenses = await Expense.findByUserId(req.user.id);
        const insights = await Expense.getSpendingInsights(req.user.id);

        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        const categorySummary = await Expense.getCategorySummary(req.user.id, currentMonth, currentYear);

        // Validate data structure before sending to Gemini
        if (!expenses || expenses.length === 0) {
            return res.json({
                success: false,
                message: 'No expense data available for AI analysis',
                fallback: 'Basic AI insights available at /api/ai/insights'
            });
        }

        const geminiData = {
            expenses,
            categorySummary: categorySummary || [],
            user: user || {},
            insights: insights || {}
        };

        const geminiResult = await geminiService.generateFinancialInsights(geminiData);

        if (geminiResult) {
            // Check if there's an error in the result
            if (geminiResult.error) {
                res.json({
                    success: false,
                    message: geminiResult.error === 'API quota exceeded'
                        ? 'Gemini API quota exceeded. Please try again later or upgrade your plan.'
                        : 'Gemini API key configuration issue. Please check your API key.',
                    fallback: 'Basic AI insights available at /api/ai/insights',
                    error: geminiResult.error
                });
            } else {
                res.json({
                    success: true,
                    ...geminiResult,
                    timestamp: new Date().toISOString()
                });
            }
        } else {
            res.json({
                success: false,
                message: 'Gemini API not available or not configured',
                fallback: 'Basic AI insights available at /api/ai/insights'
            });
        }
    } catch (err) {
        console.error('Gemini insights error:', err);
        res.status(500).json({
            success: false,
            message: 'Error generating Gemini insights',
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   GET api/ai/weekly-digest
// @desc    Get this week's digest (or trigger generation if missing)
router.get('/weekly-digest', auth, async (req, res) => {
  try {
    await generateDigestForUser(req.user.id); // generate if not exists
    const weekRange = getWeekRange();

    const [rows] = await db.query(
      'SELECT * FROM weekly_digests WHERE user_id = ? AND week_start = ?',
      [req.user.id, weekRange.start]
    );

    if (rows.length === 0) {
      return res.json({ digest: null, message: 'No transactions this week to analyze' });
    }

    res.json({
      digest: {
        headline: rows[0].summary_text,
        bullets: JSON.parse(rows[0].insights),
        week_start: rows[0].week_start,
        week_end: rows[0].week_end
      }
    });
  } catch (err) {
        if (isMissingTableError(err)) {
            return res.json({ digest: null, message: 'Weekly digest storage not initialized yet' });
        }
    res.status(500).json({ error: err.message });
  }
});

// @route   GET api/ai/weekly-digests
// @desc    Get all weekly digests
router.get('/weekly-digests', auth, async (req, res) => {
    try {
        const digests = await WeeklyDigest.getForUser(req.user.id);
        res.json(digests);
    } catch (err) {
        if (isMissingTableError(err)) {
            return res.json([]);
        }
        res.status(500).json({ error: err.message });
    }
});

// @route   POST api/ai/generate-weekly-digest
// @desc    Manually generate weekly digest (for testing)
router.post('/generate-weekly-digest', auth, async (req, res) => {
    try {
        await generateDigestForUser(req.user.id);
        res.json({ success: true, message: 'Weekly digest generated' });
    } catch (err) {
        if (isMissingTableError(err)) {
            return res.json({ success: false, message: 'Weekly digest storage not initialized yet' });
        }
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
