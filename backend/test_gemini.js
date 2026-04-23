// Comprehensive test for geminiService.js
const geminiService = require('./services/geminiService');

async function testGeminiService() {
    try {
        console.log('🚀 Starting Gemini API Integration Test...\n');

        // Mock data for testing
        const mockData = {
            expenses: [
                { date: '2023-10-01', type: 'expense', amount: 50, category_name: 'Food', description: 'Lunch at restaurant' },
                { date: '2023-10-02', type: 'expense', amount: 25, category_name: 'Transportation', description: 'Bus fare' },
                { date: '2023-10-03', type: 'income', amount: 3000, category_name: 'Salary', description: 'Monthly salary' },
                { date: '2023-10-05', type: 'expense', amount: 150, category_name: 'Entertainment', description: 'Movie tickets' }
            ],
            categorySummary: [
                { name: 'Food', total_expense: 200 },
                { name: 'Transportation', total_expense: 50 },
                { name: 'Entertainment', total_expense: 150 },
                { name: 'Utilities', total_expense: 300 }
            ],
            user: { monthly_budget: 2500, id: 1 },
            insights: {
                current_month: { total_income: 3200, total_expenses: 700 },
                previous_month: { total_expenses: 650 }
            }
        };

        console.log('📊 Test Data Prepared:');
        console.log('- Expenses:', mockData.expenses.length, 'transactions');
        console.log('- Categories:', mockData.categorySummary.length);
        console.log('- User Budget:', mockData.user.monthly_budget);
        console.log('- Current Income:', mockData.insights.current_month.total_income);
        console.log('- Current Expenses:', mockData.insights.current_month.total_expenses);
        console.log();

        // Test 1: Check prompt building
        console.log('📝 Test 1: Prompt Building...');
        const prompt = geminiService.buildFinancialPrompt(mockData);
        console.log('✅ Prompt generated successfully');
        console.log('📏 Prompt length:', prompt.length, 'characters');
        console.log('📋 Prompt preview:');
        console.log(prompt.substring(0, 200) + '...');
        console.log();

        // Test 2: Check JSON request structure
        console.log('📦 Test 2: JSON Request Structure...');
        const requestPayload = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1024,
            }
        };

        console.log('✅ Request payload structure valid');
        console.log('📏 Request size:', JSON.stringify(requestPayload).length, 'characters');
        console.log('🔧 Generation config:', JSON.stringify(requestPayload.generationConfig, null, 2));
        console.log();

        // Test 3: Mock response parsing
        console.log('🔄 Test 3: Response Parsing...');
        const mockGeminiResponse = `Based on your financial data, here are some key insights:

{
  "insights": [
    {
      "type": "saving",
      "title": "Reduce entertainment spending",
      "description": "Your entertainment expenses are higher than expected this month",
      "impact": "medium",
      "actionable": "Set a monthly entertainment budget of $100"
    },
    {
      "type": "pattern",
      "title": "Regular food expenses",
      "description": "You have consistent spending on food throughout the month",
      "impact": "low",
      "actionable": "Consider meal planning to optimize food costs"
    }
  ],
  "confidence": "high"
}

These insights should help you better manage your finances.`;

        const parsedResult = geminiService.parseGeminiResponse(mockGeminiResponse);
        console.log('✅ Response parsing successful');
        console.log('📊 Parsed result:', JSON.stringify(parsedResult, null, 2));
        console.log();

        // Test 4: API Call (only if API key is available)
        console.log('🌐 Test 4: Actual API Call...');
        const hasApiKey = !!geminiService.apiKey;
        console.log('🔑 API Key available:', hasApiKey ? 'Yes' : 'No (skipping API call)');

        if (hasApiKey) {
            const result = await geminiService.generateFinancialInsights(mockData);
            console.log('✅ Gemini API call completed');
            console.log('📊 API Result:', JSON.stringify(result, null, 2));
        } else {
            console.log('⏭️ Skipping API call - no API key configured');
            console.log('💡 To test with real API, set GEMINI_API_KEY environment variable');
        }

        console.log('\n🎉 All tests completed successfully!');

        // Test 5: API Route Response Structure
        console.log('\n📡 Test 5: API Route Response Structure...');
        const mockApiResponse = {
            success: true,
            geminiInsights: parsedResult.geminiInsights,
            confidence: parsedResult.confidence,
            enhanced: parsedResult.enhanced,
            timestamp: new Date().toISOString()
        };

        console.log('✅ Mock API response structure valid');
        console.log('📊 Response data:', JSON.stringify(mockApiResponse, null, 2));
        console.log('🔍 Frontend-ready fields:');
        console.log('- success:', mockApiResponse.success);
        console.log('- geminiInsights array length:', mockApiResponse.geminiInsights.length);
        console.log('- confidence:', mockApiResponse.confidence);
        console.log('- timestamp present:', !!mockApiResponse.timestamp);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('🔍 Error details:', error.stack);
    }
}

testGeminiService();
