-- ============================================
-- Smart Expense Tracker - Safe Schema Updates
-- Handles duplicate keys gracefully
-- ============================================

USE expense_tracker;

-- ============================================
-- 1. ADD MISSING COLUMNS TO CATEGORIES TABLE
-- ============================================

-- Check and add user_id column
SET @dbname = DATABASE();
SET @tablename = "categories";
SET @columnname = "user_id";
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT NULL AFTER id;")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add usage_count column
SET @columnname = "usage_count";
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " INT DEFAULT 0 AFTER color;")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add icon column
SET @columnname = "icon";
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " VARCHAR(50) DEFAULT '📌' AFTER name;")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Check and add last_used column
SET @columnname = "last_used";
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND COLUMN_NAME = @columnname) > 0,
    "SELECT 1",
    CONCAT("ALTER TABLE ", @tablename, " ADD COLUMN ", @columnname, " DATE NULL AFTER usage_count;")
));
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 2. ADD FOREIGN KEY CONSTRAINT (if not exists)
-- ============================================

-- Check if foreign key exists
SET @fk_exists = (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS 
                 WHERE CONSTRAINT_SCHEMA = @dbname 
                 AND TABLE_NAME = 'categories' 
                 AND CONSTRAINT_TYPE = 'FOREIGN KEY');

-- Add foreign key if it doesn't exist
SET @preparedStatement = IF(@fk_exists = 0,
    'ALTER TABLE categories ADD CONSTRAINT fk_categories_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
    'SELECT "Foreign key already exists" as "Status"');
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 3. UPDATE DEFAULT CATEGORIES
-- ============================================
UPDATE categories SET user_id = NULL WHERE is_default = TRUE;

-- ============================================
-- 4. REMOVE DUPLICATE CATEGORIES SAFELY
-- ============================================

-- Create temporary table to store which IDs to keep
DROP TEMPORARY TABLE IF EXISTS keep_categories;
CREATE TEMPORARY TABLE keep_categories AS
SELECT MIN(id) as id, name
FROM categories
WHERE is_default = TRUE
GROUP BY name;

-- Update expenses to point to the correct category IDs
UPDATE expenses e
JOIN categories c ON e.category_id = c.id
JOIN keep_categories k ON c.name = k.name
SET e.category_id = k.id
WHERE c.id != k.id AND c.is_default = TRUE;

-- Delete duplicate categories
DELETE c FROM categories c
LEFT JOIN keep_categories k ON c.id = k.id
WHERE k.id IS NULL AND c.is_default = TRUE;

DROP TEMPORARY TABLE keep_categories;

-- ============================================
-- 5. INSERT MISSING DEFAULT CATEGORIES (if any)
-- ============================================

-- Insert Food & Dining if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Food & Dining', '🍔', '#FF6B6B', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Food & Dining' AND is_default = TRUE);

-- Insert Transportation if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Transportation', '🚗', '#4ECDC4', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Transportation' AND is_default = TRUE);

-- Insert Shopping if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Shopping', '🛍️', '#45B7D1', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Shopping' AND is_default = TRUE);

-- Insert Entertainment if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Entertainment', '🎬', '#96CEB4', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Entertainment' AND is_default = TRUE);

-- Insert Bills & Utilities if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Bills & Utilities', '📄', '#FFEAA7', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Bills & Utilities' AND is_default = TRUE);

-- Insert Healthcare if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Healthcare', '🏥', '#DDA0DD', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Healthcare' AND is_default = TRUE);

-- Insert Education if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Education', '📚', '#98D8C8', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Education' AND is_default = TRUE);

-- Insert Groceries if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Groceries', '🛒', '#FF9F1C', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Groceries' AND is_default = TRUE);

-- Insert Travel if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Travel', '✈️', '#A06AB4', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Travel' AND is_default = TRUE);

-- Insert Income if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Income', '💰', '#48C774', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Income' AND is_default = TRUE);

-- ============================================
-- 6. UPDATE EXISTING CATEGORIES WITH DEFAULT ICONS
-- ============================================

-- Update categories with default icons if they don't have one
UPDATE categories SET icon = '🍔' WHERE name = 'Food & Dining' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '🚗' WHERE name = 'Transportation' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '🛍️' WHERE name = 'Shopping' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '🎬' WHERE name = 'Entertainment' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '📄' WHERE name = 'Bills & Utilities' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '🏥' WHERE name = 'Healthcare' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '📚' WHERE name = 'Education' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '🛒' WHERE name = 'Groceries' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '✈️' WHERE name = 'Travel' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '💰' WHERE name = 'Income' AND (icon IS NULL OR icon = '');
UPDATE categories SET icon = '📌' WHERE name = 'Other' AND (icon IS NULL OR icon = '');

-- Set default icon for any category that still doesn't have one
UPDATE categories SET icon = '📌' WHERE icon IS NULL OR icon = '';

-- Insert Other if missing
INSERT INTO categories (name, icon, color, is_default)
SELECT 'Other', '📌', '#B0B0B0', TRUE
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = 'Other' AND is_default = TRUE);

-- ============================================
-- 6. ADD UNIQUE CONSTRAINT (Check first, then add)
-- ============================================

-- Check if the index already exists
SET @index_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS 
                    WHERE TABLE_SCHEMA = @dbname 
                    AND TABLE_NAME = 'categories' 
                    AND INDEX_NAME = 'unique_category_combo');

-- Drop the index only if it exists
SET @preparedStatement = IF(@index_exists > 0,
    'ALTER TABLE categories DROP INDEX unique_category_combo',
    'SELECT "Index does not exist, skipping drop" as "Status"');
PREPARE stmt FROM @preparedStatement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Now add the unique constraint (it will be new)
-- Using a try-catch style approach
SET @preparedStatement = 'ALTER TABLE categories ADD UNIQUE INDEX unique_category_combo (name, user_id)';
PREPARE stmt FROM @preparedStatement;

-- Execute with error handling
DECLARE CONTINUE HANDLER FOR 1061 SELECT "Index already exists, skipping" as "Status";
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ============================================
-- 7. VERIFY UPDATES
-- ============================================
SELECT '✅ Schema updates completed successfully!' as 'Status';
SELECT 'Categories table structure:' as 'Info';
DESCRIBE categories;
SELECT 'Categories list (no duplicates):' as 'Info';
SELECT id, name, icon, color, is_default, user_id FROM categories ORDER BY is_default DESC, name;
SELECT 
    COUNT(*) as total_categories, 
    SUM(CASE WHEN is_default = TRUE THEN 1 ELSE 0 END) as system_categories,
    SUM(CASE WHEN user_id IS NOT NULL THEN 1 ELSE 0 END) as custom_categories 
-- ============================================
-- 8. WEEKLY DIGESTS TABLE
-- ============================================

-- Create weekly_digests table if it doesn't exist
CREATE TABLE IF NOT EXISTS weekly_digests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    insights JSON NOT NULL,
    summary_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_week (user_id, week_start),
    UNIQUE KEY unique_user_week (user_id, week_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. BUDGETS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS budgets (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    monthly_limit DECIMAL(10,2) NOT NULL,
    month VARCHAR(7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_category_month (user_id, category_id, month),
    INDEX idx_budget_user_month (user_id, month),
    INDEX idx_budget_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;