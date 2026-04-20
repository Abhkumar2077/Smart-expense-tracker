// backend/routes/suggestions.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const AISuggestion = require('../models/AISuggestion');

// Get all pending suggestions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const suggestions = await AISuggestion.getPending(req.user.id);
    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Accept or reject a suggestion
router.patch('/:id/decide', authMiddleware, async (req, res) => {
  const { status } = req.body; // 'accepted' or 'rejected'

  if (!['accepted', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status must be accepted or rejected' });
  }

  try {
    const success = await AISuggestion.decide(req.params.id, req.user.id, status);
    if (!success) return res.status(404).json({ error: 'Suggestion not found' });
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get decision history
router.get('/history', authMiddleware, async (req, res) => {
  try {
    const history = await AISuggestion.getHistory(req.user.id);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;