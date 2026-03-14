const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Reminder = require('../models/Reminder');

router.get('/', auth, async (req, res) => {
    try {
        const reminders = await Reminder.findByUserId(req.user.id);
        res.json(reminders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.post('/', auth, async (req, res) => {
    try {
        const reminderId = await Reminder.create({ ...req.body, user_id: req.user.id });
        res.json({ id: reminderId, message: 'Reminder created successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.put('/:id/paid', auth, async (req, res) => {
    try {
        await Reminder.markAsPaid(req.params.id, req.user.id);
        res.json({ message: 'Bill marked as paid' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        await Reminder.delete(req.params.id, req.user.id);
        res.json({ message: 'Reminder deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
