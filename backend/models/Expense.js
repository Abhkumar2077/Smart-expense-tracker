// backend/models/Expense.js
const db = require('../config/db');

class Expense {
    // Create new expense/income
    static async create(expenseData) {
        console.log('📝 Creating transaction with data:', expenseData);
        
        const { user_id, category_id, amount, description, date, type = 'expense' } = expenseData;
        
        // Validate required fields
        if (!user_id) throw new Error('user_id is required');
        if (!category_id) throw new Error('category_id is required');
        if (!amount || amount <= 0) throw new Error('amount must be greater than 0');
        if (!date) throw new Error('date is required');
        
        try {
            const [result] = await db.execute(
                'INSERT INTO expenses (user_id, category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)',
                [user_id, category_id, amount, description, date, type]
            );
            
            console.log(`✅ Transaction created with ID: ${result.insertId}, Type: ${type}`);
            
            // Update category usage count
            try {
                await db.execute(
                    'UPDATE categories SET usage_count = usage_count + 1, last_used = CURDATE() WHERE id = ?',
                    [category_id]
                );
            } catch (updateError) {
                console.error('⚠️ Failed to update category usage:', updateError.message);
            }
            
            return result.insertId;
        } catch (error) {
            console.error('❌ Database error creating expense:', error);
            throw error;
        }
    }

