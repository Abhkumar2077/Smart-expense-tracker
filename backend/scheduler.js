// backend/scheduler.js
const cron = require('node-cron');
const { runDigestForAllUsers } = require('./services/weeklyDigestService');


// Run every Sunday at 9 AM
cron.schedule('0 9 * * 0', async () => {
  try {
    await runDigestForAllUsers();
  } catch (error) {
    console.error('❌ Weekly digest generation failed:', error);
  }
}, {
  timezone: "America/New_York" // Adjust timezone as needed
});

