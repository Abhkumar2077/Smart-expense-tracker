// backend/services/aiService.js
const Expense = require('../models/Expense');
const User = require('../models/User');

class AIService {
    // AI Learning Database
    static learningDB = {
        patterns: new Map(),
        keywords: new Map(),
        suggestions: [],
        userPreferences: new Map()
    };

    // ============================================
    // 1. MAIN INSIGHTS GENERATOR
    // ============================================
    static async generateInsights(userId) {
        try {
            console.log('🤖 AI Generating insights for user:', userId);
            
            const user = await User.findById(userId);
            const expenses = await Expense.findByUserId(userId);
            const insights = await Expense.getSpendingInsights(userId);
            
            console.log(`📊 Found ${expenses.length} total transactions`);
            
            // Get current month and year
            const now = new Date();
            const currentMonth = now.getMonth() + 1;
            const currentYear = now.getFullYear();
            
            const categorySummary = await Expense.getCategorySummary(userId, currentMonth, currentYear);

            // Generate different types of insights - PASS expenses to all functions
            const patterns = this.detectPatterns(expenses, categorySummary);
            const recommendations = await this.getRecommendations(user, insights, categorySummary);
            const alerts = this.generateAlerts(user, insights, expenses); // ← FIXED: Pass expenses
            const forecast = this.forecastSpending(expenses);
            const anomalies = this.detectAnomalies(expenses);
            const savings = this.findSavingsOpportunities(categorySummary, insights);

            // Combine all suggestions
            const allSuggestions = [
                ...patterns.map(p => p.suggestion),
                ...recommendations.map(r => r.suggestion),
                ...alerts.map(a => a.suggestion),
                ...anomalies.map(a => a.suggestion),
                ...savings.map(s => s.suggestion)
            ].filter(Boolean);

            console.log(`✅ Generated: ${patterns.length} patterns, ${alerts.length} alerts, ${recommendations.length} recommendations`);

            return {
                success: true,
                patterns,
                recommendations,
                alerts,
                forecast,
                anomalies,
                savings,
                current_month: insights.current_month,
                previous_month: insights.previous_month,
                suggestions: allSuggestions,
                aiConfidence: expenses.length > 50 ? 'high' : expenses.length > 20 ? 'medium' : 'low'
            };
            
        } catch (error) {
            console.error('❌ AI Insights Error:', error);
            return {
                success: false,
                error: error.message,
                suggestions: [],
                patterns: [],
                alerts: [],
                recommendations: [],
                savings: [],
                anomalies: [],
                current_month: { total_income: 0, total_expenses: 0 }
            };
        }
    }

    // ============================================
    // 2. DETECT SPENDING PATTERNS
    // ============================================
    static detectPatterns(expenses, categorySummary) {
        const patterns = [];
        
        if (!expenses || expenses.length === 0) return patterns;

        // Separate income and expense transactions
        const income = expenses.filter(e => e && e.type === 'income');
        const expense = expenses.filter(e => e && (e.type === 'expense' || !e.type));

        // Income patterns
        if (income.length > 0) {
            const totalIncome = income.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            const avgIncome = totalIncome / income.length;
            
            patterns.push({
                type: 'income_pattern',
                title: '💰 Income Pattern Detected',
                description: `You have ${income.length} income transactions averaging ₹${avgIncome.toFixed(0)} each.`,
                suggestion: this.getIncomeSuggestion(avgIncome, income.length),
                impact: 'positive'
            });
        }

        // Expense patterns
        if (expense.length > 0) {
            const totalExpense = expense.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            
            // Find largest expense category
            if (categorySummary && categorySummary.length > 0) {
                const topCategory = categorySummary[0];
                const categoryTotal = parseFloat(topCategory.total_expense || topCategory.total_amount || 0);
                
                if (totalExpense > 0 && categoryTotal > 0) {
                    const percentage = (categoryTotal / totalExpense) * 100;
                    
                    if (percentage > 40) {
                        patterns.push({
                            type: 'category_dominance',
                            title: '🎯 High Spending Category',
                            description: `${topCategory.name} accounts for ${percentage.toFixed(1)}% of your expenses.`,
                            suggestion: this.getCategorySuggestion(topCategory.name, categoryTotal),
                            impact: 'high'
                        });
                    }
                }
            }

            // Weekend vs Weekday spending
            const weekendVsWeekday = this.compareWeekendWeekday(expense);
            if (weekendVsWeekday.ratio > 1.5) {
                patterns.push({
                    type: 'weekend_spending',
                    title: '🎉 Weekend Spending Pattern',
                    description: `You spend ${weekendVsWeekday.ratio.toFixed(1)}x more on weekends.`,
                    suggestion: 'Try planning free activities or setting a weekend budget.',
                    impact: 'medium'
                });
            }
        }

        return patterns;
    }

