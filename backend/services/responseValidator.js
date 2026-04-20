// backend/services/responseValidator.js

const FORBIDDEN_PHRASES = ['you should', 'bad spending', 'you must', 'irresponsible', 'wasteful'];

function validateAIResponse(raw) {
  let parsed;

  // Step 1: strip markdown fences if present
  const cleaned = raw.replace(/```json|```/g, '').trim();

  // Step 2: parse JSON
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    throw new Error('AI response was not valid JSON: ' + cleaned.slice(0, 100));
  }

  // Step 3: check required top-level keys
  if (!parsed.insights || !Array.isArray(parsed.insights)) {
    throw new Error('AI response missing insights array');
  }
  if (!parsed.suggestions || !Array.isArray(parsed.suggestions)) {
    throw new Error('AI response missing suggestions array');
  }

  // Step 4: validate each insight
  parsed.insights = parsed.insights.filter(insight => {
    if (!insight.summary || !insight.type || !insight.confidence) return false;

    // reject moral language
    const hasForbidden = FORBIDDEN_PHRASES.some(phrase =>
      insight.summary.toLowerCase().includes(phrase)
    );
    return !hasForbidden;
  });

  // Step 5: validate each suggestion
  parsed.suggestions = parsed.suggestions.filter(s => {
    return s.action && s.rationale && s.confidence;
  });

  return parsed;
}

module.exports = { validateAIResponse };