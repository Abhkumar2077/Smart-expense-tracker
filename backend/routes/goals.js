// backend/routes/goals.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// Get all goals
router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.findByUserId(req.user.id);
        const stats = await Goal.getStats(req.user.id);
        res.json({ goals, stats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Create new goal
router.post('/', auth, async (req, res) => {
    try {
        const { name, target_amount, deadline, icon, color } = req.body;
        
        const goalId = await Goal.create({
            user_id: req.user.id,
            name,
            target_amount,
            deadline,
            icon: icon || '🎯',
            color: color || '#48c774'
        });
        
        const goals = await Goal.findByUserId(req.user.id);
        res.json({ success: true, goalId, goals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update goal progress
router.put('/:id', auth, async (req, res) => {
    try {
        const { current_amount } = req.body;
        await Goal.updateProgress(req.params.id, req.user.id, current_amount);
        
        const goals = await Goal.findByUserId(req.user.id);
        res.json({ success: true, goals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete goal
router.delete('/:id', auth, async (req, res) => {
    try {
        await Goal.delete(req.params.id, req.user.id);
        
        const goals = await Goal.findByUserId(req.user.id);
        res.json({ success: true, goals });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;