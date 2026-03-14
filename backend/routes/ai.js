// backend/routes/ai.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const AIService = require('../services/aiService');
const Expense = require('../models/Expense');

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

module.exports = router;