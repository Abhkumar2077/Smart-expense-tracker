// backend/models/WeeklyDigest.js
const db = require('../config/db');

class WeeklyDigest {
  static async create(userId, weekStart, weekEnd, insights, summaryText) {
    const [result] = await db.query(
      `INSERT INTO weekly_digests
       (user_id, week_start, week_end, insights, summary_text)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
       insights = VALUES(insights), summary_text = VALUES(summary_text)`,
      [userId, weekStart, weekEnd, JSON.stringify(insights), summaryText]
    );
    return result.insertId || result.affectedRows;
  }

  static async getForUser(userId, limit = 4) {
    const [rows] = await db.query(
      `SELECT * FROM weekly_digests
       WHERE user_id = ?
       ORDER BY week_start DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows.map(row => ({
      ...row,
      insights: JSON.parse(row.insights)
    }));
  }

  static async getLatest(userId) {
    const [rows] = await db.query(
      `SELECT * FROM weekly_digests
       WHERE user_id = ?
       ORDER BY week_start DESC
       LIMIT 1`,
      [userId]
    );
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      ...row,
      insights: JSON.parse(row.insights)
    };
  }
}

module.exports = WeeklyDigest;