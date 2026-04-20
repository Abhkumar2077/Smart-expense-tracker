// Quick test for promptBuilder.js
const { buildInsightPrompt } = require('./services/promptBuilder');

function testPromptBuilder() {
    const mockData = {
        user: { monthly_budget: 50000, currency: 'INR' },
        categoryTotals: [
            { category: 'Food', total: 15000, count: 20 },
            { category: 'Transport', total: 8000, count: 15 }
        ],
        patterns: [{ message: 'Increasing food spending' }],
        anomalies: [{ amount: 5000, date: '2023-10-01', description: 'Large purchase' }],
        forecast: { projectedMonthly: 45000, transactionCount: 50, confidence: 'medium' }
    };

    const prompt = buildInsightPrompt(mockData);
    console.log('Prompt generated successfully');
    console.log('Length:', prompt.length);
    console.log('Contains JSON format:', prompt.includes('REQUIRED OUTPUT FORMAT'));
}

testPromptBuilder();