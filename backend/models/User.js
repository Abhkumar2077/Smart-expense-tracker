// backend/models/User.js
const db = require('../config/db');

class User {
    // Create new user
    static async create(userData) {
        const { name, email, password_hash, monthly_budget = 0 } = userData;
        try {
            const [result] = await db.execute(
                'INSERT INTO users (name, email, password_hash, monthly_budget) VALUES (?, ?, ?, ?)',
                [name, email, password_hash, monthly_budget]
            );
            return result.insertId;
        } catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }

    // Find user by email
    static async findByEmail(email) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM users WHERE email = ?',
                [email]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }

    // Find user by ID
    static async findById(id) {
        try {
            const [rows] = await db.execute(
                'SELECT id, name, email, monthly_budget, created_at FROM users WHERE id = ?',
                [id]
            );
            return rows[0];
        } catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }

}

module.exports = User;