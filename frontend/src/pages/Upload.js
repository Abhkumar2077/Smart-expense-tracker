// frontend/src/pages/Upload.js
import React from 'react';
import axios from 'axios';
import CSVUploader from '../components/CSVUploader';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { FaUpload, FaHistory, FaTrash, FaDownload } from 'react-icons/fa';
import { MdPushPin, MdEvent, MdAttachMoney, MdDescription, MdSync } from 'react-icons/md';

const Upload = () => {
    const { uploadHistory, clearHistory, removeUpload, clearUpload } = useUpload();
    const { showNotification } = useNotification();

    const handleUploadComplete = (result) => {
        console.log('Upload complete:', result);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const handleRemoveAllImportedData = async () => {
        const confirmed = window.confirm(
            'This will permanently delete all imported CSV transactions and clear upload history. Continue?'
        );

        if (!confirmed) return;

        try {
            const res = await axios.delete('/api/upload/clear-all');
            clearUpload();
            clearHistory();
            window.dispatchEvent(new Event('upload-data-changed'));

            const deletedCount = res.data?.deletedCount ?? 0;
            showNotification(`Deleted ${deletedCount} transactions successfully`, 'success');
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to remove imported data';
            showNotification(message, 'error');
        }
    };

    return (
        <div>
                <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 'var(--spacing-lg)', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h2 style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', margin: 0, fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>
                            <FaUpload style={{ color: 'var(--color-primary)' }} />
                            Import Expenses from CSV
                        </h2>
                        <button
                            onClick={handleRemoveAllImportedData}
                            className="btn"
                            style={{
                                background: '#f14668',
                                color: 'white',
                                border: 'none',
                                padding: '10px 16px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaTrash /> Remove All Imported Data
                        </button>
                    </div>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                        Upload your bank statements, credit card bills, or any expense CSV file.
                        Each new upload will replace the current dataset.
                    </p>
                </div>

                {/* CSV Uploader Component */}
                <div className="card">
                    <CSVUploader onUploadComplete={handleUploadComplete} />
                </div>

                {/* Upload History */}
                {uploadHistory && uploadHistory.length > 0 && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div className="card-header">
                            <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <FaHistory /> Upload History
                            </h3>
                            <button
                                onClick={() => {
                                    if (window.confirm('Clear all history?')) {
                                        clearHistory();
                                    }
                                }}
                                className="btn"
                                style={{
                                    background: '#f14668',
                                    color: 'white',
                                    padding: '8px 16px',
                                    border: 'none'
                                }}
                            >
                                <FaTrash /> Clear History
                            </button>
                        </div>
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>File Name</th>
                                        <th>Transactions</th>
                                        <th>Income</th>
                                        <th>Expenses</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uploadHistory.map((upload) => (
                                        <tr key={upload.id}>
                                            <td>{upload.date}</td>
                                            <td>{upload.filename}</td>
                                            <td>{upload.count}</td>
                                            <td style={{ color: '#48c774' }}>{formatCurrency(upload.income)}</td>
                                            <td style={{ color: '#f14668' }}>{formatCurrency(upload.expense)}</td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        if (window.confirm('Remove from history?')) {
                                                            removeUpload(upload.id);
                                                        }
                                                    }}
                                                    style={{
                                                        padding: '5px 10px',
                                                        background: 'transparent',
                                                        border: '1px solid #f14668',
                                                        color: '#f14668',
                                                        borderRadius: '5px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    <FaTrash size={12} /> Remove
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Tips Section */}
                <div className="card" style={{ 
                    marginTop: '30px', 
                    background: 'linear-gradient(135deg, #00308705, #00A3E005)'
                }}>
                    <h3 style={{ marginBottom: '15px' }}><MdPushPin /> Tips for Best Results</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                        <div>
                            <h4><MdEvent /> Date Formats</h4>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                                Use DD/MM/YYYY or YYYY-MM-DD<br/>
                                Example: 25/12/2026 or 2026-12-25
                            </p>
                        </div>
                        <div>
                            <h4><MdAttachMoney /> Amount Format</h4>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                                Use numbers without symbols<br/>
                                Example: 250.00 (not ₹250)
                            </p>
                        </div>
                        <div>
                            <h4><MdDescription /> Descriptions</h4>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                                Clear merchant names help<br/>
                                auto-categorization
                            </p>
                        </div>
                        <div>
                            <h4><MdSync /> Multiple Files</h4>
                            <p style={{ color: '#666', fontSize: '14px' }}>
                                Each new upload replaces<br/>
                                the previous dataset
                            </p>
                        </div>
                    </div>
                </div>

                {/* Download Template Button */}
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <a 
                        href="/api/upload/template" 
                        download
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: 'white',
                            border: '2px solid #667eea',
                            color: '#667eea',
                            borderRadius: '5px',
                            textDecoration: 'none',
                            fontWeight: 'bold'
                        }}
                    >
                        <FaDownload /> Download Sample CSV Template
                    </a>
                </div>
            </div>
    );
};

export default Upload;