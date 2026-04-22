// backend/models/Goal.js
const db = require('../config/db');

class Goal {
    // Get all goals for a user
    static async findByUserId(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY deadline ASC',
                [userId]
            );
            return rows.map((row) => ({
                ...row,
                icon: row.icon || '🎯',
                color: row.color || '#48c774'
            }));
        } catch (error) {
            console.error('Error fetching goals:', error);
            throw error;
        }
    }

    // Create new goal
    static async create(goalData) {
        const { user_id, name, target_amount, current_amount = 0, deadline, icon = '🎯', color = '#48c774' } = goalData;
        
        try {
            try {
                const [result] = await db.execute(
                    'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline, icon, color) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [user_id, name, target_amount, current_amount, deadline, icon, color]
                );
                return result.insertId;
            } catch (insertError) {
                // Backward compatibility for schemas that don't yet have icon/color columns.
                if (insertError.code === 'ER_BAD_FIELD_ERROR' || insertError.message.includes('Unknown column')) {
                    const [legacyResult] = await db.execute(
                        'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, deadline) VALUES (?, ?, ?, ?, ?)',
                        [user_id, name, target_amount, current_amount, deadline]
                    );
                    return legacyResult.insertId;
                }
                throw insertError;
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            throw error;
        }
    }

    // Update goal progress
    static async updateProgress(id, userId, current_amount) {
        try {
            const [result] = await db.execute(
                'UPDATE savings_goals SET current_amount = ? WHERE id = ? AND user_id = ?',
                [current_amount, id, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating goal:', error);
            throw error;
        }
    }

    // Delete goal
    static async delete(id, userId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
                [id, userId]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting goal:', error);
            throw error;
        }
    }

    // Get goal statistics
    static async getStats(userId) {
        try {
            const [rows] = await db.execute(
                `SELECT 
                    COUNT(*) as total_goals,
                    SUM(CASE WHEN current_amount >= target_amount THEN 1 ELSE 0 END) as completed_goals,
                    SUM(target_amount - current_amount) as total_remaining,
                    AVG(CASE WHEN current_amount < target_amount THEN (current_amount/target_amount)*100 ELSE 100 END) as avg_progress
                FROM savings_goals
                WHERE user_id = ?`,
                [userId]
            );
            return rows[0];
        } catch (error) {
            console.error('Error getting goal stats:', error);
            throw error;
        }
    }
}

module.exports = Goal;