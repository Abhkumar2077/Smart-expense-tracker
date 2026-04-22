import React from 'react';

const STATUS_COLORS = {
  safe: '#2e8b57',
  warning: '#d4a017',
  exceeded: '#c0392b'
};

const BudgetProgressBar = ({ percentage = 0, status = 'safe' }) => {
  const normalized = Math.max(0, Number(percentage) || 0);
  const capped = Math.min(normalized, 100);
  const color = STATUS_COLORS[status] || STATUS_COLORS.safe;

  return (
    <div style={{ marginTop: '10px' }}>
      <div
        style={{
          width: '100%',
          height: '14px',
          borderRadius: '999px',
          background: '#e6edf3',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            width: `${capped}%`,
            height: '100%',
            borderRadius: '999px',
            background: `linear-gradient(90deg, ${color}, ${color}cc)`,
            transition: 'width 0.35s ease'
          }}
        />
      </div>
      <div style={{ marginTop: '8px', fontWeight: 600, color }}>{normalized.toFixed(0)}%</div>
    </div>
  );
};

export default BudgetProgressBar;
