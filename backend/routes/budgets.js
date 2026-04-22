const express = require('express');
const { body, query, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Budget = require('../models/Budget');

const router = express.Router();

router.post(
    '/',
    [
        auth,
        body('category_id').isInt({ min: 1 }).withMessage('category_id must be a positive integer'),
        body('monthly_limit').isFloat({ gt: 0 }).withMessage('monthly_limit must be greater than 0'),
        body('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('month must be in YYYY-MM format')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const month = Budget.normalizeMonth(req.body.month);
            const budget = await Budget.upsert({
                user_id: req.user.id,
                category_id: req.body.category_id,
                monthly_limit: req.body.monthly_limit,
                month
            });

            const status = await Budget.getCategoryStatus(req.user.id, req.body.category_id, month);

            return res.json({
                success: true,
                budget,
                status
            });
        } catch (error) {
            console.error('Error saving budget:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
);

router.get(
    '/status',
    [auth, query('month').optional().matches(/^\d{4}-\d{2}$/).withMessage('month must be in YYYY-MM format')],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const month = Budget.normalizeMonth(req.query.month);
            const status = await Budget.getStatusByMonth(req.user.id, month);
            return res.json(status);
        } catch (error) {
            console.error('Error fetching budget status:', error);
            return res.status(500).json({ message: 'Server error' });
        }
    }
);

module.exports = router;
