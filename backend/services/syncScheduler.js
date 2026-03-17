// backend/services/syncScheduler.js
const cron = require('node-cron');
const db = require('../config/db');
const plaidService = require('./plaidService');

class SyncScheduler {
    // Initialize scheduled syncs
    static init() {
        // Run sync every day at 2 AM
        cron.schedule('0 2 * * *', async () => {
            console.log('🔄 Running scheduled bank sync at', new Date().toISOString());
            await this.syncAllUsers();
        });

        // Run cleanup every Sunday at 3 AM
        cron.schedule('0 3 * * 0', async () => {
            console.log('🧹 Running cleanup task at', new Date().toISOString());
            await this.cleanupOldLogs();
        });

        console.log('✅ Sync scheduler started');
    }

    // Sync all active accounts for all users
    static async syncAllUsers() {
        try {
            // Get all users with active bank accounts
            const [users] = await db.execute(
                `SELECT DISTINCT user_id 
                 FROM bank_accounts 
                 WHERE is_active = TRUE 
                 AND last_sync IS NULL OR last_sync < DATE_SUB(NOW(), INTERVAL 23 HOUR)`
            );

            console.log(`📊 Found ${users.length} users to sync`);

            for (const user of users) {
                try {
                    await plaidService.syncAllUserAccounts(user.user_id);
                    // Wait a bit between users to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 1000));
                } catch (error) {
                    console.error(`❌ Error syncing user ${user.user_id}:`, error);
                }
            }

            console.log('✅ Scheduled sync completed');
        } catch (error) {
            console.error('❌ Error in scheduled sync:', error);
        }
    }

    // Clean up old sync logs (keep last 30 days)
    static async cleanupOldLogs() {
        try {
            const [result] = await db.execute(
                `DELETE FROM bank_sync_logs 
                 WHERE started_at < DATE_SUB(NOW(), INTERVAL 30 DAY)`
            );
            console.log(`🧹 Cleaned up ${result.affectedRows} old sync logs`);
        } catch (error) {
            console.error('❌ Error cleaning up logs:', error);
        }
    }
}

module.exports = SyncScheduler;