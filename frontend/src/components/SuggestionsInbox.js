import React, { useEffect, useState } from 'react';
import { suggestionsAPI } from '../services/api';

const confidenceColor = {
  high: '#22c55e',
  medium: '#f59e0b',
  low: '#94a3b8'
};

export default function SuggestionsInbox() {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const res = await suggestionsAPI.getPending();
      setSuggestions(res.data.suggestions);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const decide = async (id, status) => {
    try {
      await suggestionsAPI.decide(id, status);
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading suggestions...</p>;
  if (suggestions.length === 0) return (
    <div className="suggestions-empty">
      <p>No pending suggestions. Generate AI insights to populate this.</p>
    </div>
  );

  return (
    <div className="suggestions-inbox">
      <h3>AI Suggestions ({suggestions.length} pending)</h3>
      {suggestions.map(s => (
        <div key={s.id} className="suggestion-card">
          <div className="suggestion-header">
            <span className="suggestion-action">{s.action.replace(/_/g, ' ')}</span>
            <span
              className="suggestion-confidence"
              style={{ color: confidenceColor[s.confidence] }}
            >
              {s.confidence} confidence
            </span>
          </div>

          {s.target_category && (
            <p className="suggestion-category">Category: {s.target_category}</p>
          )}

          <p className="suggestion-change">{s.proposed_change}</p>
          <p className="suggestion-rationale">Based on: {s.rationale}</p>

          <div className="suggestion-actions">
            <button
              className="btn-accept"
              onClick={() => decide(s.id, 'accepted')}
            >
              Accept
            </button>
            <button
              className="btn-reject"
              onClick={() => decide(s.id, 'rejected')}
            >
              Dismiss
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}