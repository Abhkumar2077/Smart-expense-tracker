// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const User = require('../models/User');

// @route   POST api/expenses
// @desc    Create an expense or income
router.post('/', [
    auth,
    body('category_id').notEmpty().withMessage('Category is required'),
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('date').isDate().withMessage('Valid date is required'),
    body('type').optional().isIn(['expense', 'income']).withMessage('Type must be expense or income')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const expenseData = {
            user_id: req.user.id,
            ...req.body,
            type: req.body.type || 'expense'
        };

        const expenseId = await Expense.create(expenseData);
        const expense = await Expense.findById(expenseId, req.user.id);
        
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/expenses
// @desc    Get all expenses for user
router.get('/', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const expenses = await Expense.findByUserId(req.user.id, startDate, endDate);
        res.json(expenses);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/expenses/summary
// @desc    Get expense summary with daily breakdown
router.get('/summary', auth, async (req, res) => {
    try {
        const { month, year } = req.query;
        const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        console.log(`📊 Fetching summary for user ${req.user.id}, month ${currentMonth}, year ${currentYear}`);

        const categorySummary = await Expense.getCategorySummary(req.user.id, currentMonth, currentYear);
        const monthlySummary = await Expense.getMonthlySummary(req.user.id, currentYear);
        
        // Get daily summary if available
        let dailySummary = [];
        try {
            dailySummary = await Expense.getDailySummary(req.user.id, currentMonth, currentYear);
        } catch (err) {
            console.log('⚠️ Daily summary not available:', err.message);
        }
        
        res.json({
            success: true,
            category_summary: categorySummary || [],
            monthly_summary: monthlySummary || [],
            daily_summary: dailySummary || [],
            current_month: currentMonth,
            current_year: currentYear
        });
    } catch (err) {
        console.error('❌ Error in summary endpoint:', err);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: err.message 
        });
    }
});

// @route   GET api/expenses/insights
// @desc    Get spending insights
router.get('/insights', auth, async (req, res) => {
    try {
        const insights = await Expense.getSpendingInsights(req.user.id);
        const user = await User.findById(req.user.id);
        
        // Generate suggestions
        const suggestions = [];
        
        if (user.monthly_budget > 0) {
            const spentPercentage = (insights.current_month.total_expenses / user.monthly_budget) * 100;
            if (spentPercentage > 80) {
                suggestions.push(`⚠️ You've spent ${spentPercentage.toFixed(0)}% of your monthly budget. Consider reducing expenses.`);
            }
        }

        const prevTotal = insights.previous_month?.total_expenses || 0;
        const currTotal = insights.current_month.total_expenses;
        
        if (prevTotal > 0) {
            const change = ((currTotal - prevTotal) / prevTotal * 100).toFixed(1);
            if (change > 0) {
                suggestions.push(`📈 Your spending increased by ${change}% compared to last month.`);
            } else if (change < 0) {
                suggestions.push(`📉 Great job! Your spending decreased by ${Math.abs(change)}% compared to last month.`);
            }
        }

        // Income insights
        if (insights.current_month.total_income > 0) {
            const savings = insights.current_month.total_income - insights.current_month.total_expenses;
            const savingsRate = (savings / insights.current_month.total_income * 100).toFixed(1);
            
            if (savings > 0) {
                suggestions.push(`💰 You saved ₹${savings.toFixed(0)} this month (${savingsRate}% of income). Great job!`);
            } else {
                suggestions.push(`⚠️ Your expenses (₹${insights.current_month.total_expenses}) exceeded income (₹${insights.current_month.total_income}). Try to reduce spending.`);
            }
        }

        res.json({
            ...insights,
            suggestions,
            monthly_budget: user.monthly_budget
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/expenses/budget
// @desc    Update monthly budget
router.put('/budget', [
    auth,
    body('monthly_budget').isNumeric().withMessage('Budget must be a number')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        await User.updateBudget(req.user.id, req.body.monthly_budget);
        res.json({ message: 'Budget updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/expenses/:id
// @desc    Update an expense
router.put('/:id', auth, async (req, res) => {
    try {
        const updated = await Expense.update(req.params.id, req.user.id, req.body);
        if (!updated) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        const expense = await Expense.findById(req.params.id, req.user.id);
        res.json(expense);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/expenses/:id
// @desc    Delete an expense
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await Expense.delete(req.params.id, req.user.id);
        if (!deleted) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/expenses/export
// @desc    Export expenses to CSV
router.get('/export/csv', auth, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const expenses = await Expense.findByUserId(req.user.id, startDate, endDate);
        
        let csv = 'Date,Type,Category,Description,Amount\n';
        expenses.forEach(exp => {
            csv += `${exp.date},${exp.type || 'expense'},${exp.category_name},${exp.description || ''},${exp.amount}\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=transactions.csv');
        res.send(csv);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;