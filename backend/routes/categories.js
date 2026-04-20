const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Category = require('../models/Category');

// @route   GET api/categories
// @desc    Get all categories for user
router.get('/', auth, async (req, res) => {
    try {
        console.log('Fetching categories for user:', req.user.id);
        const categories = await Category.getAll(req.user.id);
        res.json(categories);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   GET api/categories/suggestions
// @desc    Get category suggestions based on user's transactions
router.get('/suggestions', auth, async (req, res) => {
    try {
        const suggestions = await Category.getSuggestions(req.user.id);
        res.json(suggestions);
    } catch (err) {
        console.error('Error getting suggestions:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET api/categories/popular
// @desc    Get popular categories from other users
router.get('/popular', auth, async (req, res) => {
    try {
        const popular = await Category.getPopularCategories();
        res.json(popular);
    } catch (err) {
        console.error('Error getting popular categories:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST api/categories
// @desc    Create a custom category
router.post('/', auth, async (req, res) => {
    try {
        console.log('Creating category with data:', req.body);
        
        const { name, color, icon } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Category name is required' });
        }
        
        const categoryData = {
            user_id: req.user.id,
            name: name.trim(),
            color: color || '#808080',
            icon: icon || '\uD83D\uDCCC'
        };
        
        console.log('Category data:', categoryData);
        
        const category = await Category.create(categoryData);
        
        console.log('Category created:', category);
        res.status(201).json(category);
        
    } catch (err) {
        console.error('Error creating category:', err);
        
        // Handle specific error messages
        if (err.message === 'Category already exists') {
            return res.status(400).json({ message: 'A category with this name already exists' });
        }
        
        if (err.message.includes('user_id column does not exist')) {
            return res.status(500).json({ 
                message: 'Database migration required', 
                error: err.message 
            });
        }
        
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   PUT api/categories/:id
// @desc    Update a custom category
router.put('/:id', auth, async (req, res) => {
    try {
        const { name, color, icon } = req.body;
        
        if (!name || name.trim() === '') {
            return res.status(400).json({ message: 'Category name is required' });
        }
        
        const updated = await Category.update(req.params.id, req.user.id, {
            name: name.trim(),
            color,
            icon
        });
        
        if (!updated) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        console.error('Error updating category:', err);
        
        if (err.message === 'Another category with this name already exists') {
            return res.status(400).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   DELETE api/categories/:id
// @desc    Delete a custom category
router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await Category.delete(req.params.id, req.user.id);
        
        if (!deleted) {
            return res.status(404).json({ message: 'Category not found' });
        }
        
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        console.error('Error deleting category:', err);
        
        if (err.message === 'Cannot delete category that has transactions') {
            return res.status(400).json({ message: err.message });
        }
        
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   POST api/categories/init-defaults
// @desc    Initialize default categories (temporary fix)
router.post('/init-defaults', auth, async (req, res) => {
    try {
        const result = await Category.initializeDefaults();
        res.json({ success: true, message: 'Default categories initialized', ...result });
    } catch (error) {
        console.error('Error initializing defaults:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// @route   GET api/categories/migration/check
// @desc    Check whether migrations are needed for categories table
router.get('/migration/check', auth, async (req, res) => {
    try {
        const status = await Category.checkMigrationNeeded();
        res.json(status);
    } catch (err) {
        console.error('Error checking migration status:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// @route   POST api/categories/migration/run
// @desc    Run migration to add missing columns
router.post('/migration/run', auth, async (req, res) => {
    try {
        const result = await Category.runMigration();
        res.json(result);
    } catch (err) {
        console.error('Error running migration:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

module.exports = router;
