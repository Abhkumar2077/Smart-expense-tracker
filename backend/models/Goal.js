const db = require('../config/db');

class Goal {
    static async create(goalData) {
        const { user_id, name, target_amount, current_amount = 0, deadline } = goalData;
        const [result] = await db.execute(
            'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
            [user_id, name, target_amount, current_amount, deadline]
        );
        return result.insertId;
    }

    static async findByUserId(userId) {
        const [rows] = await db.execute(
            'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY deadline ASC',
            [userId]
        );
        return rows;
    }

    static async update(id, userId, data) {
        const { current_amount } = data;
        const [result] = await db.execute(
            'UPDATE savings_goals SET current_amount = ? WHERE id = ? AND user_id = ?',
            [current_amount, id, userId]
        );
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await db.execute(
            'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }
}

module.exports = Goal;
