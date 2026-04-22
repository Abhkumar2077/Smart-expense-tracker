import React from 'react';
import BudgetProgressBar from './BudgetProgressBar';

const STATUS_BADGE = {
  safe: { label: 'Safe', bg: '#e9f7ef', color: '#2e8b57' },
  warning: { label: 'Warning', bg: '#fff6df', color: '#d4a017' },
  exceeded: { label: 'Exceeded', bg: '#fdecea', color: '#c0392b' }
};

const formatINR = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

const BudgetCard = ({ budget }) => {
  const badge = STATUS_BADGE[budget.status] || STATUS_BADGE.safe;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '14px',
        border: '1px solid #d7e5f2',
        padding: '16px',
        boxShadow: '0 8px 18px rgba(0, 20, 53, 0.08)'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
        <h4 style={{ margin: 0, color: '#012a4a' }}>
          {budget.icon ? `${budget.icon} ` : ''}
          {budget.category}
        </h4>
        <span
          style={{
            background: badge.bg,
            color: badge.color,
            borderRadius: '999px',
            padding: '5px 10px',
            fontSize: '12px',
            fontWeight: 700
          }}
        >
          {badge.label}
        </span>
      </div>

      <p style={{ margin: '10px 0 0', color: '#334e68', fontWeight: 600 }}>
        {formatINR(budget.used)} / {formatINR(budget.limit)}
      </p>

      <BudgetProgressBar percentage={budget.percentage} status={budget.status} />

      {budget.suggestion && (
        <p style={{ margin: '12px 0 0', color: '#486581', fontSize: '13px' }}>{budget.suggestion}</p>
      )}
    </div>
  );
};

export default BudgetCard;
