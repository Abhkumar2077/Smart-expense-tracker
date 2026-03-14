const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

router.get('/', auth, async (req, res) => {
    try {
        const goals = await Goal.findByUserId(req.user.id);
        res.json(goals);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const goalId = await Goal.create({ ...req.body, user_id: req.user.id });
        res.json({ id: goalId, message: 'Goal created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        await Goal.update(req.params.id, req.user.id, req.body);
        res.json({ message: 'Goal updated successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Goal.delete(req.params.id, req.user.id);
        res.json({ message: 'Goal deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
