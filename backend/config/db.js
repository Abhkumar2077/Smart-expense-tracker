// backend/config/db.js
const mysql = require('mysql2');
require('dotenv').config();

// Log database connection attempt (without password)
console.log('🔌 Connecting to database:', {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    database: process.env.DB_NAME || 'expense_tracker'
});

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expense_tracker',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

const promisePool = pool.promise();

// Test database connection
const testConnection = async () => {
    try {
        const [rows] = await promisePool.query('SELECT 1 + 1 AS solution');
        console.log('✅ Database connected successfully');
        console.log('📊 Database:', process.env.DB_NAME || 'expense_tracker');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('Please check:');
        console.error('1. MySQL is running');
        console.error('2. Database credentials in .env file');
        console.error('3. Database "expense_tracker" exists');
        return false;
    }
};

// Call test connection
testConnection();

module.exports = promisePool;