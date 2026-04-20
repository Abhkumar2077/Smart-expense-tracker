// backend/services/geminiService.js
const axios = require('axios');

class GeminiService {
    constructor() {
        this.apiKey = process.env.GEMINI_API_KEY;
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
    }

    async generateFinancialInsights(data) {
        try {
            if (!this.apiKey) {
                console.log('⚠️ Gemini API key not configured, using fallback AI');
                return null;
            }

            const prompt = this.buildFinancialPrompt(data);

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
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
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                const text = response.data.candidates[0].content.parts[0].text;
                return this.parseGeminiResponse(text);
            }

            return null;
        } catch (error) {
            console.error('❌ Gemini API Error:', error.response?.data || error.message);
            
            // Check for specific error types
            if (error.response?.status === 429) {
                console.log('⚠️ Gemini API quota exceeded - using fallback AI');
                return { error: 'API quota exceeded', fallback: true };
            } else if (error.response?.status === 403) {
                console.log('⚠️ Gemini API key invalid or unauthorized');
                return { error: 'API key invalid', fallback: true };
            }
            
            return null;
        }
    }

    buildFinancialPrompt(data) {
        const { expenses, categorySummary, user, insights } = data;

        return `You are a financial AI assistant analyzing a user's spending patterns. Provide 3-5 specific, actionable insights based on this financial data:

USER PROFILE:
- Monthly Budget: $${user.monthly_budget || 0}
- Current Month Income: $${insights.current_month?.total_income || 0}
- Current Month Expenses: $${insights.current_month?.total_expenses || 0}
- Previous Month Expenses: $${insights.previous_month?.total_expenses || 0}

SPENDING BY CATEGORY:
${categorySummary.map(cat => `- ${cat.name}: $${cat.total_expense}`).join('\n')}

RECENT TRANSACTIONS (last 10):
${expenses.slice(-10).map(exp =>
    `${exp.date}: ${exp.type === 'income' ? '+' : '-'}$${exp.amount} - ${exp.category_name} - ${exp.description || 'No description'}`
).join('\n')}

Please provide insights in this exact JSON format:
{
    "insights": [
        {
            "type": "pattern|saving|alert|recommendation",
            "title": "Brief title (max 8 words)",
            "description": "Detailed explanation (max 50 words)",
            "impact": "high|medium|low",
            "actionable": "Specific action the user should take"
        }
    ],
    "confidence": "high|medium|low"
}

Focus on:
1. Spending patterns and trends
2. Budget optimization opportunities
3. Potential savings
4. Unusual spending detection
5. Financial health assessment

Be specific, actionable, and encouraging.`;
    }

    parseGeminiResponse(text) {
        try {
            // Extract JSON from the response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                return {
                    geminiInsights: parsed.insights || [],
                    confidence: parsed.confidence || 'medium',
                    enhanced: true
                };
            }
            return null;
        } catch (error) {
            console.error('❌ Error parsing Gemini response:', error);
            return null;
        }
    }

    async enhanceInsights(basicInsights, data) {
        const geminiResult = await this.generateFinancialInsights(data);

        if (!geminiResult) {
            return basicInsights; // Return basic insights if Gemini fails
        }

        // Merge Gemini insights with basic insights
        const enhancedInsights = { ...basicInsights };

        // Add Gemini insights to the appropriate categories
        geminiResult.geminiInsights.forEach(geminiInsight => {
            switch (geminiInsight.type) {
                case 'pattern':
                    enhancedInsights.patterns.unshift({
                        title: `🤖 ${geminiInsight.title}`,
                        description: geminiInsight.description,
                        suggestion: geminiInsight.actionable,
                        impact: geminiInsight.impact,
                        enhanced: true
                    });
                    break;
                case 'saving':
                    enhancedInsights.savings.unshift({
                        category: geminiInsight.title,
                        potential: 'AI Suggested',
                        suggestion: geminiInsight.actionable,
                        enhanced: true
                    });
                    break;
                case 'alert':
                    enhancedInsights.alerts.unshift({
                        title: `🚨 ${geminiInsight.title}`,
                        description: geminiInsight.description,
                        suggestion: geminiInsight.actionable,
                        severity: geminiInsight.impact,
                        enhanced: true
                    });
                    break;
                case 'recommendation':
                    enhancedInsights.recommendations.unshift({
                        title: `💡 ${geminiInsight.title}`,
                        description: geminiInsight.description,
                        suggestion: geminiInsight.actionable,
                        priority: geminiInsight.impact,
                        enhanced: true
                    });
                    break;
            }
        });

        // Update AI confidence
        enhancedInsights.aiConfidence = geminiResult.confidence;
        enhancedInsights.geminiEnhanced = true;

        return enhancedInsights;
    }

    async generateContent(prompt) {
        try {
            if (!this.apiKey) {
                throw new Error('Gemini API key not configured');
            }

            const response = await axios.post(`${this.baseUrl}?key=${this.apiKey}`, {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            }, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.data && response.data.candidates && response.data.candidates[0]) {
                return response.data.candidates[0].content.parts[0].text;
            }

            throw new Error('No response from Gemini API');
        } catch (error) {
            console.error('❌ Gemini API Error in generateContent:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = new GeminiService();