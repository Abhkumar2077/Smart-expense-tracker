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

    // Update user profile
    static async updateProfile(id, updates) {
        try {
            const fields = [];
            const values = [];

            if (updates.name !== undefined) {
                fields.push('name = ?');
                values.push(updates.name);
            }

            if (updates.email !== undefined) {
                fields.push('email = ?');
                values.push(updates.email);
            }

            if (fields.length === 0) {
                throw new Error('No fields to update');
            }

            values.push(id);

            const [result] = await db.execute(
                `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
                values
            );

            if (result.affectedRows === 0) {
                return null;
            }

            // Return updated user
            return await this.findById(id);
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw error;
        }
    }

    // Update user password
    static async updatePassword(id, newPasswordHash) {
        try {
            const [result] = await db.execute(
                'UPDATE users SET password_hash = ? WHERE id = ?',
                [newPasswordHash, id]
            );

            if (result.affectedRows === 0) {
                throw new Error('User not found');
            }

            return true;
        } catch (error) {
            console.error('Error updating user password:', error);
            throw error;
        }
    }

}

module.exports = User;