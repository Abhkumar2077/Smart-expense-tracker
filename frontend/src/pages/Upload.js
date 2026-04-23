// frontend/src/pages/Upload.js
import React from 'react';
import axios from 'axios';
import CSVUploader from '../components/CSVUploader';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { FaUpload, FaHistory, FaTrash, FaDownload } from 'react-icons/fa';
import { MdPushPin, MdEvent, MdAttachMoney, MdDescription, MdSync, MdSettings } from 'react-icons/md';

const Upload = () => {
    const { uploadHistory, clearHistory, removeUpload, clearUpload } = useUpload();
    const { showNotification } = useNotification();
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 10;

    const handleUploadComplete = (_result) => {
        // Refresh the page or update data after upload
        window.dispatchEvent(new Event('upload-data-changed'));
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
        <div style={{
            background: 'linear-gradient(135deg, #E0F2FE 0%, #B3E5FC 100%)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div style={{
                background: 'linear-gradient(135deg, #003087 0%, #001435 100%)',
                color: 'white',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '30px',
                boxShadow: '0 4px 20px rgba(0, 3, 135, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '28px', fontWeight: 'bold', color: 'white' }}>
                        <FaUpload style={{ color: 'white' }} />
                        Import Expenses from CSV
                    </h2>
                    <button
                        onClick={handleRemoveAllImportedData}
                        className="btn"
                        style={{
                            background: 'linear-gradient(135deg, #f14668, #ff6b6b)',
                            color: 'white',
                            border: 'none',
                            padding: '10px 16px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontWeight: 'bold',
                            transition: 'all 0.3s ease',
                            boxShadow: '0 4px 15px rgba(241, 70, 104, 0.3)'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #f14668)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f14668, #ff6b6b)'}
                    >
                        <FaTrash /> Remove All Imported Data
                    </button>
                </div>
                <p style={{ color: 'rgba(255, 255, 255, 0.8)', marginTop: '5px' }}>
                    Upload your bank statements, credit card bills, or any expense CSV file.
                    Each new upload will replace the current dataset.
                </p>
            </div>

            {/* CSV Uploader Component */}
            <div className="card" style={{
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: 'none'
            }}>
                <CSVUploader onUploadComplete={handleUploadComplete} />
            </div>

            {/* Upload History */}
            {uploadHistory && uploadHistory.length > 0 && (
                <div className="card" style={{
                    marginTop: '30px',
                    background: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                    border: 'none'
                }}>
                    <div className="card-header" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '20px',
                        borderBottom: '1px solid #e0e0e0'
                    }}>
                        <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                            <FaHistory style={{ color: '#003087' }} /> Upload History
                        </h3>
                        <button
                            onClick={() => {
                                if (window.confirm('Clear all history?')) {
                                    clearHistory();
                                    setCurrentPage(1);
                                }
                            }}
                            className="btn"
                            style={{
                                background: 'linear-gradient(135deg, #f14668, #ff6b6b)',
                                color: 'white',
                                padding: '8px 16px',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 4px 15px rgba(241, 70, 104, 0.3)'
                            }}
                            onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #ff6b6b, #f14668)'}
                            onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #f14668, #ff6b6b)'}
                        >
                            <FaTrash /> Clear History
                        </button>
                    </div>
                    <div className="table-container" style={{ overflowX: 'auto' }}>
                        <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f5f5f5', borderBottom: '2px solid #e0e0e0' }}>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Date</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>File Name</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Transactions</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Income</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Expenses</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Status</th>
                                    <th style={{ padding: '12px', textAlign: 'left' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {uploadHistory.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((upload) => {
                                    const net = upload.income - upload.expense;
                                    return (
                                        <tr key={upload.id} style={{ borderBottom: '1px solid #e0e0e0' }}>
                                            <td style={{ padding: '12px' }}>{upload.date}</td>
                                            <td style={{ padding: '12px' }}>{upload.filename}</td>
                                            <td style={{ padding: '12px' }}>{upload.count}</td>
                                            <td style={{ padding: '12px', color: '#48c774' }}>{formatCurrency(upload.income)}</td>
                                            <td style={{ padding: '12px', color: '#f14668' }}>{formatCurrency(upload.expense)}</td>
                                            <td style={{ padding: '12px' }}>
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}>
                                                    <div style={{
                                                        width: '10px',
                                                        height: '10px',
                                                        borderRadius: '50%',
                                                        backgroundColor: net > 0 ? '#48c774' : net < 0 ? '#f14668' : '#ffa500'
                                                    }}></div>
                                                    <span style={{ fontSize: '12px', color: '#666' }}>
                                                        {net > 0 ? 'Profit' : net < 0 ? 'Loss' : 'Balanced'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '12px' }}>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {uploadHistory.length > itemsPerPage && (
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            gap: '10px',
                            padding: '20px',
                            borderTop: '1px solid #e0e0e0'
                        }}>
                            <button
                                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                disabled={currentPage === 1}
                                style={{
                                    padding: '8px 12px',
                                    background: currentPage === 1 ? '#f0f0f0' : 'linear-gradient(135deg, #003087, #00A3E0)',
                                    color: currentPage === 1 ? '#666' : 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Previous
                            </button>

                            <span style={{ color: '#666', fontWeight: 'bold' }}>
                                Page {currentPage} of {Math.ceil(uploadHistory.length / itemsPerPage)}
                            </span>

                            <button
                                onClick={() => setCurrentPage(Math.min(Math.ceil(uploadHistory.length / itemsPerPage), currentPage + 1))}
                                disabled={currentPage === Math.ceil(uploadHistory.length / itemsPerPage)}
                                style={{
                                    padding: '8px 12px',
                                    background: currentPage === Math.ceil(uploadHistory.length / itemsPerPage) ? '#f0f0f0' : 'linear-gradient(135deg, #003087, #00A3E0)',
                                    color: currentPage === Math.ceil(uploadHistory.length / itemsPerPage) ? '#666' : 'white',
                                    border: 'none',
                                    borderRadius: '6px',
                                    cursor: currentPage === Math.ceil(uploadHistory.length / itemsPerPage) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Tips Section */}
            <div className="card" style={{
                marginTop: '30px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: 'none',
                padding: '20px'
            }}>
                <h3 style={{ marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <MdPushPin /> Tips for Best Results
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>
                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <MdEvent /> Date Formats
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Use DD/MM/YYYY or YYYY-MM-DD<br/>
                            Example: 25/12/2026 or 2026-12-25
                        </p>
                    </div>
                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <MdAttachMoney /> Amount Format
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Use numbers without symbols<br/>
                            Example: 250.00 (not ₹250)
                        </p>
                    </div>
                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <MdDescription /> Descriptions
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Clear merchant names help<br/>
                            auto-categorization
                        </p>
                    </div>
                    <div>
                        <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                            <MdSync /> Multiple Files
                        </h4>
                        <p style={{ color: '#666', fontSize: '14px', margin: 0 }}>
                            Each new upload replaces<br/>
                            the previous dataset
                        </p>
                    </div>
                </div>
            </div>

            {/* Global Import Options */}
            <div className="card" style={{
                marginTop: '30px',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
                border: 'none',
                padding: '20px'
            }}>
                <div className="card-header" style={{
                    marginBottom: '20px'
                }}>
                    <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0 }}>
                        <MdSettings /> Global Import Settings
                    </h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                    
                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Auto-categorize transactions with AI</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Uses AI to automatically assign categories to imported transactions</p>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Skip duplicate transactions</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Automatically detect and ignore duplicate entries during import</p>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Append instead of replace data</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Add new transactions instead of replacing existing dataset</p>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Validate dates and amounts</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Validate CSV data formats before processing import</p>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" defaultChecked style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Run duplicate detection</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Check for duplicate transactions across existing data</p>
                    </div>

                    <div>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', cursor: 'pointer' }}>
                            <input type="checkbox" style={{
                                border: '2px solid rgba(0, 163, 224, 0.2)',
                                borderRadius: '4px',
                                width: '18px',
                                height: '18px'
                            }} />
                            <span>Include transfers as income/expense</span>
                        </label>
                        <p style={{ color: '#666', fontSize: '12px', paddingLeft: '26px', margin: 0 }}>Count internal account transfers in total calculations</p>
                    </div>

                </div>
            </div>

            {/* Download Template Button */}
            <div style={{ textAlign: 'center', marginTop: '30px' }}>
                <a
                    href="/api/upload/template"
                    download
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #003087, #00A3E0)',
                        border: 'none',
                        color: 'white',
                        borderRadius: '8px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        transition: 'all 0.3s ease',
                        boxShadow: '0 4px 15px rgba(0, 48, 135, 0.3)'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #001435, #003087)'}
                    onMouseOut={(e) => e.currentTarget.style.background = 'linear-gradient(135deg, #003087, #00A3E0)'}
                >
                    <FaDownload /> Download Sample CSV Template
                </a>
            </div>
        </div>
    );
};

export default Upload;
