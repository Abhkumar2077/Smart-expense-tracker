function buildInsightPrompt({ user, categoryTotals, patterns, anomalies, forecast }) {
  return `
You are a financial analyst assistant. Analyze the following user financial data and return structured insights.

USER CONTEXT:
- Monthly budget: ${user.monthly_budget}
- Currency: ${user.currency || 'INR'}

CATEGORY SPENDING (this month):
${categoryTotals.map(c => `- ${c.category}: ₹${c.total} (${c.count} transactions)`).join('\n')}

DETECTED PATTERNS:
${patterns.length > 0 ? patterns.map(p => `- ${p.message}`).join('\n') : '- None detected'}

ANOMALIES:
${anomalies.length > 0 ? anomalies.map(a => `- ₹${a.amount} on ${a.date}: ${a.description}`).join('\n') : '- None detected'}

FORECAST:
- Projected monthly spend: ₹${forecast.projectedMonthly}
- Based on: ${forecast.transactionCount} recent transactions
- Confidence: ${forecast.confidence}

INSTRUCTIONS:
1. Only reference data provided above. Do not assume or infer anything not present.
2. Do not use moral language (no "bad", "good", "you should").
3. Every insight must reference a specific number from the data above.
4. Return ONLY valid JSON. No markdown, no explanation, no preamble.

REQUIRED OUTPUT FORMAT:
{
  "insights": [
    {
      "type": "pattern | anomaly | alert | recommendation | savings",
      "summary": "one clear sentence referencing specific data",
      "data_reference": "which metric this is based on",
      "confidence": "high | medium | low",
      "impact": "high | medium | low"
    }
  ],
  "suggestions": [
    {
      "action": "budget_adjustment | category_review | spending_reduction",
      "target_category": "category name or null",
      "proposed_change": "what change is being suggested",
      "rationale": "specific data point that justifies this",
      "confidence": "high | medium | low"
    }
  ]
}
`;
}

function buildWeeklyDigestPrompt({ user, weekRange, categoryTotals, topExpenses, vsLastWeek }) {
  return `
You are a financial analyst. Generate a brief weekly financial summary for a college student.

WEEK: ${weekRange.start} to ${weekRange.end}
MONTHLY BUDGET: ₹${user.monthly_budget}

SPENDING THIS WEEK BY CATEGORY:
${categoryTotals.map(c => `- ${c.category}: ₹${c.total}`).join('\n')}

TOP 3 EXPENSES:
${topExpenses.map(e => `- ₹${e.amount} on ${e.description} (${e.category})`).join('\n')}

WEEK-OVER-WEEK CHANGE:
${vsLastWeek.map(c => `- ${c.category}: ${c.change > 0 ? '+' : ''}${c.change}%`).join('\n')}

INSTRUCTIONS:
- Maximum 5 bullet points
- Each point must reference a specific number from the data
- Neutral tone, no judgment language
- Return ONLY valid JSON

REQUIRED OUTPUT FORMAT:
{
  "bullets": [
    {
      "text": "one clear factual observation",
      "category": "which category this relates to or null",
      "type": "increase | decrease | neutral | alert"
    }
  ],
  "headline": "one sentence summarizing the week"
}
`;
}

function buildCategorizationPrompt(transactions, availableCategories) {
  return `
You are a transaction categorization assistant.

AVAILABLE CATEGORIES:
${availableCategories.map(c => `- ${c.name} (id: ${c.id})`).join('\n')}

TRANSACTIONS TO CATEGORIZE:
${transactions.map((t, i) => `${i}. "${t.description}" - ₹${t.amount}`).join('\n')}

INSTRUCTIONS:
- Assign one category to each transaction
- Use only the categories listed above
- Return ONLY valid JSON, no markdown

REQUIRED FORMAT:
{
  "categorizations": [
    {
      "index": 0,
      "category_name": "exact category name from list",
      "category_id": <id from list>,
      "confidence": "high | medium | low"
    }
  ]
}
`;
}

module.exports = { buildInsightPrompt, buildWeeklyDigestPrompt, buildCategorizationPrompt };