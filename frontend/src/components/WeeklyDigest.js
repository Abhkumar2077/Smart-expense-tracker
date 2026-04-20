import React, { useEffect, useState } from 'react';
import axios from 'axios';

const typeIcon = {
  increase: '↑',
  decrease: '↓',
  alert: '⚠',
  neutral: '•'
};

export default function WeeklyDigest() {
  const [digest, setDigest] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/ai/weekly-digest')
      .then(res => setDigest(res.data.digest))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading weekly digest...</p>;
  if (!digest) return <p>No digest available yet. Add some transactions this week.</p>;

  return (
    <div className="weekly-digest">
      <div className="digest-header">
        <h3>This Week</h3>
        <span className="digest-range">{digest.week_start} – {digest.week_end}</span>
      </div>
      <p className="digest-headline">{digest.headline}</p>
      <ul className="digest-bullets">
        {digest.bullets.map((b, i) => (
          <li key={i} className={`digest-bullet digest-${b.type}`}>
            <span className="bullet-icon">{typeIcon[b.type]}</span>
            {b.text}
          </li>
        ))}
      </ul>
    </div>
  );
}