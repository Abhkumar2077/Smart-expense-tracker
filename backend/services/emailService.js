const nodemailer = require('nodemailer');
const Expense = require('../models/Expense');

class EmailService {
  static async sendWeeklyReport(userId, userEmail, userName) {
    try {
      // Get last week's expenses
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      
      const expenses = await Expense.findByUserId(
        userId, 
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      );
      
      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      const categories = [...new Set(expenses.map(e => e.category_name))];
      
      // Create HTML email
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; border-radius: 10px; }
            .stats { display: flex; justify-content: space-around; margin: 30px 0; }
            .stat-card { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 10px; }
            .amount { font-size: 32px; font-weight: bold; color: #667eea; }
            .footer { margin-top: 30px; padding: 20px; text-align: center; color: #666; }
            .btn { display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #667eea, #764ba2); color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Expense Report</h1>
              <p>Hello ${userName}!</p>
            </div>
            
            <div class="stats">
              <div class="stat-card">
                <div style="color: #666; margin-bottom: 10px;">Total Spent</div>
                <div class="amount">₹${total.toFixed(2)}</div>
              </div>
              <div class="stat-card">
                <div style="color: #666; margin-bottom: 10px;">Transactions</div>
                <div class="amount">${expenses.length}</div>
              </div>
              <div class="stat-card">
                <div style="color: #666; margin-bottom: 10px;">Categories</div>
                <div class="amount">${categories.length}</div>
              </div>
            </div>
            
            <h3>Top Spending Categories</h3>
            <table style="width: 100%; border-collapse: collapse;">
              ${Object.entries(
                expenses.reduce((acc, e) => {
                  acc[e.category_name] = (acc[e.category_name] || 0) + e.amount;
                  return acc;
                }, {})
              )
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([cat, amt]) => `
                  <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #eee;">${cat}</td>
                    <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${amt.toFixed(2)}</td>
                  </tr>
                `).join('')}
            </table>
            
            <div style="text-align: center; margin-top: 40px;">
              <a href="http://localhost:3000/reports" class="btn">View Full Report</a>
            </div>
            
            <div class="footer">
              <p>Smart Expense Tracker - Your personal finance assistant</p>
              <p style="font-size: 12px;">To unsubscribe, visit Settings → Notifications</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Configure email transporter
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await transporter.sendMail({
        from: '"Smart Expense Tracker" <reports@smartexpense.com>',
        to: userEmail,
        subject: `📊 Your Weekly Expense Report - ${endDate.toLocaleDateString()}`,
        html: html
      });

      console.log(`✅ Weekly report sent to ${userEmail}`);
      return { success: true };
      
    } catch (error) {
      console.error('❌ Email error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = EmailService;