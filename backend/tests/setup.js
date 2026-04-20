require('dotenv').config({ path: '.env.test' });

// Setup test database or mock if needed
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'expense_tracker_test';