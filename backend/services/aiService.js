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
            const recommendations = await this.getRecommendations(user, insights, categorySummary, expenses);
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
    static async getRecommendations(user, insights, categorySummary, expenses = []) {
        const recommendations = [];

        if (!insights || !insights.current_month) return recommendations;

        const { total_income, total_expenses } = insights.current_month;
        const previousExpenses = insights?.previous_month?.total_expenses || 0;
        const netSavings = total_income - total_expenses;

        // Income recommendations
        if (total_income > 0) {
            const savings = total_income - total_expenses;
            const savingsRate = total_income > 0 ? (savings / total_income) * 100 : 0;

            if (savingsRate < 20 && total_income > 0) {
                const monthlyTarget = total_income * 0.2;
                const currentSavings = Math.max(0, savings);
                const gapToTarget = Math.max(0, monthlyTarget - currentSavings);
                recommendations.push({
                    type: 'savings_rate',
                    title: '💰 Improve Savings Rate',
                    description: `Your current savings rate is ${savingsRate.toFixed(1)}%, below the 20% target.`,
                    suggestion: `Free up about ₹${gapToTarget.toFixed(0)} this month by reducing non-essential spending and automating transfers to savings.`,
                    impact: 'high',
                    priority: 'high',
                    confidence: total_income > 0 && total_expenses > 0 ? 'high' : 'medium',
                    expected_outcome: `Potential monthly savings increase: ₹${gapToTarget.toFixed(0)}`
                });
            } else if (savingsRate > 30) {
                recommendations.push({
                    type: 'good_savings',
                    title: '🌟 Excellent Savings Rate',
                    description: `You're saving ${savingsRate.toFixed(1)}% of your income!`,
                    suggestion: 'Create a split plan: keep 6 months of expenses in emergency fund, then invest the surplus systematically.',
                    impact: 'positive',
                    priority: 'low',
                    confidence: 'high',
                    expected_outcome: 'Improves long-term wealth growth while keeping liquidity.'
                });
            }
        }

        // Budget recommendations
        if (user?.monthly_budget > 0 && total_expenses > 0) {
            const budgetUtilization = (total_expenses / user.monthly_budget) * 100;
            
            if (budgetUtilization > 100) {
                const overspendAmount = total_expenses - user.monthly_budget;
                recommendations.push({
                    type: 'budget_overshoot',
                    title: '⚠️ Budget Exceeded',
                    description: `You've spent ${(budgetUtilization - 100).toFixed(0)}% over your budget.`,
                    suggestion: `Cut ₹${overspendAmount.toFixed(0)} from optional expenses over the next 2 weeks to return within budget.`,
                    impact: 'high',
                    priority: 'high',
                    confidence: 'high',
                    expected_outcome: `Brings spending back to your monthly budget by reducing ₹${overspendAmount.toFixed(0)}.`
                });
            } else if (budgetUtilization > 80) {
                const remainingBudget = Math.max(0, user.monthly_budget - total_expenses);
                recommendations.push({
                    type: 'budget_warning',
                    title: '⚠️ Approaching Budget Limit',
                    description: `You've used ${budgetUtilization.toFixed(0)}% of your budget.`,
                    suggestion: `Cap daily discretionary spending so you stay within the remaining ₹${remainingBudget.toFixed(0)} budget.`,
                    impact: 'medium',
                    priority: 'medium',
                    confidence: 'high',
                    expected_outcome: 'Reduces end-of-month overspending risk.'
                });
            }
        }

        // Expense trend recommendation (month-over-month)
        if (previousExpenses > 0 && total_expenses > previousExpenses * 1.1) {
            const increaseAmount = total_expenses - previousExpenses;
            const increasePct = ((increaseAmount / previousExpenses) * 100).toFixed(1);
            recommendations.push({
                type: 'expense_trend_up',
                title: '📈 Spending Trend Is Rising',
                description: `This month is ₹${increaseAmount.toFixed(0)} (${increasePct}%) higher than last month.`,
                suggestion: 'Audit your top 3 spending categories and set category caps for the next 7 days.',
                impact: 'high',
                priority: 'high',
                confidence: 'medium',
                expected_outcome: 'Helps stop month-over-month spending drift early.'
            });
        }

        // Category concentration recommendation
        if (Array.isArray(categorySummary) && categorySummary.length > 0 && total_expenses > 0) {
            const topCategory = categorySummary[0];
            const topAmount = parseFloat(topCategory.total_expense || topCategory.total_amount || 0);
            const concentration = topAmount > 0 ? (topAmount / total_expenses) * 100 : 0;

            if (concentration >= 35) {
                const targetCut = topAmount * 0.12;
                recommendations.push({
                    type: 'category_concentration',
                    title: `🎯 ${topCategory.name} Is Driving Your Spend`,
                    description: `${topCategory.name} is ${concentration.toFixed(1)}% of monthly expenses.`,
                    suggestion: `Try a 7-day challenge to cut ${topCategory.name} by ₹${targetCut.toFixed(0)} using this tactic: ${this.getCategorySuggestion(topCategory.name, topAmount)}.`,
                    impact: 'medium',
                    priority: 'medium',
                    confidence: 'high',
                    expected_outcome: `Estimated savings if achieved: ₹${targetCut.toFixed(0)} this month.`
                });
            }
        }

        // Frequent small expenses recommendation
        const expenseTransactions = Array.isArray(expenses)
            ? expenses.filter(e => e && e.type === 'expense')
            : [];
        if (expenseTransactions.length > 0) {
            const smallExpenses = expenseTransactions.filter(e => (parseFloat(e.amount) || 0) <= 500);
            const smallExpenseTotal = smallExpenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
            if (smallExpenses.length >= 12 && total_expenses > 0 && (smallExpenseTotal / total_expenses) >= 0.2) {
                const possibleCut = smallExpenseTotal * 0.2;
                recommendations.push({
                    type: 'small_expense_leak',
                    title: '🧾 Small Expenses Are Adding Up',
                    description: `${smallExpenses.length} small transactions contribute ₹${smallExpenseTotal.toFixed(0)} this month.`,
                    suggestion: 'Set a daily micro-budget for coffee/snacks/quick buys and review it every evening.',
                    impact: 'medium',
                    priority: 'medium',
                    confidence: 'medium',
                    expected_outcome: `Potential savings: about ₹${possibleCut.toFixed(0)} per month.`
                });
            }
        }

        // Emergency runway recommendation
        if (total_income > 0 && netSavings < 0) {
            recommendations.push({
                type: 'negative_savings',
                title: '🚨 Negative Monthly Savings',
                description: `You are currently short by ₹${Math.abs(netSavings).toFixed(0)} this month.`,
                suggestion: 'Pause optional purchases for 5 days and reroute that amount to stabilize cash flow.',
                impact: 'high',
                priority: 'high',
                confidence: 'high',
                expected_outcome: 'Prevents cash crunch and improves monthly balance.'
            });
        }

        return this.prioritizeRecommendations(recommendations);
    }

    static prioritizeRecommendations(recommendations) {
        if (!Array.isArray(recommendations) || recommendations.length === 0) {
            return [];
        }

        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const confidenceWeight = { high: 3, medium: 2, low: 1 };
        const impactWeight = { high: 3, medium: 2, low: 1, positive: 1 };

        const deduped = [];
        const seen = new Set();

        recommendations.forEach(rec => {
            const key = `${rec.type}|${rec.title}`;
            if (!seen.has(key)) {
                seen.add(key);
                deduped.push(rec);
            }
        });

        return deduped
            .sort((a, b) => {
                const scoreA = (priorityWeight[a.priority] || 0) + (confidenceWeight[a.confidence] || 0) + (impactWeight[a.impact] || 0);
                const scoreB = (priorityWeight[b.priority] || 0) + (confidenceWeight[b.confidence] || 0) + (impactWeight[b.impact] || 0);
                return scoreB - scoreA;
            })
            .slice(0, 6);

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
                const formattedDate = this.formatDateOnly(exp.date);
                alerts.push({
                    type: 'large_expense',
                    severity: 'medium',
                    title: '💰 Large Expense Detected',
                    message: `${exp.description || 'Transaction'} of ₹${parseFloat(exp.amount).toFixed(0)} on ${formattedDate}`,
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
                const formattedDate = this.formatDateOnly(expense.date);
                anomalies.push({
                    type: 'unusual_expense',
                    title: '⚠️ Unusually Large Expense',
                    description: `${expense.category_name || 'Expense'}: ₹${parseFloat(expense.amount).toFixed(0)} on ${formattedDate}`,
                    suggestion: `This is ${((expense.amount/avg)-1).toFixed(1)}x larger than your typical expense.`,
                    impact: 'high',
                    date: formattedDate
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
            const seed = `${category}-${Math.round(amount || 0)}`;
            const index = this.getDeterministicIndex(seed, categorySuggestions.length);
            return categorySuggestions[index];
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

    static formatDateOnly(dateValue) {
        if (!dateValue) return 'Unknown date';

        const parsedDate = new Date(dateValue);
        if (!Number.isNaN(parsedDate.getTime())) {
            return parsedDate.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        }

        if (typeof dateValue === 'string') {
            return dateValue.split(' ')[0];
        }

        return String(dateValue);
    }

    static getDeterministicIndex(seed, max) {
        if (!max || max <= 0) return 0;

        let hash = 0;
        const safeSeed = String(seed || 'default');
        for (let i = 0; i < safeSeed.length; i++) {
            hash = (hash << 5) - hash + safeSeed.charCodeAt(i);
            hash |= 0;
        }

        return Math.abs(hash) % max;
    }

    static async learnFromCSV(userId, csvData) {
    try {
        console.log('🧠 AI Learning from CSV data...');
        // Your existing learning logic
        return { success: true };
    } catch (error) {
        console.error('AI Learning Error:', error);
        return { success: false, error: error.message };
    }
}
}

module.exports = AIService;