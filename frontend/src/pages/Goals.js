// frontend/src/pages/Goals.js
import React from 'react';
import SavingsGoals from '../components/SavingsGoals';

const Goals = () => {
    return (
        <div style={{
            background: 'linear-gradient(135deg, #E6F3FF 0%, #B3D9FF 50%, #80BFFF 100%)',
            padding: '32px'
        }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '40px',
                marginTop: '50px',
                flexWrap: 'wrap',
                gap: '15px',
                background: 'linear-gradient(135deg, #001435 0%, #003087 50%, #00A3E0 100%)',
                padding: '24px 32px',
                borderRadius: '16px',
                boxShadow: '0 12px 40px rgba(0, 3, 135, 0.3)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <style>{`
                    .goals-header::before {
                        content: '';
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: linear-gradient(45deg, rgba(255, 255, 255, 0.1) 0%, transparent 50%, rgba(255, 255, 255, 0.05) 100%);
                        pointer-events: none;
                    }
                `}</style>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <h2 style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'white',
                        margin: 0
                    }}>
                        🎯 Savings Goals
                    </h2>
                    <p style={{
                        margin: '8px 0 0',
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '16px'
                    }}>
                        Track your financial goals and stay motivated on your journey to financial freedom.
                    </p>
                </div>
            </div>

            {/* Savings Goals Component */}
            <div style={{ marginBottom: '48px' }}>
                <SavingsGoals />
            </div>
        </div>
    );
};

export default Goals;