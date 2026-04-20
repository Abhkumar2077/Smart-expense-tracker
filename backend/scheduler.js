// backend/scheduler.js
const cron = require('node-cron');
const { runDigestForAllUsers } = require('./services/weeklyDigestService');

console.log('📅 Starting weekly digest scheduler...');

// Run every Sunday at 9 AM
cron.schedule('0 9 * * 0', async () => {
  console.log('🔔 Running weekly digest generation for all users...');
  try {
    await runDigestForAllUsers();
    console.log('✅ Weekly digests generated successfully');
  } catch (error) {
    console.error('❌ Weekly digest generation failed:', error);
  }
}, {
  timezone: "America/New_York" // Adjust timezone as needed
});

console.log('✅ Weekly digest scheduler initialized (runs every Sunday at 9 AM)');