// backend/models/Notification.js
const db = require('../config/db');
const emailService = require('../services/emailService');

class Notification {
    // ============================================
    // 1. GET USER NOTIFICATION PREFERENCES
    // ============================================
    static async getUserPreferences(userId) {
        try {
            const [rows] = await db.execute(
                'SELECT * FROM notification_preferences WHERE user_id = ?',
                [userId]
            );
            
            if (rows.length === 0) {
                // Create default preferences if none exist
                return await this.createDefaultPreferences(userId);
            }
            
            return rows[0];
        } catch (error) {
            console.error('Error getting user preferences:', error);
            throw error;
        }
    }

    // ============================================
    // 2. CREATE DEFAULT PREFERENCES
    // ============================================
    static async createDefaultPreferences(userId) {
        try {
            await db.execute(
                `INSERT INTO notification_preferences (user_id) VALUES (?)`,
                [userId]
            );
            
            const [rows] = await db.execute(
                'SELECT * FROM notification_preferences WHERE user_id = ?',
                [userId]
            );
            
            return rows[0];
        } catch (error) {
            console.error('Error creating default preferences:', error);
            throw error;
        }
    }

    // ============================================
    // 3. UPDATE NOTIFICATION PREFERENCES
    // ============================================
    static async updatePreferences(userId, preferences) {
        try {
            const allowedFields = [
                'email_weekly_report', 'email_monthly_report', 'email_budget_alerts',
                'email_large_transaction', 'email_marketing', 'in_app_budget_alerts',
                'in_app_achievements', 'in_app_tips', 'in_app_reminders',
                'push_enabled', 'push_budget_alerts', 'push_large_transaction',
                'report_day', 'report_time', 'quiet_hours_start', 'quiet_hours_end'
            ];
            
            const updates = [];
            const values = [];
            
            Object.entries(preferences).forEach(([key, value]) => {
                if (allowedFields.includes(key)) {
                    updates.push(`${key} = ?`);
                    values.push(value);
                }
            });
            
            if (updates.length === 0) return false;
            
            values.push(userId);
            
            const query = `UPDATE notification_preferences SET ${updates.join(', ')} WHERE user_id = ?`;
            const [result] = await db.execute(query, values);
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating preferences:', error);
            throw error;
        }
    }

    // ============================================
    // 4. CREATE NOTIFICATION
    // ============================================
  static async create(notificationData) {
    try {
        const {
            user_id, type, title, message, channel = 'in_app',
            data = null, status = 'pending'
        } = notificationData;
        
        console.log('📝 Creating notification:', { user_id, type, title });
        
        // Check table structure
        const [columns] = await db.execute(
            "SHOW COLUMNS FROM notifications"
        );
        
        const hasStatus = columns.some(c => c.Field === 'status');
        const hasSentAt = columns.some(c => c.Field === 'sent_at');
        const hasReadAt = columns.some(c => c.Field === 'read_at');
        const hasData = columns.some(c => c.Field === 'data');
        
        let query;
        let params;
        
        if (hasStatus && hasData) {
            query = `INSERT INTO notifications 
                    (user_id, type, title, message, channel, data, status) 
                    VALUES (?, ?, ?, ?, ?, ?, ?)`;
            // Ensure data is properly stringified
            const jsonData = data ? JSON.stringify(data) : null;
            params = [user_id, type, title, message, channel, jsonData, status];
        } else {
            // Minimal insert
            query = `INSERT INTO notifications 
                    (user_id, type, title, message, channel) 
                    VALUES (?, ?, ?, ?, ?)`;
            params = [user_id, type, title, message, channel];
        }
        
        console.log('📝 Insert query:', query);
        console.log('📝 Insert params:', params);
        
        const [result] = await db.execute(query, params);
        
        const [notification] = await db.execute(
            'SELECT * FROM notifications WHERE id = ?',
            [result.insertId]
        );
        
        return notification[0];
    } catch (error) {
        console.error('❌ Error creating notification:', error);
        throw error;
    }
}

    // ============================================
    // 5. GET USER NOTIFICATIONS
    // ============================================
 static async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
        console.log(`📋 Fetching notifications for user ${userId} with limit ${limit} offset ${offset}`);
        
        // Check if table exists
        const [tables] = await db.execute("SHOW TABLES LIKE 'notifications'");
        if (tables.length === 0) {
            console.log('ℹ️ Notifications table does not exist yet');
            return [];
        }
        
        // Get table structure to know which columns exist
        const [columns] = await db.execute("SHOW COLUMNS FROM notifications");
        const columnNames = columns.map(c => c.Field);
        
