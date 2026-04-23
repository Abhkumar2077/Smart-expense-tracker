// backend/models/Expense.js
const db = require('../config/db');
const cache = require('../utils/cache');

class Expense {
    // Create new expense/income
    static async create(expenseData) {

        const { user_id, category_id, category_ids, amount, description, date, type = 'expense' } = expenseData;

        // Validate required fields
        if (!user_id) throw new Error('user_id is required');
        if (!amount || amount <= 0) throw new Error('amount must be greater than 0');
        if (!date) throw new Error('date is required');

        // For backward compatibility, support both category_id and category_ids
        const categoriesToUse = category_ids || (category_id ? [category_id] : []);
        if (categoriesToUse.length === 0) throw new Error('At least one category is required');

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Insert main expense record (use first category for backward compatibility)
            const [result] = await connection.execute(
                'INSERT INTO expenses (user_id, category_id, amount, description, date, type) VALUES (?, ?, ?, ?, ?, ?)',
                [user_id, categoriesToUse[0], amount, description, date, type]
            );

            const expenseId = result.insertId;

            // Insert multiple categories if provided
            if (categoriesToUse.length > 1 || type === 'income') {
                // For income, always use multiple categories approach
                const categoryInserts = categoriesToUse.map(catId => [expenseId, catId, 100.00 / categoriesToUse.length]);
                for (const [expId, catId, percentage] of categoryInserts) {
                    await connection.execute(
                        'INSERT INTO expense_categories (expense_id, category_id, percentage) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE percentage = VALUES(percentage)',
                        [expId, catId, percentage]
                    );
                }
            }

            // Update category usage counts
            for (const catId of categoriesToUse) {
                try {
                    await connection.execute(
                        'UPDATE categories SET usage_count = usage_count + 1, last_used = CURDATE() WHERE id = ?',
                        [catId]
                    );
                } catch (updateError) {
                    console.error('⚠️ Failed to update category usage:', updateError.message);
                }
            }

            await connection.commit();

            // Clear AI insights cache for this user
            cache.delete(`insights_${user_id}`);

            return expenseId;
        } catch (error) {
            await connection.rollback();
            console.error('❌ Database error creating expense:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    // Get all expenses for a user
    static async findByUserId(userId, startDate, endDate, limit = null) {
        try {
            const normalizedUserId = Number(userId);
            const hasValidUserId = Number.isInteger(normalizedUserId) && normalizedUserId > 0;
            if (!hasValidUserId) {
                throw new Error('Invalid userId provided to findByUserId');
            }

            const normalizedLimit = Number(limit);
            const hasLimit = Number.isInteger(normalizedLimit) && normalizedLimit > 0;
            const hasDateRange = Boolean(startDate && endDate);

            // Try the new query with expense_categories table first
            try {
                let query = `
                    SELECT
                        e.*,
                        GROUP_CONCAT(DISTINCT c.name ORDER BY c.name SEPARATOR ', ') as category_names,
                        GROUP_CONCAT(DISTINCT c.icon ORDER BY c.name SEPARATOR ', ') as category_icons,
                        GROUP_CONCAT(DISTINCT c.color ORDER BY c.name SEPARATOR ', ') as category_colors,
                        GROUP_CONCAT(DISTINCT ec.category_id ORDER BY ec.category_id SEPARATOR ',') as category_ids,
                        GROUP_CONCAT(DISTINCT ec.percentage ORDER BY ec.category_id SEPARATOR ',') as category_percentages
                    FROM expenses e
                    LEFT JOIN expense_categories ec ON e.id = ec.expense_id
                    LEFT JOIN categories c ON ec.category_id = c.id
                    WHERE e.user_id = ?
                    GROUP BY e.id
                `;
                let params = [normalizedUserId];

                if (hasDateRange) {
                    query += ' HAVING e.date BETWEEN ? AND ?';
                    params.push(startDate, endDate);
                }

                query += ' ORDER BY e.date DESC';

                if (hasLimit) {
                    query += ` LIMIT ${normalizedLimit}`;
                }

                const [rows] = await db.execute(query, params);

                if (rows && rows.length > 0) {
                    // Process the results to format category data properly
                    const processedRows = rows.map(row => ({
                        ...row,
                        categories: row.category_ids ? row.category_ids.split(',').map((id, index) => ({
                            id: parseInt(id),
                            name: row.category_names.split(', ')[index],
                            icon: row.category_icons.split(', ')[index],
                            color: row.category_colors.split(', ')[index],
                            percentage: parseFloat(row.category_percentages.split(',')[index]) || 100
                        })) : [row.category_id ? {
                            id: row.category_id,
                            name: row.category_name,
                            icon: row.icon,
                            color: row.color,
                            percentage: 100
                        } : null].filter(Boolean),
                        // Keep backward compatibility
                        category_name: row.category_names || row.category_name,
                        category_icon: row.category_icons || row.icon,
                        category_color: row.category_colors || row.color
                    }));

                    return processedRows;
                }
            } catch (newQueryError) {
                // Fallback to old query without expense_categories table
            }

            // Fallback query
            let query = `
                SELECT
                    e.*,
                    c.name as category_name,
                    c.icon,
                    c.color
                FROM expenses e
                LEFT JOIN categories c ON e.category_id = c.id
                WHERE e.user_id = ?
            `;
            let params = [normalizedUserId];

            if (hasDateRange) {
                query += ' AND e.date BETWEEN ? AND ?';
                params.push(startDate, endDate);
            }

            query += ' ORDER BY e.date DESC';

            if (hasLimit) {
                query += ` LIMIT ${normalizedLimit}`;
            }

            const [rows] = await db.execute(query, params);

            // Process the results for backward compatibility
            const processedRows = rows.map(row => ({
                ...row,
                categories: [{
                    id: row.category_id,
                    name: row.category_name,
                    icon: row.icon,
                    color: row.color,
                    percentage: 100
                }],
                category_ids: [row.category_id],
                // Keep backward compatibility
                category_name: row.category_name,
                category_icon: row.icon,
                category_color: row.color
            }));

            return processedRows;

        } catch (error) {
            console.error('Error in findByUserId:', error);
            throw error;
        }
    }

    // Get expense by ID
    static async findById(id, userId) {
        try {
            // Get main expense data
            const [expenseRows] = await db.execute(
                'SELECT e.*, c.name as category_name, c.icon, c.color FROM expenses e ' +
                'JOIN categories c ON e.category_id = c.id ' +
                'WHERE e.id = ? AND e.user_id = ?',
                [id, userId]
            );

            if (expenseRows.length === 0) return null;

            const expense = expenseRows[0];

            // Get all categories for this expense
            const [categoryRows] = await db.execute(
                'SELECT c.id, c.name, c.icon, c.color, ec.percentage ' +
                'FROM expense_categories ec ' +
                'JOIN categories c ON ec.category_id = c.id ' +
                'WHERE ec.expense_id = ? ' +
                'ORDER BY c.name',
                [id]
            );

            // If no categories in junction table, use the main category (backward compatibility)
            const categories = categoryRows.length > 0 ? categoryRows : [{
                id: expense.category_id,
                name: expense.category_name,
                icon: expense.icon,
                color: expense.color,
                percentage: 100
            }];

            return {
                ...expense,
                categories,
                category_ids: categories.map(c => c.id),
                // Keep backward compatibility
                category_name: categories.map(c => c.name).join(', '),
                category_icon: categories.map(c => c.icon).join(', '),
                category_color: categories.map(c => c.color).join(', ')
            };
        } catch (error) {
            console.error('Error finding expense by ID:', error);
            throw error;
        }
    }

    // Update expense
    static async update(id, userId, expenseData) {
        const { category_id, category_ids, amount, description, date, type } = expenseData;

        // For backward compatibility, support both category_id and category_ids
        const categoriesToUse = category_ids || (category_id ? [category_id] : []);

        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            // Update main expense record
            const [result] = await connection.execute(
                'UPDATE expenses SET category_id = ?, amount = ?, description = ?, date = ?, type = ? WHERE id = ? AND user_id = ?',
                [categoriesToUse[0] || category_id, amount, description, date, type, id, userId]
            );

            if (result.affectedRows === 0) {
                await connection.rollback();
                return null;
            }

            // Update multiple categories if provided
            if (categoriesToUse.length > 0) {
                // Delete existing category associations
                await connection.execute('DELETE FROM expense_categories WHERE expense_id = ?', [id]);

                // Insert new category associations
                if (categoriesToUse.length > 1 || type === 'income') {
                    const categoryInserts = categoriesToUse.map(catId => [id, catId, 100.00 / categoriesToUse.length]);
                    for (const [expId, catId, percentage] of categoryInserts) {
                        await connection.execute(
                            'INSERT INTO expense_categories (expense_id, category_id, percentage) VALUES (?, ?, ?)',
                            [expId, catId, percentage]
                        );
                    }
                }
            }

            await connection.commit();

            // Clear AI insights cache for this user
            cache.delete(`insights_${userId}`);

            return { id, ...expenseData };
        } catch (error) {
            await connection.rollback();
            console.error('❌ Database error updating expense:', error);
            throw error;
        } finally {
            connection.release();
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
                
                // Clear AI insights cache for this user
                cache.delete(`insights_${userId}`);
                
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
            ORDER BY total_expense DESC`,
            [userId, month, year]
        );
        
        
        return rows.map(row => ({
            ...row,
            total_amount: row.total_expense, // For backward compatibility
            transaction_count: parseInt(row.transaction_count) || 0
        }));
    } catch (error) {
        console.error('❌ Error getting category summary:', error);
        return []; // Return empty array instead of throwing
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
