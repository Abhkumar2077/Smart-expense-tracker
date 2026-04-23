// backend/routes/auth.js - Replace with this complete working version
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register user
router.post('/register', [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {

        // Check if user exists
        let user = await User.findByEmail(email);
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Create user
        const userId = await User.create({
            name,
            email,
            password_hash,
            monthly_budget: 0
        });

        // Create token
        const payload = {
            user: {
                id: userId
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) {
                    console.error('❌ JWT error:', err);
                    throw err;
                }
                res.json({
                    token,
                    user: {
                        id: userId,
                        name,
                        email,
                        monthly_budget: 0
                    }
                });
            }
        );
    } catch (err) {
        console.error('❌ Registration error:', err);
        res.status(500).json({ 
            message: 'Server error', 
            error: err.message,
            stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});

// @route   POST api/auth/login
router.post('/login', [
    body('email').isEmail().withMessage('Please include a valid email'),
    body('password').exists().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {

        // Check if user exists
        let user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Create token
        const payload = {
            user: {
                id: user.id
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '7d' },
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        monthly_budget: user.monthly_budget || 0
                    }
                });
            }
        );
    } catch (err) {
        console.error('❌ Login error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/auth/me
router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        res.json(user);
    } catch (err) {
        console.error('❌ Get user error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile
router.put('/profile', [
    require('../middleware/auth'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('Please include a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, email } = req.body;

    try {

        // Check if email is already taken by another user
        if (email) {
            const existingUser = await User.findByEmail(email);
            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({ message: 'Email already in use' });
            }
        }

        // Update user
        const updatedUser = await User.updateProfile(req.user.id, { name, email });
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                monthly_budget: updatedUser.monthly_budget
            }
        });
    } catch (err) {
        console.error('❌ Profile update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT api/auth/password
// @desc    Change user password
router.put('/password', [
    require('../middleware/auth'),
    body('currentPassword').exists().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    try {

        // Get user
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check current password
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const newPasswordHash = await bcrypt.hash(newPassword, salt);

        // Update password
        await User.updatePassword(req.user.id, newPasswordHash);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error('❌ Password update error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
