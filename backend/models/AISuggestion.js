// backend/models/AISuggestion.js
const db = require('../config/db');

class AISuggestion {
  static async create(userId, suggestions) {
    if (!suggestions || suggestions.length === 0) return [];

    const values = suggestions.map(s => [
      userId,
      s.action,
      s.target_category || null,
      s.proposed_change,
      s.rationale,
      s.confidence || 'medium'
    ]);

    const placeholders = values.map(() => '(?, ?, ?, ?, ?, ?)').join(', ');
    const flat = values.flat();

    await db.query(
      `INSERT INTO ai_suggestions
       (user_id, action, target_category, proposed_change, rationale, confidence)
       VALUES ${placeholders}`,
      flat
    );
  }

  static async getPending(userId) {
    const [rows] = await db.query(
      `SELECT * FROM ai_suggestions
       WHERE user_id = ? AND status = 'pending'
       ORDER BY created_at DESC`,
      [userId]
    );
    return rows;
  }

  static async decide(suggestionId, userId, status) {
    const [result] = await db.query(
      `UPDATE ai_suggestions
       SET status = ?, decided_at = NOW()
       WHERE id = ? AND user_id = ?`,
      [status, suggestionId, userId]
    );
    return result.affectedRows > 0;
  }

  static async getHistory(userId) {
    const [rows] = await db.query(
      `SELECT * FROM ai_suggestions
       WHERE user_id = ? AND status != 'pending'
       ORDER BY decided_at DESC
       LIMIT 20`,
      [userId]
    );
    return rows;
  }
}

module.exports = AISuggestion;