    // Get all expenses for a user
    static async findByUserId(userId, startDate, endDate) {
        try {
            let query = 'SELECT e.*, c.name as category_name, c.icon, c.color FROM expenses e ' +
                       'JOIN categories c ON e.category_id = c.id ' +
                       'WHERE e.user_id = ?';
            let params = [userId];

            if (startDate && endDate) {
                query += ' AND e.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            query += ' ORDER BY e.date DESC';
            
            const [rows] = await db.execute(query, params);
            console.log(`📊 Found ${rows.length} transactions for user ${userId}`);
            return rows;
        } catch (error) {
            console.error('Error finding expenses:', error);
            throw error;
        }
    }

    // Get expense by ID
    static async findById(id, userId) {
        try {
            const [rows] = await db.execute(
                'SELECT e.*, c.name as category_name, c.icon, c.color FROM expenses e ' +
                'JOIN categories c ON e.category_id = c.id ' +
                'WHERE e.id = ? AND e.user_id = ?',
                [id, userId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding expense by ID:', error);
            throw error;
        }
    }

    // Update expense
    static async update(id, userId, expenseData) {
        const { category_id, amount, description, date, type } = expenseData;
        try {
            const [result] = await db.execute(
                'UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ?, type = ? WHERE id = ? AND user_id = ?',
                [category_id, amount, description, date, type, id, userId]
            );
            
            if (result.affectedRows > 0) {
                console.log(`✅ Updated transaction ${id} with type: ${type}`);
                
                // Update category usage count
                try {
                    await db.execute(
                        'UPDATE categories SET usage_count = usage_count + 1, last_used = CURDATE() WHERE id = ?',
                        [category_id]
                    );
                } catch (updateError) {
                    console.error('⚠️ Failed to update category usage:', updateError.message);
                }
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating expense:', error);
            throw error;
        }
    }

    // Delete expense
    static async delete(id, userId) {
        try {
            // First get the category_id before deleting
            const [expense] = await db.execute(
                'SELECT category_id FROM expenses WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            
            const [result] = await db.execute(
                'DELETE FROM expenses WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            
            if (result.affectedRows > 0 && expense.length > 0) {
                console.log(`✅ Deleted transaction ${id}`);
                
                // Decrease category usage count
                try {
                    await db.execute(
                        'UPDATE categories SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = ?',
                        [expense[0].category_id]
                    );
                } catch (updateError) {
                    console.error('⚠️ Failed to update category usage:', updateError.message);
                }
            }
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting expense:', error);
            throw error;
        }
    }

    // Get category-wise summary
    static async getCategorySummary(userId, month, year) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    c.id,
                    c.name,
                    c.icon,
                    c.color,
                    COUNT(e.id) as transaction_count,
                    SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END) as total_expense,
                    SUM(CASE WHEN e.type = 'income' THEN e.amount ELSE 0 END) as total_income
                FROM categories c
                LEFT JOIN expenses e ON c.id = e.category_id 
                    AND e.user_id = ? 
                    AND MONTH(e.date) = ? 
                    AND YEAR(e.date) = ?
                GROUP BY c.id, c.name, c.icon, c.color
                HAVING total_expense > 0 OR total_income > 0
                ORDER BY total_expense DESC`,
                [userId, month, year]
            );
            
            return rows.map(row => ({
                ...row,
                total_amount: row.total_expense
            }));
        } catch (error) {
            console.error('Error getting category summary:', error);
            throw error;
        }
    }

    // Get monthly summary
    static async getMonthlySummary(userId, year) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    MONTH(date) as month,
                    COUNT(*) as total_transactions,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
                    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count
                FROM expenses
                WHERE user_id = ? AND YEAR(date) = ?
                GROUP BY MONTH(date)
                ORDER BY month`,
                [userId, year]
            );
            return rows;
        } catch (error) {
            console.error('Error getting monthly summary:', error);
            throw error;
        }
    }

    // ============================================
    // NEW: Get daily summary for a specific month
    // ============================================
    static async getDailySummary(userId, month, year) {
        try {
            console.log(`📊 Fetching daily summary for user ${userId}, month ${month}, year ${year}`);
            
            const [rows] = await db.execute(
                `SELECT 
                    date,
                    COUNT(*) as transaction_count,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
                FROM expenses
                WHERE user_id = ? 
                    AND MONTH(date) = ? 
                    AND YEAR(date) = ?
                GROUP BY date
                ORDER BY date ASC`,
                [userId, month, year]
            );
            
            console.log(`✅ Found ${rows.length} days with transactions`);
            return rows;
        } catch (error) {
            console.error('❌ Error getting daily summary:', error);
            throw error;
        }
    }

    // Get spending insights
    static async getSpendingInsights(userId) {
        try {
            // Get current month totals
            const [currentMonth] = await db.execute(
                `SELECT 
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
                    COUNT(CASE WHEN type = 'expense' THEN 1 END) as expense_count,
                    COUNT(CASE WHEN type = 'income' THEN 1 END) as income_count,
                    AVG(CASE WHEN type = 'expense' THEN amount END) as avg_expense,
                    AVG(CASE WHEN type = 'income' THEN amount END) as avg_income
                FROM expenses
                WHERE user_id = ? 
                    AND MONTH(date) = MONTH(CURRENT_DATE())
                    AND YEAR(date) = YEAR(CURRENT_DATE())`,
                [userId]
            );

            // Get previous month totals
            const [previousMonth] = await db.execute(
                `SELECT 
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income
                FROM expenses
                WHERE user_id = ? 
                    AND MONTH(date) = MONTH(CURRENT_DATE() - INTERVAL 1 MONTH)
                    AND YEAR(date) = YEAR(CURRENT_DATE() - INTERVAL 1 MONTH)`,
                [userId]
            );

            return {
                current_month: {
                    total_expenses: parseFloat(currentMonth[0]?.total_expenses) || 0,
                    total_income: parseFloat(currentMonth[0]?.total_income) || 0,
                    expense_count: parseInt(currentMonth[0]?.expense_count) || 0,
                    income_count: parseInt(currentMonth[0]?.income_count) || 0,
                    avg_expense: parseFloat(currentMonth[0]?.avg_expense) || 0,
                    avg_income: parseFloat(currentMonth[0]?.avg_income) || 0
                },
                previous_month: {
                    total_expenses: parseFloat(previousMonth[0]?.total_expenses) || 0,
                    total_income: parseFloat(previousMonth[0]?.total_income) || 0
                }
            };
        } catch (error) {
            console.error('Error getting spending insights:', error);
            throw error;
        }
    }
}

module.exports = Expense;