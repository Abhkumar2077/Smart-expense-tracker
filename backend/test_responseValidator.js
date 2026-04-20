// Quick test for responseValidator.js
const { validateAIResponse } = require('./services/responseValidator');

function testResponseValidator() {
    // Valid response
    const validResponse = `{
        "insights": [
            {
                "type": "pattern",
                "summary": "Food spending increased by 20%",
                "data_reference": "category totals",
                "confidence": "high",
                "impact": "medium"
            }
        ],
        "suggestions": [
            {
                "action": "budget_adjustment",
                "target_category": "Food",
                "proposed_change": "Reduce by 10%",
                "rationale": "High spending in category",
                "confidence": "medium"
            }
        ]
    }`;

    try {
        const result = validateAIResponse(validResponse);
        console.log('Valid response passed:', result.insights.length, 'insights,', result.suggestions.length, 'suggestions');
    } catch (error) {
        console.error('Valid response failed:', error.message);
    }

    // Invalid response (missing insights)
    const invalidResponse = `{"suggestions": []}`;

    try {
        validateAIResponse(invalidResponse);
        console.log('Invalid response unexpectedly passed');
    } catch (error) {
        console.log('Invalid response correctly rejected:', error.message);
    }

    // Response with forbidden phrase
    const forbiddenResponse = `{
        "insights": [
            {
                "type": "alert",
                "summary": "You should reduce spending",
                "data_reference": "budget",
                "confidence": "high",
                "impact": "high"
            }
        ],
        "suggestions": []
    }`;

    try {
        const result = validateAIResponse(forbiddenResponse);
        console.log('Forbidden response filtered:', result.insights.length, 'insights remaining');
    } catch (error) {
        console.error('Forbidden response error:', error.message);
    }
}

testResponseValidator();