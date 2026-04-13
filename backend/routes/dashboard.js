// backend/routes/dashboard.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Expense = require('../models/Expense');
const Goal = require('../models/Goal');
const Reminder = require('../models/Reminder');
const User = require('../models/User');
const AIService = require('../services/aiService');

// @route   GET api/dashboard/summary
// @desc    Get comprehensive dashboard summary
router.get('/summary', auth, async (req, res) => {
    try {
        const { timeRange = 'month', month, year } = req.query;
        const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        const currentYear = year ? parseInt(year) : new Date().getFullYear();

        console.log(`📊 Fetching dashboard summary for user ${req.user.id}, timeRange: ${timeRange}, month: ${currentMonth}, year: ${currentYear}`);

        let summary = {};
        let insights = {};
        let goals = [];
        let reminders = [];
        let aiInsights = {};

        // Get financial data based on time range
        if (timeRange === 'month') {
            const expenseSummary = await Expense.getCategorySummary(req.user.id, currentMonth, currentYear);
            const monthlySummary = await Expense.getMonthlySummary(req.user.id, currentYear);
            const spendingInsights = await Expense.getSpendingInsights(req.user.id);

            summary = {
                category_summary: expenseSummary || [],
                monthly_summary: monthlySummary || [],
                total_income: expenseSummary.reduce((sum, cat) => sum + (parseFloat(cat.total_income) || 0), 0),
                total_expenses: expenseSummary.reduce((sum, cat) => sum + (parseFloat(cat.total_expense || cat.total_amount) || 0), 0),
                current_month: currentMonth,
                current_year: currentYear
            };

            insights = spendingInsights;
        } else if (timeRange === 'year') {
            // Get yearly data
            const yearlyPromises = [];
            for (let m = 1; m <= 12; m++) {
                yearlyPromises.push(
                    Expense.getCategorySummary(req.user.id, m, currentYear).catch(() => ({
                        category_summary: [],
                        monthly_summary: []
                    }))
                );
            }

            const results = await Promise.all(yearlyPromises);
            let totalIncome = 0;
            let totalExpenses = 0;
            let activeMonths = 0;

            results.forEach((res, index) => {
                if (res && res.length > 0) {
                    const monthIncome = res.reduce((sum, cat) => sum + (parseFloat(cat.total_income) || 0), 0);
                    const monthExpense = res.reduce((sum, cat) => sum + (parseFloat(cat.total_expense || cat.total_amount) || 0), 0);

                    if (monthIncome > 0 || monthExpense > 0) {
                        activeMonths++;
                    }

                    totalIncome += monthIncome;
                    totalExpenses += monthExpense;
                }
            });

            summary = {
                total_income: totalIncome,
                total_expenses: totalExpenses,
                total_savings: totalIncome - totalExpenses,
                active_months: activeMonths,
                avg_monthly_income: activeMonths > 0 ? totalIncome / activeMonths : 0,
                avg_monthly_expenses: activeMonths > 0 ? totalExpenses / activeMonths : 0,
                current_year: currentYear
            };
        } else {
            // All time data
            const allExpenses = await Expense.findByUserId(req.user.id);
            const income = allExpenses.filter(e => e.type === 'income')
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            const expense = allExpenses.filter(e => e.type === 'expense')
                .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

            summary = {
                total_income: income,
                total_expenses: expense,
                total_savings: income - expense,
                total_transactions: allExpenses.length,
                active_months: new Set(allExpenses.map(e => `${new Date(e.date).getFullYear()}-${new Date(e.date).getMonth() + 1}`)).size
            };
        }

        // Get goals
        try {
            const goalsData = await Goal.findByUserId(req.user.id);
            goals = goalsData || [];
        } catch (err) {
            console.log('⚠️ Goals not available:', err.message);
        }

        // Get upcoming reminders
        try {
            const remindersData = await Reminder.findByUserId(req.user.id);
            reminders = remindersData.filter(r => !r.is_paid && new Date(r.due_date) >= new Date()) || [];
        } catch (err) {
            console.log('⚠️ Reminders not available:', err.message);
        }

        // Get AI insights
        try {
            aiInsights = await AIService.generateInsights(req.user.id);
        } catch (err) {
            console.log('⚠️ AI insights not available:', err.message);
            aiInsights = { suggestions: [], patterns: [], forecast: {} };
        }

        // Get user profile
        const user = await User.findById(req.user.id);

        // Get recent expenses
        let recentExpenses = [];
        try {
            recentExpenses = await Expense.findByUserId(req.user.id, null, null, 5);
        } catch (err) {
            console.log('⚠️ Recent expenses not available:', err.message);
        }

        const dashboardData = {
            summary,
            insights,
            goals,
            reminders: reminders.slice(0, 5), // Limit to 5 upcoming reminders
            ai_insights: aiInsights,
            recent_expenses: recentExpenses,
            user: {
                name: user.name,
                email: user.email,
                monthly_budget: user.monthly_budget,
                currency: user.currency || 'INR'
            },
            time_range: timeRange,
            timestamp: new Date().toISOString()
        };

        console.log('✅ Dashboard summary generated successfully');
        res.json(dashboardData);

    } catch (err) {
        console.error('❌ Error in dashboard summary endpoint:', err);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: err.message
        });
    }
});

module.exports = router;