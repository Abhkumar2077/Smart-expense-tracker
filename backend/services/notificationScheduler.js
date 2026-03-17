// backend/services/notificationScheduler.js
const cron = require('node-cron');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Expense = require('../models/Expense');

class NotificationScheduler {
    // Initialize all scheduled jobs
    static init() {
        // Daily tips - every day at 9 AM
        cron.schedule('0 9 * * *', async () => {
            console.log('📅 Running daily tips...');
            await this.sendDailyTips();
        });
        
        // Check budget alerts - every hour
        cron.schedule('0 * * * *', async () => {
            console.log('💰 Checking budget alerts...');
            await this.checkBudgetAlerts();
        });
        
        // Weekly reports - every Monday at 8 AM
        cron.schedule('0 8 * * 1', async () => {
            console.log('📊 Sending weekly reports...');
            await this.sendWeeklyReports();
        });
        
        // Monthly reports - 1st of every month at 8 AM
        cron.schedule('0 8 1 * *', async () => {
            console.log('📈 Sending monthly reports...');
            await this.sendMonthlyReports();
        });
        
        console.log('✅ Notification scheduler started');
    }
    
    static async sendDailyTips() {
        const users = await User.getAllUsers();
        
        for (const user of users) {
            const prefs = await Notification.getUserPreferences(user.id);
            
            if (prefs?.in_app_tips) {
                const tips = [
                    "Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings",
                    "Review your subscriptions monthly",
                    "Small daily savings add up to big yearly amounts",
                    "Use cash for discretionary spending",
                    "Set specific savings goals",
                    "Track every expense, no matter how small",
                    "Compare prices before big purchases",
                    "Use the 24-hour rule for non-essential purchases",
                    "Automate your savings",
                    "Review your bills annually for better rates"
                ];
                
                const randomTip = tips[Math.floor(Math.random() * tips.length)];
                
                await Notification.createAndNotify({
                    user_id: user.id,
                    type: 'tip',
                    title: '💡 Daily Financial Tip',
                    message: randomTip,
                    channel: 'in_app'
                });
            }
        }
    }
    
    static async checkBudgetAlerts() {
        const users = await User.getAllUsers();
        
        for (const user of users) {
            if (user.monthly_budget > 0) {
                const spent = await Expense.getCurrentMonthTotal(user.id);
                const percentage = (spent / user.monthly_budget) * 100;
                const prefs = await Notification.getUserPreferences(user.id);
                
                if (percentage >= 90 && percentage < 95 && prefs?.email_budget_alerts) {
                    await Notification.sendBudgetAlert(user.id, {
                        percentage: 90,
                        remaining: user.monthly_budget - spent
                    });
                } else if (percentage >= 100 && prefs?.email_budget_alerts) {
                    await Notification.sendBudgetAlert(user.id, {
                        percentage: 100,
                        exceeded: spent - user.monthly_budget
                    });
                }
            }
        }
    }
    
    static async sendWeeklyReports() {
        const users = await User.getAllUsers();
        
        for (const user of users) {
            const prefs = await Notification.getUserPreferences(user.id);
            
            if (prefs?.email_weekly_report) {
                // This would call your email service
                console.log(`Sending weekly report to ${user.email}`);
            }
        }
    }
    
    static async sendMonthlyReports() {
        const users = await User.getAllUsers();
        
        for (const user of users) {
            const prefs = await Notification.getUserPreferences(user.id);
            
            if (prefs?.email_monthly_report) {
                // This would call your email service
                console.log(`Sending monthly report to ${user.email}`);
            }
        }
    }
}

module.exports = NotificationScheduler;