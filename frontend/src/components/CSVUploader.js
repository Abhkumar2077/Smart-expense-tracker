// frontend/src/components/CSVUploader.js
import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useUpload } from '../context/UploadContext';
import { useNotification } from '../context/NotificationContext';
import { 
    FaCloudUploadAlt, 
    FaFileCsv, 
    FaCheckCircle, 
    FaExclamationTriangle,
    FaDownload,
    FaChartLine,
    FaSave,
    FaTimes,
    FaTrash,
    FaSync,
    FaUpload
} from 'react-icons/fa';
import { MdInsertDriveFile, MdBarChart, MdEvent, MdAttachMoney, MdDescription, MdLabel } from 'react-icons/md';
import { Link, useNavigate } from 'react-router-dom';

const CSVUploader = ({ onUploadComplete }) => {
    const { showNotification } = useNotification();
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [categories, setCategories] = useState([]);
    const [categorizedPreview, setCategorizedPreview] = useState(null);
    const [selectedCategories, setSelectedCategories] = useState({});
    
    const { uploadedData, addUpload, clearUpload } = useUpload();
    const navigate = useNavigate();

    // Fetch categories on mount
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    };

    const getAISuggestedCategories = async (parsedRows) => {
        try {
            const res = await axios.post('/api/upload/categorize-preview', {
                transactions: parsedRows.map(r => ({
                    description: r.description,
                    amount: r.amount
                }))
            });
            return res.data.transactions;
        } catch (err) {
            console.error('AI categorization failed, using manual flow');
            return parsedRows; // fall back to manual categorization
        }
    };

    const handleCategoryChange = (index, categoryId) => {
        setSelectedCategories(prev => ({
            ...prev,
            [index]: categoryId
        }));
    };

    // Listen for upload data changes
    useEffect(() => {
        const handleDataChange = () => {
            setFile(null);
            setResult(null);
            setPreview(null);
            setError(null);
        };
        
        window.addEventListener('upload-data-cleared', handleDataChange);
        return () => window.removeEventListener('upload-data-cleared', handleDataChange);
    }, []);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;
        
        console.log('File selected:', file.name);
        
        setFile(file);
        setError(null);
        setResult(null);
        setPreview(null);
        setUploadProgress(0);
        
        await validateFile(file);
    }, []);

    const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
        onDrop,
        accept: {
            'text/csv': ['.csv'],
            'application/vnd.ms-excel': ['.csv']
        },
        maxFiles: 1,
        maxSize: 10 * 1024 * 1024,
        noClick: true,
        noKeyboard: true
    });

    const validateFile = async (file) => {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post('/api/upload/validate', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            console.log('Validation response:', res.data);
            setPreview(res.data);

            // Get AI suggestions for categorization
            if (res.data.sample && res.data.sample.length > 0) {
                const suggestions = await getAISuggestedCategories(res.data.sample);
                setCategorizedPreview(suggestions);
            }

            setError(null);
        } catch (err) {
            console.error('❌ Validation error:', err);
            setError(err.response?.data?.message || 'Invalid CSV file');
            setPreview(null);
            setCategorizedPreview(null);
        } finally {
            setUploadProgress(0);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        setError(null);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await axios.post('/api/upload/csv', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (progressEvent) => {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            console.log('Upload response:', res.data);

            // Clear old data first
            clearUpload();
            
            // Add new data
            addUpload({
                ...res.data,
                fileName: file.name,
                uploadTime: new Date().toISOString()
            });
            
            setResult(res.data);
            
            if (onUploadComplete) {
                onUploadComplete(res.data);
            }
            
            // Force all pages to refresh by dispatching events
            window.dispatchEvent(new Event('upload-data-changed'));
            window.dispatchEvent(new Event('storage'));
            
            // Show success message
            setTimeout(() => {
                showNotification(`Successfully imported ${res.data.valid_records} transactions!`, 'success');
            }, 500);
            
        } catch (err) {
            console.error('❌ Upload error:', err);
            setError(err.response?.data?.message || 'Upload failed');
        } finally {
            setUploading(false);
            setUploadProgress(0);
        }
    };

    const downloadTemplate = async () => {
        try {
            const res = await axios.get('/api/upload/template', {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'expense_template.csv');
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Error downloading template:', err);
            showNotification('Failed to download template', 'error');
        }
    };

    const resetUpload = () => {
        console.log('Resetting upload form...');
        setFile(null);
        setResult(null);
        setPreview(null);
        setError(null);
        setUploadProgress(0);
    };

    const handleClearData = () => {
        if (window.confirm('Are you sure? This will delete all imported CSV transactions.')) {
            axios.delete('/api/upload/clear-all')
                .then((res) => {
                    clearUpload();
                    localStorage.removeItem('uploadedData');
                    localStorage.removeItem('uploadHistory');
                    window.dispatchEvent(new Event('upload-data-changed'));
                    showNotification(
                        `Deleted ${res.data?.deletedCount ?? 0} transactions successfully`,
                        'success'
                    );
                    window.location.reload();
                })
                .catch((err) => {
                    const message = err.response?.data?.message || 'Failed to clear imported data';
                    showNotification(message, 'error');
                });
        }
    };

    const handleViewExpenses = () => {
        navigate('/expenses');
        // Force refresh after navigation
        setTimeout(() => {
            window.location.reload();
        }, 100);
    };

    // If we have a result (successful upload), show success view
    if (result) {
        return (
            <div className="upload-result">
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: '#48c77410',
                    borderRadius: '10px',
                    border: '1px solid #48c774'
                }}>
                    <FaCheckCircle size={60} color="#48c774" />
                    <h3 style={{ margin: '20px 0 10px', color: '#48c774' }}>
                        <FaCheckCircle /> Upload Successful!
                    </h3>
                    <p style={{ color: '#666', marginBottom: '30px' }}>
                        Processed {result.valid_records} of {result.total_records} transactions
                    </p>

                    {/* Summary Cards */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <div style={{
                            padding: '15px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#48c774' }}>
                                ₹{result.summary?.total_income?.toFixed(0) || 0}
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>Income</div>
                        </div>
                        
                        <div style={{
                            padding: '15px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f14668' }}>
                                ₹{result.summary?.total_expense?.toFixed(0) || 0}
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>Expenses</div>
                        </div>
                        
                        <div style={{
                            padding: '15px',
                            background: 'white',
                            borderRadius: '8px',
                            boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#667eea' }}>
                                {result.valid_records}
                            </div>
                            <div style={{ color: '#666', fontSize: '12px' }}>Transactions</div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <button
                            onClick={resetUpload}
                            className="btn"
                            style={{
                                background: 'white',
                                border: '2px solid #667eea',
                                color: '#667eea',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaUpload /> Upload Another File
                        </button>
                        <button
                            onClick={handleViewExpenses}
                            className="btn btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                border: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaChartLine /> View Expenses
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // If we have uploaded data but no result/file, show active dataset view
    if (uploadedData && !file) {
        return (
            <div className="upload-result">
                <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'linear-gradient(135deg, #667eea10, #764ba210)',
                    borderRadius: '10px',
                    border: '2px solid #667eea'
                }}>
                    <FaCheckCircle size={60} color="#48c774" />
                    <h3 style={{ margin: '20px 0 10px', color: '#667eea' }}>
                        <FaCheckCircle /> Active Dataset
                    </h3>
                    <p style={{ color: '#666', marginBottom: '10px' }}>
                        {uploadedData.valid_records || 0} transactions from {uploadedData.fileName || 'CSV file'}
                    </p>
                    <p style={{ fontSize: '14px', color: '#999', marginBottom: '30px' }}>
                        Uploaded: {new Date(uploadedData.uploadTime).toLocaleString()}
                    </p>

                    <div style={{ 
                        display: 'flex', 
                        gap: '15px', 
                        justifyContent: 'center', 
                        flexWrap: 'wrap' 
                    }}>
                        <button
                            onClick={resetUpload}
                            className="btn"
                            style={{
                                background: 'white',
                                border: '2px solid #667eea',
                                color: '#667eea',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaUpload /> Upload New File
                        </button>
                        
                        <button
                            onClick={handleViewExpenses}
                            className="btn btn-primary"
                            style={{
                                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                                color: 'white',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                border: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaChartLine /> View Expenses
                        </button>
                        
                        <button
                            onClick={handleClearData}
                            className="btn"
                            style={{
                                background: '#f14668',
                                color: 'white',
                                padding: '12px 24px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                borderRadius: '5px',
                                border: 'none',
                                fontWeight: 'bold'
                            }}
                        >
                            <FaTrash /> Clear Data
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Default view - upload area
    return (
        <div className="csv-uploader">
            {/* Upload Area */}
            <div
                {...getRootProps()}
                style={{
                    border: `2px dashed ${isDragActive ? '#667eea' : error ? '#f14668' : '#ddd'}`,
                    borderRadius: '10px',
                    padding: '40px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: isDragActive ? '#667eea10' : error ? '#f1466810' : '#f8f9fa',
                    transition: 'all 0.3s',
                    position: 'relative',
                    marginBottom: '20px'
                }}
                onClick={open}
            >
                <input {...getInputProps()} />
                
                {uploading && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(255,255,255,0.9)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '10px',
                        zIndex: 10
                    }}>
                        <FaSync className="fa-spin" size={30} color="#667eea" />
                        <p style={{ marginTop: '10px', color: '#667eea' }}>Uploading... {uploadProgress}%</p>
                    </div>
                )}
                
                {!file ? (
                    <>
                        <FaCloudUploadAlt 
                            size={50} 
                            color={isDragActive ? '#667eea' : error ? '#f14668' : '#999'} 
                        />
                        <h3 style={{ margin: '20px 0 10px' }}>
                            {isDragActive ? 'Drop your CSV here' : 'Drag & Drop CSV File'}
                        </h3>
                        <p style={{ color: '#666' }}>
                            or <span style={{ color: '#667eea', fontWeight: 'bold', cursor: 'pointer' }}>browse</span> to select
                        </p>
                        <p style={{ fontSize: '14px', color: '#999', marginTop: '15px' }}>
                            Supports bank statements, credit card bills, and expense reports
                        </p>
                        <p style={{ fontSize: '12px', color: '#f14668', marginTop: '5px' }}>
                            Note: Each new upload will REPLACE your existing data
                        </p>
                    </>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' }}>
                        <FaFileCsv size={40} color="#48c774" />
                        <div style={{ textAlign: 'left' }}>
                            <strong>{file.name}</strong>
                            <p style={{ fontSize: '12px', color: '#666' }}>
                                {(file.size / 1024).toFixed(2)} KB
                            </p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                resetUpload();
                            }}
                            style={{
                                padding: '5px 10px',
                                background: '#f14668',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            <FaTimes />
                        </button>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {uploading && uploadProgress > 0 && (
                <div style={{ marginBottom: '20px' }}>
                    <div style={{
                        width: '100%',
                        height: '4px',
                        background: '#eee',
                        borderRadius: '2px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${uploadProgress}%`,
                            height: '100%',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)',
                            transition: 'width 0.3s ease'
                        }} />
                    </div>
                </div>
            )}

            {/* Error Message */}
            {error && (
                <div style={{
                    marginBottom: '20px',
                    padding: '15px',
                    background: '#f1466810',
                    border: '1px solid #f14668',
                    borderRadius: '8px',
                    color: '#f14668',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <FaExclamationTriangle />
                    <span>{error}</span>
                </div>
            )}

            {/* Preview Section */}
            {preview && !error && (
                <div style={{ marginBottom: '20px' }}>
                    <h4><MdBarChart /> File Preview</h4>
                    <div style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '20px',
                        marginTop: '10px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
                    }}>
                        <p><strong>Total Rows:</strong> {preview.row_count}</p>
                        <p><strong>Detected Columns:</strong></p>
                        <ul style={{ marginLeft: '20px', marginBottom: '20px' }}>
                            <li><MdEvent /> Date: {preview.column_mapping?.date || 'Auto-detect'}</li>
                            <li><MdAttachMoney /> Amount: {preview.column_mapping?.amount || 'Auto-detect'}</li>
                            <li><MdDescription /> Description: {preview.column_mapping?.description || 'Auto-detect'}</li>
                            <li><MdLabel /> Category: {preview.column_mapping?.category || 'Auto-categorize'}</li>
                        </ul>
                        
                        {preview.sample && preview.sample.length > 0 && categorizedPreview && (
                            <>
                                <p><strong>Sample Data with AI Category Suggestions:</strong></p>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '8px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                                                    Description
                                                </th>
                                                <th style={{ padding: '8px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                                                    Amount
                                                </th>
                                                <th style={{ padding: '8px', textAlign: 'left', background: '#f8f9fa', borderBottom: '2px solid #ddd' }}>
                                                    Category
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categorizedPreview.map((row, i) => (
                                                <tr key={i}>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                                        {row.description}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                                        ₹{row.amount}
                                                    </td>
                                                    <td style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                                                        <select
                                                            value={selectedCategories[i] || row.suggested_category_id || ''}
                                                            onChange={(e) => handleCategoryChange(i, e.target.value)}
                                                            style={{ width: '100%', padding: '4px' }}
                                                        >
                                                            <option value="">Select category</option>
                                                            {categories.map(c => (
                                                                <option key={c.id} value={c.id}>
                                                                    {c.name}
                                                                    {row.suggested_category_id === c.id
                                                                        ? ` ← AI suggested (${row.confidence})`
                                                                        : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{ 
                display: 'flex', 
                gap: '15px', 
                justifyContent: 'center',
                flexWrap: 'wrap'
            }}>
                <button
                    onClick={downloadTemplate}
                    className="btn"
                    style={{
                        background: 'white',
                        border: '2px solid #667eea',
                        color: '#667eea',
                        padding: '12px 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        borderRadius: '5px',
                        fontWeight: 'bold'
                    }}
                >
                    <FaDownload /> Download Template
                </button>
                
                {file && !error && (
                    <button
                        onClick={handleUpload}
                        className="btn btn-primary"
                        disabled={uploading}
                        style={{
                            background: uploading ? '#ccc' : 'linear-gradient(135deg, #667eea, #764ba2)',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: uploading ? 'not-allowed' : 'pointer',
                            borderRadius: '5px',
                            fontWeight: 'bold',
                            opacity: uploading ? 0.7 : 1
                        }}
                    >
                        {uploading ? (
                            <><FaSync className="fa-spin" /> Uploading...</>
                        ) : (
                            <><FaSave /> Upload & Replace Data</>
                        )}
                    </button>
                )}
                
                {file && (
                    <button
                        onClick={resetUpload}
                        className="btn"
                        style={{
                            background: '#f14668',
                            color: 'white',
                            padding: '12px 24px',
                            border: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            borderRadius: '5px',
                            fontWeight: 'bold'
                        }}
                    >
                        <FaTimes /> Cancel
                    </button>
                )}
            </div>
        </div>
    );
};

export default CSVUploader;