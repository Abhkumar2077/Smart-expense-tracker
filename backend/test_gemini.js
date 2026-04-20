// Quick test for geminiService.js
const geminiService = require('./services/geminiService');

async function testGeminiService() {
    try {
        // Mock data for testing
        const mockData = {
            expenses: [
                { date: '2023-10-01', type: 'expense', amount: 50, category_name: 'Food', description: 'Lunch' }
            ],
            categorySummary: [
                { name: 'Food', total_expense: 200 }
            ],
            user: { monthly_budget: 1000 },
            insights: {
                current_month: { total_income: 1500, total_expenses: 800 },
                previous_month: { total_expenses: 750 }
            }
        };

        const result = await geminiService.generateFinancialInsights(mockData);
        console.log('Test result:', result);
        console.log('Service is working - no crashes');
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testGeminiService();