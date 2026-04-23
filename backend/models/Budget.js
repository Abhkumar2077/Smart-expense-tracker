const db = require('../config/db');

class Budget {
    static getCurrentMonth() {
        return new Date().toISOString().slice(0, 7);
    }

    static normalizeMonth(month) {
        if (typeof month === 'string' && /^\d{4}-\d{2}$/.test(month)) {
            return month;
        }
        return this.getCurrentMonth();
    }

    static getPreviousMonth(month) {
        const current = new Date(`${month}-01T00:00:00Z`);
        current.setUTCMonth(current.getUTCMonth() - 1);
        return current.toISOString().slice(0, 7);
    }

    static getStatusDetails(used, limit) {
        const safeLimit = Number(limit) || 0;
        const usedAmount = Number(used) || 0;
        const percentage = safeLimit > 0 ? (usedAmount / safeLimit) * 100 : 0;

        let status = 'safe';
        if (percentage > 100) {
            status = 'exceeded';
        } else if (percentage >= 80) {
            status = 'warning';
        }

        return {
            used: Number(usedAmount.toFixed(2)),
            percentage: Number(percentage.toFixed(2)),
            status
        };
    }

    static buildInsight(category, used, previousUsed) {
        const prev = Number(previousUsed) || 0;
        const curr = Number(used) || 0;

        if (prev <= 0) {
            return `No previous-month baseline for ${category} yet.`;
        }

        const changePct = ((curr - prev) / prev) * 100;
        const direction = changePct >= 0 ? 'more' : 'less';
        return `You spent ${Math.abs(changePct).toFixed(0)}% ${direction} on ${category} than last month.`;
    }

    static buildSuggestion(used, limit, category) {
        const overBy = Number(used) - Number(limit);
        if (overBy > 0) {
            return `Reduce ${category} spending by \u20b9${overBy.toFixed(0)} to stay within budget.`;
        }

        const remaining = Number(limit) - Number(used);
        return `You can spend up to \u20b9${remaining.toFixed(0)} more in ${category} this month.`;
    }

    static async upsert({ user_id, category_id, monthly_limit, month }) {
        const normalizedMonth = this.normalizeMonth(month);
        const numericLimit = Number(monthly_limit);

        if (!user_id) throw new Error('user_id is required');
        if (!category_id) throw new Error('category_id is required');
        if (!Number.isFinite(numericLimit) || numericLimit <= 0) {
            throw new Error('monthly_limit must be greater than 0');
        }

        await db.execute(
            `INSERT INTO budgets (user_id, category_id, monthly_limit, month)
             VALUES (?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE monthly_limit = VALUES(monthly_limit)`,
            [user_id, category_id, numericLimit, normalizedMonth]
        );

        const [rows] = await db.execute(
            `SELECT id, user_id, category_id, monthly_limit, month, created_at
             FROM budgets
             WHERE user_id = ? AND category_id = ? AND month = ?
             LIMIT 1`,
            [user_id, category_id, normalizedMonth]
        );

        return rows[0] || null;
    }

    static async getStatusByMonth(userId, month) {
        const normalizedMonth = this.normalizeMonth(month);
        const previousMonth = this.getPreviousMonth(normalizedMonth);

        const [rows] = await db.execute(
            `SELECT
                b.category_id,
                c.name AS category,
                c.icon,
                c.color,
                b.monthly_limit,
                COALESCE(SUM(CASE WHEN e.type = 'expense' THEN e.amount ELSE 0 END), 0) AS used,
                COALESCE(pm.previous_used, 0) AS previous_used,
                COALESCE(avg3.avg_used, 0) AS avg_used_3m
             FROM budgets b
             JOIN categories c ON c.id = b.category_id
             LEFT JOIN expenses e
                ON e.user_id = b.user_id
                AND e.category_id = b.category_id
                AND e.type = 'expense'
                AND DATE_FORMAT(e.date, '%Y-%m') = b.month
             LEFT JOIN (
                SELECT user_id, category_id, SUM(amount) AS previous_used
                FROM expenses
                WHERE type = 'expense' 
                  AND DATE_FORMAT(date, '%Y-%m') = ?
                  AND user_id = ?
                GROUP BY user_id, category_id
             ) pm
                ON pm.user_id = b.user_id
                AND pm.category_id = b.category_id
             LEFT JOIN (
                SELECT m.user_id, m.category_id, AVG(m.month_total) AS avg_used
                FROM (
                    SELECT
                        user_id,
                        category_id,
                        DATE_FORMAT(date, '%Y-%m') AS ym,
                        SUM(amount) AS month_total
                    FROM expenses
                    WHERE type = 'expense'
                        AND date >= DATE_SUB(STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d'), INTERVAL 3 MONTH)
                        AND date < STR_TO_DATE(CONCAT(?, '-01'), '%Y-%m-%d')
                        AND user_id = ?
                    GROUP BY user_id, category_id, DATE_FORMAT(date, '%Y-%m')
                ) m
                GROUP BY m.user_id, m.category_id
             ) avg3
                ON avg3.user_id = b.user_id
                AND avg3.category_id = b.category_id
             WHERE b.user_id = ? AND b.month = ?
             GROUP BY b.category_id, c.name, c.icon, c.color, b.monthly_limit, pm.previous_used, avg3.avg_used
             ORDER BY c.name ASC`,
            [previousMonth, userId, normalizedMonth, normalizedMonth, userId, userId, normalizedMonth]
        );

        return rows.map((row) => {
            const limit = Number(row.monthly_limit) || 0;
            const usage = this.getStatusDetails(row.used, limit);
            const recommendedLimit = Number((Number(row.avg_used_3m || 0) * 1.1).toFixed(2));

            return {
                category: row.category,
                icon: row.icon,
                color: row.color,
                limit,
                used: usage.used,
                percentage: usage.percentage,
                status: usage.status,
                insight: this.buildInsight(row.category, usage.used, row.previous_used),
                suggestion: this.buildSuggestion(usage.used, limit, row.category),
                recommended_limit: recommendedLimit
            };
        });
    }

    static async getCategoryStatus(userId, categoryId, month) {
        const normalizedMonth = this.normalizeMonth(month);

        const [budgetRows] = await db.execute(
            `SELECT b.monthly_limit, c.name AS category
             FROM budgets b
             JOIN categories c ON c.id = b.category_id
             WHERE b.user_id = ? AND b.category_id = ? AND b.month = ?
             LIMIT 1`,
            [userId, categoryId, normalizedMonth]
        );

        if (budgetRows.length === 0) {
            return null;
        }

        const budget = budgetRows[0];
        const [usageRows] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) AS used
             FROM expenses
             WHERE user_id = ?
               AND category_id = ?
               AND type = 'expense'
               AND DATE_FORMAT(date, '%Y-%m') = ?`,
            [userId, categoryId, normalizedMonth]
        );

        const limit = Number(budget.monthly_limit) || 0;
        const usage = this.getStatusDetails(usageRows[0]?.used, limit);

        let alert = null;
        if (usage.status === 'warning') {
            alert = `You have used ${usage.percentage.toFixed(0)}% of your ${budget.category} budget`;
        }
        if (usage.status === 'exceeded') {
            alert = `Budget exceeded for ${budget.category} by \u20b9${Math.max(usage.used - limit, 0).toFixed(0)}`;
        }

        return {
            category: budget.category,
            limit,
            used: usage.used,
            percentage: usage.percentage,
            status: usage.status,
            alert
        };
    }
}

module.exports = Budget;
