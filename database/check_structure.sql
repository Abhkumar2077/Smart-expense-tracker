-- ============================================
-- DATABASE DIAGNOSTIC - Check current structure
-- Run this to see what's in your database
-- ============================================

USE expense_tracker;

-- ============================================
-- 1. CHECK ALL TABLES
-- ============================================
SELECT '=== DATABASE TABLES ===' as 'INFO';
SHOW TABLES;

-- ============================================
-- 2. CHECK USERS TABLE
-- ============================================
SELECT '\n=== USERS TABLE STRUCTURE ===' as 'INFO';
DESCRIBE users;
SELECT '\n=== USERS COUNT ===' as 'INFO';
SELECT COUNT(*) as user_count FROM users;
SELECT id, email, name FROM users LIMIT 5;

-- ============================================
-- 3. CHECK CATEGORIES TABLE
-- ============================================
SELECT '\n=== CATEGORIES TABLE STRUCTURE ===' as 'INFO';
DESCRIBE categories;
SELECT '\n=== CATEGORIES ===' as 'INFO';
SELECT id, name, user_id, is_default, usage_count FROM categories;

-- ============================================
-- 4. CHECK EXPENSES TABLE
-- ============================================
SELECT '\n=== EXPENSES TABLE STRUCTURE ===' as 'INFO';
DESCRIBE expenses;
SELECT '\n=== EXPENSES SUMMARY ===' as 'INFO';
SELECT 
    COUNT(*) as total_transactions,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count
FROM expenses;

-- ============================================
-- 5. CHECK FOREIGN KEYS
-- ============================================
SELECT '\n=== BUDGETS TABLE STRUCTURE ===' as 'INFO';
DESCRIBE budgets;
SELECT '\n=== BUDGETS SUMMARY ===' as 'INFO';
SELECT user_id, category_id, month, monthly_limit FROM budgets ORDER BY month DESC LIMIT 20;

-- ============================================
-- 6. CHECK FOREIGN KEYS
-- ============================================
SELECT '\n=== FOREIGN KEYS ===' as 'INFO';
SELECT 
    CONSTRAINT_NAME,
    TABLE_NAME,
    COLUMN_NAME,
    REFERENCED_TABLE_NAME,
    REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE CONSTRAINT_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IS NOT NULL;

-- ============================================
-- 7. DATABASE SIZE
-- ============================================
SELECT '\n=== DATABASE SIZE ===' as 'INFO';
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = DATABASE()
ORDER BY size_mb DESC;