// backend/services/weeklyDigestService.js
const db = require('../config/db');
const geminiService = require('./geminiService');
const { buildWeeklyDigestPrompt } = require('./promptBuilder');
const { validateAIResponse } = require('./responseValidator');

function getWeekRange(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const start = new Date(d);
  start.setDate(d.getDate() - day); // Sunday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Saturday

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0]
  };
}

async function generateDigestForUser(userId) {
  const weekRange = getWeekRange();

  // Check if digest already exists for this week
  const [existing] = await db.query(
    'SELECT id FROM weekly_digests WHERE user_id = ? AND week_start = ?',
    [userId, weekRange.start]
  );
  if (existing.length > 0) return; // already generated

  // Fetch user
  const [[user]] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

  // Category totals this week
  const [categoryTotals] = await db.query(
    `SELECT category_name as category, SUM(amount) as total
     FROM expenses
     WHERE user_id = ? AND type = 'expense'
       AND date BETWEEN ? AND ?
     GROUP BY category_name
     ORDER BY total DESC`,
    [userId, weekRange.start, weekRange.end]
  );

  // Top 3 expenses
  const [topExpenses] = await db.query(
    `SELECT amount, description, category_name as category
     FROM expenses
     WHERE user_id = ? AND type = 'expense'
       AND date BETWEEN ? AND ?
     ORDER BY amount DESC
     LIMIT 3`,
    [userId, weekRange.start, weekRange.end]
  );

  // Last week for comparison
  const lastWeekStart = new Date(weekRange.start);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const lastWeekEnd = new Date(weekRange.end);
  lastWeekEnd.setDate(lastWeekEnd.getDate() - 7);

  const [lastWeekTotals] = await db.query(
    `SELECT category_name as category, SUM(amount) as total
     FROM expenses
     WHERE user_id = ? AND type = 'expense'
       AND date BETWEEN ? AND ?
     GROUP BY category_name`,
    [userId, lastWeekStart.toISOString().split('T')[0], lastWeekEnd.toISOString().split('T')[0]]
  );

  // Calculate week-over-week change
  const lastWeekMap = Object.fromEntries(lastWeekTotals.map(r => [r.category, r.total]));
  const vsLastWeek = categoryTotals.map(c => ({
    category: c.category,
    change: lastWeekMap[c.category]
      ? Math.round(((c.total - lastWeekMap[c.category]) / lastWeekMap[c.category]) * 100)
      : 100
  }));

  if (categoryTotals.length === 0) return; // no data this week

  const prompt = buildWeeklyDigestPrompt({
    user,
    weekRange,
    categoryTotals,
    topExpenses,
    vsLastWeek
  });

  try {
    const rawResponse = await geminiService.generateContent(prompt);
    const cleaned = rawResponse.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    await db.query(
      `INSERT INTO weekly_digests (user_id, week_start, week_end, insights, summary_text)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE insights = VALUES(insights), summary_text = VALUES(summary_text)`,
      [userId, weekRange.start, weekRange.end, JSON.stringify(parsed.bullets), parsed.headline]
    );
  } catch (err) {
    console.error(`Digest generation failed for user ${userId}:`, err.message);
  }
}

async function runDigestForAllUsers() {
  const [users] = await db.query('SELECT id FROM users');
  for (const user of users) {
    await generateDigestForUser(user.id);
  }
}

module.exports = { generateDigestForUser, runDigestForAllUsers, getWeekRange };