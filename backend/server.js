// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const cron = require('node-cron');
const { runDigestForAllUsers } = require('./services/weeklyDigestService');
const app = express();

// Start scheduler
// Runs every Monday at 7:00 AM
cron.schedule('0 7 * * 1', async () => {
  await runDigestForAllUsers();
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log environment

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/reminders', require('./routes/reminders'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/suggestions', require('./routes/suggestions'));
app.use('/api/budgets', require('./routes/budgets'));

// Test database connection
const testDBConnection = async () => {
    try {
        await db.query('SELECT 1 + 1 AS solution');
        return true;
    } catch (err) {
        console.error('❌ Database connection failed:', err.message);
        console.error('Please check:');
        console.error('1. MySQL is running');
        console.error('2. Database credentials in .env file');
        console.error('3. Database "expense_tracker" exists');
        return false;
    }
};

testDBConnection();

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
});

module.exports = {
    app,
    server
}