        // Convert to integers
        const intLimit = parseInt(limit, 10);
        const intOffset = parseInt(offset, 10);
        
        // Build column list based on what exists
        let selectColumns = '*';
        if (!columnNames.includes('status') || !columnNames.includes('sent_at') || !columnNames.includes('read_at')) {
            selectColumns = 'id, user_id, type, title, message, data, channel, created_at';
        }
        
        // Use string interpolation for LIMIT and OFFSET (this works!)
        const query = `SELECT ${selectColumns} FROM notifications 
                      WHERE user_id = ? 
                      ORDER BY created_at DESC 
                      LIMIT ${intLimit} OFFSET ${intOffset}`;
        
        console.log('📝 Query:', query);
        console.log('📝 Params:', [userId]);
        
        const [rows] = await db.execute(query, [userId]);
        console.log(`✅ Found ${rows.length} notifications`);
        
        return rows;
        
    } catch (error) {
        console.error('❌ Error in getUserNotifications:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.sqlMessage);
        return [];
    }
}

    // ============================================
    // 6. GET UNREAD NOTIFICATIONS COUNT
    // ============================================
    static async getUnreadCount(userId) {
    try {
        const [columns] = await db.execute(
            "SHOW COLUMNS FROM notifications LIKE 'status'"
        );
        
        if (columns.length === 0) {
            return 0;
        }
        
        const [rows] = await db.execute(
            `SELECT COUNT(*) as count FROM notifications 
            WHERE user_id = ? AND status IN ('sent', 'delivered')`,
            [userId]
        );
        
        return rows[0].count;
    } catch (error) {
        console.error('❌ Error getting unread count:', error);
        return 0;
    }
}


    // ============================================
    // 7. MARK NOTIFICATION AS READ
    // ============================================
    static async markAsRead(notificationId, userId) {
        try {
            const [result] = await db.execute(
                `UPDATE notifications 
                SET status = 'read', read_at = NOW() 
                WHERE id = ? AND user_id = ?`,
                [notificationId, userId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    // ============================================
    // 8. MARK ALL NOTIFICATIONS AS READ
    // ============================================
    static async markAllAsRead(userId) {
        try {
            const [result] = await db.execute(
                `UPDATE notifications 
                SET status = 'read', read_at = NOW() 
                WHERE user_id = ? AND status IN ('sent', 'delivered')`,
                [userId]
            );
            
            return result.affectedRows;
        } catch (error) {
            console.error('Error marking all as read:', error);
            throw error;
        }
    }

    // ============================================
    // 9. DELETE NOTIFICATION
    // ============================================
    static async delete(notificationId, userId) {
        try {
            const [result] = await db.execute(
                'DELETE FROM notifications WHERE id = ? AND user_id = ?',
                [notificationId, userId]
            );
            
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting notification:', error);
            throw error;
        }
    }

    // ============================================
    // 10. SEND BUDGET ALERT
    // ============================================
    static async sendBudgetAlert(userId, budgetData) {
        try {
            const prefs = await this.getUserPreferences(userId);
            
            const notification = {
                user_id: userId,
                type: 'budget_alert',
                title: '⚠️ Budget Alert',
                message: `You've used ${budgetData.percentage}% of your monthly budget. ₹${budgetData.remaining} remaining.`,
                data: budgetData
            };
            
            // Send in-app notification
            if (prefs.in_app_budget_alerts) {
                await this.create({
                    ...notification,
                    channel: 'in_app'
                });
            }
            
            // Send email notification
            if (prefs.email_budget_alerts) {
                await emailService.sendBudgetAlert(userId, budgetData);
            }
            
            // Send push notification
            if (prefs.push_enabled && prefs.push_budget_alerts) {
                await this.sendPushNotification(userId, notification);
            }
            
            return true;
        } catch (error) {
            console.error('Error sending budget alert:', error);
            throw error;
        }
    }

    // ============================================
    // 11. SEND LARGE TRANSACTION ALERT
    // ============================================
    static async sendLargeTransactionAlert(userId, transaction) {
        try {
            const prefs = await this.getUserPreferences(userId);
            
            const notification = {
                user_id: userId,
                type: 'large_transaction',
                title: '💰 Large Transaction Detected',
                message: `₹${transaction.amount} spent on ${transaction.description || 'Unknown'}`,
                data: transaction
            };
            
            if (prefs.in_app_budget_alerts) {
                await this.create({
                    ...notification,
                    channel: 'in_app'
                });
            }
            
            if (prefs.email_large_transaction) {
                await emailService.sendLargeTransactionAlert(userId, transaction);
            }
            
            if (prefs.push_enabled && prefs.push_large_transaction) {
                await this.sendPushNotification(userId, notification);
            }
            
            return true;
        } catch (error) {
            console.error('Error sending large transaction alert:', error);
            throw error;
        }
    }

    // ============================================
    // 12. SEND ACHIEVEMENT NOTIFICATION
    // ============================================
    static async sendAchievementNotification(userId, achievement) {
        try {
            const prefs = await this.getUserPreferences(userId);
            
            if (!prefs.in_app_achievements) return false;
            
            await this.create({
                user_id: userId,
                type: 'achievement',
                title: `🏆 Achievement Unlocked: ${achievement.name}`,
                message: achievement.description,
                data: achievement,
                channel: 'in_app'
            });
            
            return true;
        } catch (error) {
            console.error('Error sending achievement notification:', error);
            throw error;
        }
    }

    // ============================================
    // 13. SEND DAILY TIP
    // ============================================
    static async sendDailyTip(userId) {
        try {
            const prefs = await this.getUserPreferences(userId);
            
            if (!prefs.in_app_tips) return false;
            
            const tips = [
                {
                    title: '💰 Save More',
                    message: 'Try the 50/30/20 rule: 50% needs, 30% wants, 20% savings'
                },
                {
                    title: '📊 Track Regularly',
                    message: 'Update your expenses daily for better insights'
                },
                {
                    title: '🎯 Set Goals',
                    message: 'Having specific savings goals increases success rate by 70%'
                },
                {
                    title: '☕ Cut Coffee',
                    message: 'Skipping one ₹300 coffee per week saves ₹15,600/year'
                },
                {
                    title: '📱 Review Subscriptions',
                    message: 'Average person spends ₹2,000/month on unused subscriptions'
                }
            ];
            
            const tip = tips[Math.floor(Math.random() * tips.length)];
            
            await this.create({
                user_id: userId,
                type: 'tip',
                title: tip.title,
                message: tip.message,
                channel: 'in_app'
            });
            
            return true;
        } catch (error) {
            console.error('Error sending daily tip:', error);
            throw error;
        }
    }

    // ============================================
    // 14. CHECK AND SEND SCHEDULED REPORTS
    // ============================================
    static async checkScheduledReports() {
    try {
        const today = new Date();
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][today.getDay()];
        const currentTime = today.toTimeString().slice(0, 8);
        
        console.log(`🔍 Checking scheduled reports for ${dayOfWeek} at ${currentTime}`);
        
        // Check if notification_preferences table exists
        try {
            const [tables] = await db.query("SHOW TABLES LIKE 'notification_preferences'");
            if (tables.length === 0) {
                console.log('ℹ️ notification_preferences table not yet created');
                return 0;
            }
        } catch (error) {
            console.log('ℹ️ Could not check for notification_preferences table');
            return 0;
        }
        
        // Find users who should receive reports now
        const [users] = await db.execute(
            `SELECT user_id, report_time FROM notification_preferences 
            WHERE report_day = ? AND report_time <= ? AND email_weekly_report = TRUE`,
            [dayOfWeek, currentTime]
        );
        
        console.log(`📧 Found ${users.length} users for scheduled reports`);
        
        for (const user of users) {
            try {
                // Send report (you'll need to implement this)
                // await emailService.sendWeeklyReport(user.user_id);
                console.log(`📧 Would send report to user ${user.user_id}`);
            } catch (reportError) {
                console.error(`Error sending report to user ${user.user_id}:`, reportError);
            }
        }
        
        return users.length;
    } catch (error) {
        console.error('Error checking scheduled reports:', error);
        return 0;
    }
}

    // ============================================
    // 15. SEND PUSH NOTIFICATION (Mock)
    // ============================================
    static async sendPushNotification(userId, notification) {
        // This would integrate with Firebase Cloud Messaging or similar
        console.log(`📱 Push notification to user ${userId}:`, notification.title);
        return true;
    }

   // ============================================
    // 16. CREATE NOTIFICATION AND SEND REAL-TIME UPDATE
    // ============================================
static async createAndNotify(notificationData) {
    try {
        // Create the notification in database
        const notification = await this.create(notificationData);
        
        // Get the io instance from app
        const io = require('../server').io;
        const sendRealtimeNotification = require('../server').sendRealtimeNotification;
        
        // Send real-time notification if user is online
        if (sendRealtimeNotification) {
            sendRealtimeNotification(notificationData.user_id, {
                type: 'new',
                notification: notification
            });
        }
        
        return notification;
    } catch (error) {
        console.error('Error creating and notifying:', error);
        throw error;
    }
}
}

module.exports = Notification;