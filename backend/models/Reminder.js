const db = require('../config/db');

class Reminder {
    static async create(reminderData) {
        const { user_id, bill_name, amount, due_date, category_id, recurring } = reminderData;
        const [result] = await db.execute(
            'INSERT INTO bill_reminders (user_id, bill_name, amount, due_date, category_id, recurring) VALUES (?, ?, ?, ?, ?, ?)',
            [user_id, bill_name, amount, due_date, category_id, recurring || 'one-time']
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT r.*, c.name as category_name, c.color, c.icon FROM bill_reminders r LEFT JOIN categories c ON r.category_id = c.id WHERE r.user_id = ? ORDER BY r.due_date ASC',
            [userId]
        );
        return rows;
    }

    static async markAsPaid(id, userId) {
        const [result] = await db.execute(
            'UPDATE bill_reminders SET status = ?, paid_date = CURDATE() WHERE id = ? AND user_id = ?',
            ['paid', id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM bill_reminders WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getUpcoming(userId, days = 7) {
        const [rows] = await db.execute(
            'SELECT * FROM bill_reminders WHERE user_id = ? AND status = ? AND due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL ? DAY) ORDER BY due_date ASC',
            [userId, 'pending', days]
        );
        return rows;
    }
}

module.exports = Reminder;
