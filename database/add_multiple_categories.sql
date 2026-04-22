-- ============================================
-- UPDATE SCRIPT: Add Multiple Category Support for Income
-- This script adds support for multiple categories per income/expense entry
-- ============================================

USE expense_tracker;

-- ============================================
-- 1. CREATE JUNCTION TABLE FOR MULTIPLE CATEGORIES
-- ============================================
CREATE TABLE expense_categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    expense_id INT NOT NULL,
    category_id INT NOT NULL,
    percentage DECIMAL(5,2) DEFAULT 100.00, -- For splitting amounts across categories
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    UNIQUE KEY unique_expense_category (expense_id, category_id),
    INDEX idx_expense (expense_id),
    INDEX idx_category (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. MIGRATE EXISTING SINGLE CATEGORIES TO JUNCTION TABLE
-- ============================================
INSERT INTO expense_categories (expense_id, category_id, percentage)
SELECT id, category_id, 100.00 FROM expenses;

-- ============================================
-- 3. ADD NEW INCOME-SPECIFIC CATEGORIES
-- ============================================
INSERT INTO categories (name, icon, color, is_default) VALUES
('Salary', '💼', '#48C774', TRUE),
('Freelance', '💻', '#667EEA', TRUE),
('Business', '🏢', '#ED8936', TRUE),
('Investments', '📈', '#9F7AEA', TRUE),
('Rental Income', '🏠', '#F56565', TRUE),
('Side Hustle', '🚀', '#00D4AA', TRUE),
('Bonus', '🎁', '#FF6B6B', TRUE),
('Commission', '📊', '#4ECDC4', TRUE);

-- ============================================
-- 4. UPDATE EXPENSES TABLE TO ALLOW NULL CATEGORY_ID (for backward compatibility)
-- ============================================
ALTER TABLE expenses MODIFY COLUMN category_id INT NULL;

-- ============================================
-- 5. ADD INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX idx_expense_categories_expense ON expense_categories(expense_id);
CREATE INDEX idx_expense_categories_category ON expense_categories(category_id);

-- ============================================
-- 6. VERIFICATION QUERIES
-- ============================================
SELECT '✅ Multiple category support added successfully!' as 'Status';
SELECT COUNT(*) as 'Total Expenses Migrated' FROM expense_categories;
SELECT COUNT(*) as 'New Income Categories Added' FROM categories WHERE name IN ('Salary', 'Freelance', 'Business', 'Investments', 'Rental Income', 'Side Hustle', 'Bonus', 'Commission');