    // ============================================
    // 3. GENERATE PERSONALIZED RECOMMENDATIONS
    // ============================================
    static async getRecommendations(user, insights, categorySummary) {
        const recommendations = [];

        if (!insights || !insights.current_month) return recommendations;

        const { total_income, total_expenses } = insights.current_month;

        // Income recommendations
        if (total_income > 0) {
            const savings = total_income - total_expenses;
            const savingsRate = total_income > 0 ? (savings / total_income) * 100 : 0;

            if (savingsRate < 20 && total_income > 0) {
                recommendations.push({
                    type: 'savings_rate',
                    title: '💰 Improve Savings Rate',
                    description: `Your current savings rate is ${savingsRate.toFixed(1)}%.`,
                    suggestion: 'Aim to save at least 20% of your income. Try to reduce discretionary spending.',
                    impact: 'high'
                });
            } else if (savingsRate > 30) {
                recommendations.push({
                    type: 'good_savings',
                    title: '🌟 Excellent Savings Rate',
                    description: `You're saving ${savingsRate.toFixed(1)}% of your income!`,
                    suggestion: 'Consider investing your savings in mutual funds or fixed deposits.',
                    impact: 'positive'
                });
            }
        }

        // Budget recommendations
        if (user?.monthly_budget > 0 && total_expenses > 0) {
            const budgetUtilization = (total_expenses / user.monthly_budget) * 100;
            
            if (budgetUtilization > 100) {
                recommendations.push({
                    type: 'budget_overshoot',
                    title: '⚠️ Budget Exceeded',
                    description: `You've spent ${(budgetUtilization - 100).toFixed(0)}% over your budget.`,
                    suggestion: 'Review your expenses and consider increasing your budget or cutting back.',
                    impact: 'high'
                });
            } else if (budgetUtilization > 80) {
                recommendations.push({
                    type: 'budget_warning',
                    title: '⚠️ Approaching Budget Limit',
                    description: `You've used ${budgetUtilization.toFixed(0)}% of your budget.`,
                    suggestion: 'Be careful with remaining expenses this month.',
                    impact: 'medium'
                });
            }
        }

        return recommendations;
    }

    // ============================================
    // 4. GENERATE ALERTS - FIXED VERSION
    // ============================================
    static generateAlerts(user, insights, expenses) {  // ← Added expenses parameter
        const alerts = [];

        if (!insights || !insights.current_month) return alerts;

        const { total_income, total_expenses } = insights.current_month;

        // Only show expense alerts for expenses, not income
        if (total_expenses > total_income && total_income > 0) {
            const deficit = total_expenses - total_income;
            alerts.push({
                type: 'deficit_alert',
                severity: 'high',
                title: '⚠️ Spending Deficit Detected',
                message: `Your expenses (₹${total_expenses.toFixed(0)}) exceeded income (₹${total_income.toFixed(0)}) by ₹${deficit.toFixed(0)}.`,
                suggestion: 'Try to reduce non-essential spending or find additional income sources.'
            });
        }

        // Check for large individual expenses (only if they're actually expenses)
        if (expenses && expenses.length > 0) {
            const expenseTransactions = expenses.filter(e => e.type === 'expense');
            const avgExpense = expenseTransactions.length > 0 
                ? expenseTransactions.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0) / expenseTransactions.length 
                : 0;
            
            const largeExpenses = expenseTransactions.filter(e => 
                parseFloat(e.amount) > avgExpense * 2
            );
            
            largeExpenses.slice(0, 3).forEach(exp => {
                alerts.push({
                    type: 'large_expense',
                    severity: 'medium',
                    title: '💰 Large Expense Detected',
                    message: `${exp.description || 'Transaction'} of ₹${parseFloat(exp.amount).toFixed(0)} on ${exp.date}`,
                    suggestion: 'Review if this was a necessary purchase or if you could find alternatives.'
                });
            });
        }

