const db = require('../config/db');

class Reminder {
    static async create(reminderData) {
        const { user_id, bill_name, amount, due_date, category_id, recurring } = reminderData;
        
        // Validate required fields
        if (!user_id || !bill_name || !amount || !due_date) {
            throw new Error('Missing required fields: user_id, bill_name, amount, and due_date are required');
        }
        
        const [result] = await db.execute(
            'INSERT INTO bill_reminders (user_id, bill_name, amount, due_date, category_id, recurring, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, bill_name, amount, due_date, category_id, recurring || 'one-time', 'pending']
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        const [rows] = await db.execute(
            `SELECT r.*, c.name as category_name, c.color, c.icon 
             FROM bill_reminders r 
             LEFT JOIN categories c ON r.category_id = c.id 
             WHERE r.user_id = ? 
             ORDER BY r.due_date ASC`,
            [userId]
        );
        return rows;
    }

    static async findById(id, userId) {
        if (!id || !userId) {
            throw new Error('ID and User ID are required');
        }
        
        const [rows] = await db.execute(
            'SELECT * FROM bill_reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0] || null;
    }

    static async markAsPaid(id, userId) {
        if (!id || !userId) {
            throw new Error('ID and User ID are required');
        }
        
        const [result] = await db.execute(
            'UPDATE bill_reminders SET status = ?, paid_date = CURDATE() WHERE id = ? AND user_id = ? AND status = ?',
            ['paid', id, userId, 'pending']
        );
        return result.affectedRows > 0;
    }

    static async update(id, userId, updateData) {
        if (!id || !userId) {
            throw new Error('ID and User ID are required');
        }
        
        const { bill_name, amount, due_date, category_id, recurring, status } = updateData;
        const [result] = await db.execute(
            `UPDATE bill_reminders 
             SET bill_name = COALESCE(?, bill_name),
                 amount = COALESCE(?, amount),
                 due_date = COALESCE(?, due_date),
                 category_id = COALESCE(?, category_id),
                 recurring = COALESCE(?, recurring),
                 status = COALESCE(?, status)
             WHERE id = ? AND user_id = ?`,
            [bill_name, amount, due_date, category_id, recurring, status, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        if (!id || !userId) {
            throw new Error('ID and User ID are required');
        }
        
        const [result] = await db.execute(
            'DELETE FROM bill_reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getUpcoming(userId, days = 7) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        const [rows] = await db.execute(
            'SELECT * FROM bill_reminders WHERE user_id = ? AND status = ? AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY due_date ASC',
            [userId, 'pending', days]
        );
        return rows;
    }

    static async getOverdue(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }
        
        const [rows] = await db.execute(
            'SELECT * FROM bill_reminders WHERE user_id = ? AND status = ? AND due_date < CURDATE() ORDER BY due_date ASC',
            [userId, 'pending']
        );
        return rows;
    }

    static async getByCategory(userId, categoryId) {
        if (!userId || !categoryId) {
            throw new Error('User ID and Category ID are required');
        }
        
        const [rows] = await db.execute(
            'SELECT * FROM bill_reminders WHERE user_id = ? AND category_id = ? ORDER BY due_date ASC',
            [userId, categoryId]
        );
        return rows;
    }
}

module.exports = Reminder;