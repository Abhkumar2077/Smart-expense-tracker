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
        console.log('📝 Registration attempt:', email);

        // Check if user exists
        let user = await User.findByEmail(email);
        if (user) {
            console.log('❌ User already exists:', email);
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);
        console.log('✅ Password hashed');

        // Create user
        const userId = await User.create({
            name,
            email,
            password_hash,
            monthly_budget: 0
        });
        console.log('✅ User created with ID:', userId);

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
                console.log('✅ Token generated');
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
        console.log('📝 Login attempt:', email);

        // Check if user exists
        let user = await User.findByEmail(email);
        if (!user) {
            console.log('❌ User not found:', email);
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log('❌ Invalid password for:', email);
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
                console.log('✅ Login successful:', email);
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

module.exports = router;