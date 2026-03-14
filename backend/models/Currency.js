const db = require('../config/db');

class Currency {
  static async getUserCurrency(userId) {
    const [rows] = await db.execute(
      'SELECT currency FROM users WHERE id = ?',
      [userId]
    );
    return rows[0]?.currency || 'INR';
  }

  static async updateUserCurrency(userId, currency) {
    const [result] = await db.execute(
      'UPDATE users SET currency = ? WHERE id = ?',
      [currency, userId]
    );
    return result.affectedRows > 0;
  }

  static async convertAmount(amount, fromCurrency, toCurrency) {
    // Simple static rates - in production, use API like Fixer.io
    const rates = {
      'INR': 1,
      'USD': 83.5,
      'EUR': 90.2,
      'GBP': 105.3,
      'JPY': 0.56,
      'SGD': 62.1
    };

    if (fromCurrency === toCurrency) return amount;
    
    const inINR = amount * (rates[fromCurrency] || 1);
    const converted = inINR / (rates[toCurrency] || 1);
    
    return Math.round(converted * 100) / 100;
  }

  static getAllCurrencies() {
    return [
      { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      { code: 'USD', symbol: '$', name: 'US Dollar' },
      { code: 'EUR', symbol: '€', name: 'Euro' },
      { code: 'GBP', symbol: '£', name: 'British Pound' },
      { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' }
    ];
  }
}

module.exports = Currency;