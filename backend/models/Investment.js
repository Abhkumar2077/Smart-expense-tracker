const db = require('../config/db');

class Investment {
    static async create(investmentData) {
        const { user_id, name, type, amount_invested, current_value, purchase_date, notes } = investmentData;
        const [result] = await db.execute(
            'INSERT INTO investments (user_id, name, type, amount_invested, current_value, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [user_id, name, type, amount_invested, current_value || amount_invested, purchase_date, notes]
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM investments WHERE user_id = ? ORDER BY purchase_date DESC',
            [userId]
        );
        return rows;
    }

    static async update(id, userId, data) {
        const { current_value } = data;
        const [result] = await db.execute(
            'UPDATE investments SET current_value = ? WHERE id = ? AND user_id = ?',
            [current_value, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM investments WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Investment;
