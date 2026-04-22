-- ============================================
-- Smart Expense Tracker - Complete Database Schema v2.1
-- WITH INCOME/EXPENSE TYPE SUPPORT
-- ============================================

-- Drop database if exists (CAUTION: This deletes all data)
-- Comment this out if you want to preserve existing data
-- DROP DATABASE IF EXISTS expense_tracker;

-- Create fresh database
 CREATE DATABASE expense_tracker;
USE expense_tracker;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    monthly_budget DECIMAL(10,2) DEFAULT 0.00,
    currency VARCHAR(3) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 2. CATEGORIES TABLE (with Income category)
-- ============================================
CREATE TABLE categories (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(50) DEFAULT '📌',
    color VARCHAR(20) DEFAULT '#808080',
    is_default BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 3. EXPENSES TABLE (with TYPE column)
-- ============================================
CREATE TABLE expenses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description VARCHAR(255),
    date DATE NOT NULL,
    type ENUM('income', 'expense') DEFAULT 'expense',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    INDEX idx_user_date (user_id, date),
    INDEX idx_category (category_id),
    INDEX idx_date (date),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 4. BUDGETS TABLE
-- ============================================
CREATE TABLE budgets (
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

-- ============================================
-- 5. DEFAULT CATEGORIES (including Income)
-- ============================================
INSERT INTO categories (name, icon, color, is_default) VALUES
('Food & Dining', '🍔', '#FF6B6B', TRUE),
('Transportation', '🚗', '#4ECDC4', TRUE),
('Shopping', '🛍️', '#45B7D1', TRUE),
('Entertainment', '🎬', '#96CEB4', TRUE),
('Bills & Utilities', '📄', '#FFEAA7', TRUE),
('Healthcare', '🏥', '#DDA0DD', TRUE),
('Education', '📚', '#98D8C8', TRUE),
('Groceries', '🛒', '#FF9F1C', TRUE),
('Travel', '✈️', '#A06AB4', TRUE),
('Income', '💰', '#48C774', TRUE),
('Other', '📌', '#B0B0B0', TRUE);

-- ============================================
-- 6. SAVINGS GOALS TABLE
-- ============================================
CREATE TABLE savings_goals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_amount DECIMAL(10,2) NOT NULL,
    current_amount DECIMAL(10,2) DEFAULT 0,
    deadline DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_goals (user_id),
    INDEX idx_deadline (deadline)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 7. BILL REMINDERS TABLE
-- ============================================
CREATE TABLE bill_reminders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    bill_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    due_date DATE NOT NULL,
    category_id INT,
    recurring ENUM('one-time', 'monthly', 'yearly') DEFAULT 'one-time',
    status ENUM('pending', 'paid', 'skipped') DEFAULT 'pending',
    paid_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    INDEX idx_user_reminders (user_id),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 8. NOTIFICATION PREFERENCES TABLE
-- ============================================
CREATE TABLE notification_preferences (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    weekly_report BOOLEAN DEFAULT TRUE,
    monthly_report BOOLEAN DEFAULT TRUE,
    bill_reminders BOOLEAN DEFAULT TRUE,
    budget_alerts BOOLEAN DEFAULT TRUE,
    promotional_emails BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_prefs (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 9. INVESTMENT TRACKER TABLE
-- ============================================
CREATE TABLE investments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('stocks', 'mutual_funds', 'etf', 'bonds', 'fixed_deposit', 'gold', 'crypto', 'other') DEFAULT 'other',
    amount_invested DECIMAL(10,2) NOT NULL,
    current_value DECIMAL(10,2),
    purchase_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_investments (user_id),
    INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 10. MULTI-CURRENCY RATES TABLE
-- ============================================
CREATE TABLE currency_rates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    from_currency VARCHAR(3) NOT NULL,
    to_currency VARCHAR(3) NOT NULL,
    rate DECIMAL(10,4) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_currency_pair (from_currency, to_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default currency rates (INR base)
INSERT INTO currency_rates (from_currency, to_currency, rate) VALUES
('USD', 'INR', 83.50),
('EUR', 'INR', 90.20),
('GBP', 'INR', 105.30),
('JPY', 'INR', 0.56),
('SGD', 'INR', 62.10),
('INR', 'USD', 0.012),
('INR', 'EUR', 0.011),
('INR', 'GBP', 0.0095),
('INR', 'JPY', 1.79),
('INR', 'SGD', 0.016);

-- ============================================
-- 11. EMAIL REPORT LOGS TABLE
-- ============================================
CREATE TABLE email_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    report_type ENUM('weekly', 'monthly', 'custom') NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('sent', 'failed') DEFAULT 'sent',
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_logs (user_id),
    INDEX idx_sent_at (sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- 12. CREATE VIEWS FOR REPORTS (Updated with type)
-- ============================================

-- Monthly spending summary view with income/expense
CREATE OR REPLACE VIEW vw_monthly_summary AS
SELECT 
    user_id,
    YEAR(date) as year,
    MONTH(date) as month,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
    AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense,
    AVG(CASE WHEN type = 'income' THEN amount END) as avg_income
FROM expenses
GROUP BY user_id, YEAR(date), MONTH(date);

-- Category spending view with type
CREATE OR REPLACE VIEW vw_category_spending AS
SELECT 
    e.user_id,
    e.category_id,
    c.name as category_name,
    c.icon,
    c.color,
    COUNT(*) as transaction_count,
    SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) as total_expenses,
    SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END) as total_income
FROM expenses e
JOIN categories c ON e.category_id = c.id
GROUP BY e.user_id, e.category_id, c.name, c.icon, c.color;

-- Budget vs Actual view (updated)
CREATE OR REPLACE VIEW vw_budget_vs_actual AS
SELECT 
    u.id as user_id,
    u.monthly_budget,
    COALESCE(ms.total_expenses, 0) as actual_expenses,
    COALESCE(ms.total_income, 0) as actual_income,
    COALESCE(ms.total_income - ms.total_expenses, 0) as net_savings,
    CASE 
        WHEN u.monthly_budget > 0 
        THEN (COALESCE(ms.total_expenses, 0) / u.monthly_budget * 100)
        ELSE 0 
    END as percentage_used,
    GREATEST(u.monthly_budget - COALESCE(ms.total_expenses, 0), 0) as remaining_budget
FROM users u
LEFT JOIN vw_monthly_summary ms ON u.id = ms.user_id 
    AND ms.year = YEAR(CURDATE()) 
    AND ms.month = MONTH(CURDATE());

-- ============================================
-- 13. STORED PROCEDURES (Updated with type)
-- ============================================

-- Get spending insights for a user (updated with income)
DELIMITER //
CREATE PROCEDURE sp_get_spending_insights(IN p_user_id INT)
BEGIN
    -- Current month totals
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as current_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as current_income,
        COALESCE(COUNT(CASE WHEN type = 'expense' THEN 1 END), 0) as expense_count,
        COALESCE(COUNT(CASE WHEN type = 'income' THEN 1 END), 0) as income_count,
        COALESCE(AVG(CASE WHEN type = 'expense' THEN amount END), 0) as avg_expense,
        COALESCE(AVG(CASE WHEN type = 'income' THEN amount END), 0) as avg_income
    FROM expenses
    WHERE user_id = p_user_id
        AND MONTH(date) = MONTH(CURDATE())
        AND YEAR(date) = YEAR(CURDATE());
    
    -- Previous month totals
    SELECT 
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as previous_expenses,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as previous_income
    FROM expenses
    WHERE user_id = p_user_id
        AND MONTH(date) = MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
        AND YEAR(date) = YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH));
    
    -- Top spending category
    SELECT 
        c.name,
        c.icon,
        c.color,
        SUM(e.amount) as total
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = p_user_id
        AND e.type = 'expense'
        AND MONTH(e.date) = MONTH(CURDATE())
        AND YEAR(e.date) = YEAR(CURDATE())
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY total DESC
    LIMIT 1;
    
    -- Top income category
    SELECT 
        c.name,
        c.icon,
        c.color,
        SUM(e.amount) as total
    FROM expenses e
    JOIN categories c ON e.category_id = c.id
    WHERE e.user_id = p_user_id
        AND e.type = 'income'
        AND MONTH(e.date) = MONTH(CURDATE())
        AND YEAR(e.date) = YEAR(CURDATE())
    GROUP BY c.id, c.name, c.icon, c.color
    ORDER BY total DESC
    LIMIT 1;
END//
DELIMITER ;

-- ============================================
-- 14. TRIGGERS
-- ============================================

-- Auto-create notification preferences for new users
DELIMITER //
CREATE TRIGGER trg_after_user_insert
AFTER INSERT ON users
FOR EACH ROW
BEGIN
    INSERT INTO notification_preferences (user_id) VALUES (NEW.id);
END//
DELIMITER ;

-- ============================================
-- 15. CREATE A DEMO USER (Optional)
-- Password: demo123 (you'll need to hash this properly)
-- ============================================
-- INSERT INTO users (name, email, password_hash, monthly_budget, currency) 
-- VALUES ('Demo User', 'demo@example.com', '$2a$10$YourHashedPasswordHere', 50000, 'INR');

-- ============================================
-- 16. VERIFY INSTALLATION
-- ============================================
SELECT '✅ Smart Expense Tracker Database v2.1 with Income/Expense Support Complete!' as 'Status';
SELECT COUNT(*) as 'Total Tables' FROM information_schema.tables WHERE table_schema = 'expense_tracker';
SELECT 'Expenses table columns:' as 'Info';
DESCRIBE expenses;
SELECT 'Categories:' as 'Info';
SELECT id, name, icon, color FROM categories ORDER BY id;
SHOW TABLES;