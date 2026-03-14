-- ============================================
-- BACKUP SCRIPT - Export your data before reset
-- Run this before any destructive operations
-- ============================================

USE expense_tracker;

-- ============================================
-- 1. BACKUP USERS
-- ============================================
SELECT '--- USERS TABLE ---' as 'BACKUP';
SELECT * FROM users;

-- ============================================
-- 2. BACKUP CATEGORIES
-- ============================================
SELECT '--- CATEGORIES TABLE ---' as 'BACKUP';
SELECT * FROM categories;

-- ============================================
-- 3. BACKUP EXPENSES
-- ============================================
SELECT '--- EXPENSES TABLE ---' as 'BACKUP';
SELECT * FROM expenses ORDER BY date DESC LIMIT 50;

-- ============================================
-- 4. BACKUP SUMMARY
-- ============================================
SELECT '--- DATABASE SUMMARY ---' as 'BACKUP';
SELECT 'Users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses;

-- ============================================
-- 5. EXPORT TO CSV (if you have FILE privilege)
-- ============================================
-- Note: This requires FILE privilege and may need path changes
-- SELECT * FROM users 
-- INTO OUTFILE 'C:/ProgramData/MySQL/MySQL Server 8.0/Uploads/users_backup.csv'
-- FIELDS TERMINATED BY ',' 
-- ENCLOSED BY '"'
-- LINES TERMINATED BY '\n';