        return alerts;
    }

    // ============================================
    // 5. FORECAST SPENDING
    // ============================================
    static forecastSpending(expenses) {
        if (!expenses || expenses.length < 10) {
            return {
                confidence: 'low',
                message: 'Need at least 10 transactions for a forecast',
                forecast: null,
                projected_monthly_expense: 0,
                projected_monthly_income: 0,
                projected_savings: 0
            };
        }

        // Separate income and expense for forecasting
        const expenseTransactions = expenses.filter(e => e.type === 'expense');
        const incomeTransactions = expenses.filter(e => e.type === 'income');

        // Calculate daily averages for expenses (last 30 days or all if less)
        const recentExpenses = expenseTransactions.slice(0, 30);
        const expenseAmounts = recentExpenses.map(e => parseFloat(e.amount) || 0);
        const avgDailyExpense = expenseAmounts.length > 0 
            ? expenseAmounts.reduce((a, b) => a + b, 0) / Math.min(30, expenseAmounts.length) 
            : 0;

        // Project monthly expenses
        const projectedMonthlyExpense = avgDailyExpense * 30;

        // Income forecast
        const recentIncome = incomeTransactions
            .slice(0, 5)
            .map(i => parseFloat(i.amount) || 0);
        
        const avgIncome = recentIncome.length > 0 
            ? recentIncome.reduce((a, b) => a + b, 0) / recentIncome.length 
            : 0;

        return {
            confidence: expenseTransactions.length > 30 ? 'high' : 'medium',
            projected_monthly_expense: Math.round(projectedMonthlyExpense),
            projected_monthly_income: Math.round(avgIncome),
            projected_savings: Math.round(avgIncome - projectedMonthlyExpense),
            message: avgIncome > 0 
                ? `Based on your patterns, you'll likely spend ₹${Math.round(projectedMonthlyExpense)} next month.`
                : 'Add more transactions to get accurate forecasts.',
            income_message: avgIncome > 0 
                ? `Expected income around ₹${Math.round(avgIncome)}`
                : 'No regular income pattern detected',
            suggestions: projectedMonthlyExpense > avgIncome && avgIncome > 0
                ? 'Your projected expenses exceed income. Consider reducing spending.'
                : 'Your finances look balanced. Keep up the good work!'
        };
    }

    // ============================================
    // 6. DETECT ANOMALIES
    // ============================================
    static detectAnomalies(expenses) {
        const anomalies = [];
        
        if (!expenses || expenses.length < 5) return anomalies;

        // Only analyze expense transactions for anomalies
        const expenseTransactions = expenses.filter(e => e.type === 'expense');
        
        if (expenseTransactions.length < 5) return anomalies;

        const amounts = expenseTransactions.map(e => parseFloat(e.amount) || 0);
        const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
        const stdDev = Math.sqrt(
            amounts.map(x => Math.pow(x - avg, 2))
                .reduce((a, b) => a + b, 0) / amounts.length
        );

        // Find unusually large expenses (> 2 standard deviations)
        expenseTransactions.forEach(expense => {
            if (expense.amount > avg + (2 * stdDev)) {
                anomalies.push({
                    type: 'unusual_expense',
                    title: '⚠️ Unusually Large Expense',
                    description: `${expense.category_name || 'Expense'}: ₹${parseFloat(expense.amount).toFixed(0)} on ${expense.date}`,
                    suggestion: `This is ${((expense.amount/avg)-1).toFixed(1)}x larger than your typical expense.`,
                    impact: 'high',
                    date: expense.date
                });
            }
        });

        return anomalies;
    }

    // ============================================
    // 7. FIND SAVINGS OPPORTUNITIES
    // ============================================
    static findSavingsOpportunities(categorySummary, insights) {
        const savings = [];

        if (!categorySummary || categorySummary.length === 0) return savings;

        // Get total expenses
        const totalExpenses = insights?.current_month?.total_expenses || 0;
        if (totalExpenses === 0) return savings;

        // Analyze each category for potential savings
        categorySummary.forEach(category => {
            const amount = parseFloat(category.total_expense || category.total_amount || 0);
            
            // Skip if it's an income category
            if (category.name === 'Income') return;
            
            // Suggest 10-20% savings per category if it's significant
            if (amount > totalExpenses * 0.1) { // Category is >10% of total expenses
                const potentialSave = amount * 0.15; // 15% potential savings
                
                if (potentialSave > 500) {
                    savings.push({
                        category: category.name,
                        current: `₹${amount.toFixed(0)}`,
                        potential: `₹${potentialSave.toFixed(0)}`,
                        suggestion: this.getCategorySuggestion(category.name, amount),
                        icon: category.icon,
                        color: category.color,
                        impact: 'medium'
                    });
                }
            }
        });

        return savings;
    }

    // ============================================
    // 8. HELPER FUNCTIONS
    // ============================================

    static getIncomeSuggestion(avgIncome, count) {
        if (count === 1) {
            return 'Consider diversifying your income sources for more financial stability.';
        } else if (count >= 3) {
            return 'Great job having multiple income streams! Consider investing the surplus.';
        }
        return 'Regular income helps with financial planning. Try to maintain consistent earnings.';
    }

    static getCategorySuggestion(category, amount) {
        const suggestions = {
            'Food & Dining': [
                'Cook at home 3 more times this week to save ₹500-1000',
                'Try meal prepping on Sundays to avoid eating out',
                'Use restaurant discount apps and loyalty programs'
            ],
            'Transportation': [
                'Consider carpooling or public transport to save 30%',
                'Compare fuel prices at different stations',
                'Walk or bike for short trips under 2km'
            ],
            'Shopping': [
                'Wait 24 hours before non-essential purchases',
                'Use price comparison websites before buying',
                'Shop during sale seasons for big discounts'
            ],
            'Entertainment': [
                'Share streaming subscriptions with family',
                'Look for free local events and community activities',
                'Use library for books and movies instead of buying'
            ],
            'Bills & Utilities': [
                'Switch to LED bulbs to save electricity',
                'Fix leaking taps to reduce water bills',
                'Use power strips to avoid standby consumption'
            ],
            'Healthcare': [
                'Use generic medicines when possible',
                'Preventive care is cheaper than treatment',
                'Check if your expenses are tax deductible'
            ],
            'Groceries': [
                'Make a shopping list and stick to it',
                'Buy in bulk for non-perishable items',
                'Shop at local markets for fresh produce'
            ]
        };

        const categorySuggestions = suggestions[category];
        if (categorySuggestions) {
            return categorySuggestions[Math.floor(Math.random() * categorySuggestions.length)];
        }
        
        return `Review your ${category} expenses to identify potential savings.`;
    }

    static compareWeekendWeekday(expenses) {
        if (!expenses || expenses.length === 0) {
            return { weekend: 0, weekday: 0, ratio: 0 };
        }
        
        let weekend = 0;
        let weekday = 0;
        let weekendCount = 0;
        let weekdayCount = 0;
        
        expenses.forEach(exp => {
            const date = new Date(exp.date);
            const day = date.getDay();
            const amount = parseFloat(exp.amount) || 0;
            
            if (day === 0 || day === 6) {
                weekend += amount;
                weekendCount++;
            } else {
                weekday += amount;
                weekdayCount++;
            }
        });

        const weekendAvg = weekendCount > 0 ? weekend / weekendCount : 0;
        const weekdayAvg = weekdayCount > 0 ? weekday / weekdayCount : 0;
        const ratio = weekdayAvg > 0 ? weekendAvg / weekdayAvg : 0;

        return { weekend: weekendAvg, weekday: weekdayAvg, ratio };
    }
}

module.exports = AIService;