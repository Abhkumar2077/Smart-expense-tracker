const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmailService = require('../services/emailService');
const User = require('../models/User');

// Send weekly report
router.post('/send-weekly-report', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const result = await EmailService.sendWeeklyReport(
      req.user.id,
      user.email,
      user.name
    );
    res.json({ success: true, message: 'Weekly report sent!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;