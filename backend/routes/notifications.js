// backend/routes/notifications.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET api/notifications
// @desc    Get user notifications
router.get('/', auth, async (req, res) => {
    try {
        console.log('📨 Fetching notifications for user:', req.user.id);
        const notifications = await Notification.getUserNotifications(req.user.id);
        res.json(notifications);
    } catch (err) {
        console.error('❌ Error in GET /notifications:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});
// @route   GET api/notifications/unread-count
// @desc    Get unread notifications count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.getUnreadCount(req.user.id);
        res.json({ count });
    } catch (err) {
        console.error('❌ Error in GET /unread-count:', err);
        res.status(500).json({ count: 0, error: err.message });
    }
});
// @route   GET api/notifications/preferences
// @desc    Get user notification preferences
router.get('/preferences', auth, async (req, res) => {
    try {
        const preferences = await Notification.getUserPreferences(req.user.id);
        res.json(preferences);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/notifications/preferences
// @desc    Update notification preferences
router.put('/preferences', auth, async (req, res) => {
    try {
        const updated = await Notification.updatePreferences(req.user.id, req.body);
        res.json({ 
            success: true, 
            message: 'Preferences updated successfully' 
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/notifications/:id/read
// @desc    Mark notification as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.markAsRead(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/notifications/mark-all-read
// @desc    Mark all notifications as read
router.put('/mark-all-read', auth, async (req, res) => {
    try {
        const count = await Notification.markAllAsRead(req.user.id);
        res.json({ success: true, count });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE api/notifications/:id
// @desc    Delete notification
router.delete('/:id', auth, async (req, res) => {
    try {
        await Notification.delete(req.params.id, req.user.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/notifications/test
// @desc    Send test notification
router.post('/test', auth, async (req, res) => {
    try {
        await Notification.createAndNotify({
            user_id: req.user.id,
            type: 'system',
            title: '🔔 Test Notification',
            message: 'This is a test notification to verify your notification settings.',
            channel: 'in_app'
        });
        
        res.json({ success: true, message: 'Test notification sent' });
    } catch (err) {
        console.error('❌ Error in POST /test:', err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;