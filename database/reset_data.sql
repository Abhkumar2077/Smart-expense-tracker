-- ============================================
-- RESET DATA - Deletes all data but keeps tables
-- USE WITH CAUTION - This cannot be undone!
-- ============================================

USE expense_tracker;

-- ============================================
-- 1. DISABLE FOREIGN KEY CHECKS
-- ============================================
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================
-- 2. DELETE ALL DATA (in correct order)
-- ============================================
DELETE FROM expenses;
DELETE FROM bill_reminders;
DELETE FROM savings_goals;
DELETE FROM email_logs;
DELETE FROM notification_preferences;
DELETE FROM categories WHERE is_default = FALSE; -- Delete only custom categories
DELETE FROM users;

-- ============================================
-- 3. RESET AUTO-INCREMENT COUNTERS
-- ============================================
ALTER TABLE expenses AUTO_INCREMENT = 1;
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE categories AUTO_INCREMENT = 1;

-- ============================================
-- 4. RE-ENABLE FOREIGN KEY CHECKS
-- ============================================
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================
-- 5. VERIFY DATA IS CLEARED
-- ============================================
SELECT '✅ All data cleared!' as 'Status';
SELECT 'Users' as table_name, COUNT(*) as remaining FROM users
UNION ALL
SELECT 'Categories', COUNT(*) FROM categories
UNION ALL
SELECT 'Expenses', COUNT(*) FROM expenses;