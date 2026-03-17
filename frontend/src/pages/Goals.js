// frontend/src/pages/Goals.js
import React from 'react';
import Sidebar from '../components/Sidebar';
import SavingsGoals from '../components/SavingsGoals';

const Goals = () => {
    return (
        <div className="dashboard">
            <Sidebar />
            <div className="main-content">
                <h2 style={{ marginBottom: '20px' }}>🎯 Savings Goals</h2>
                <SavingsGoals />
            </div>
        </div>
    );
};

export default Goals;