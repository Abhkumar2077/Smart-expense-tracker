// frontend/src/components/CategoryManager.js
import React, { useState, useEffect } from 'react';
import { useNotification } from '../context/NotificationContext';
import { categoryAPI } from '../services/api';
import { 
    FaPlus, FaEdit, FaTrash, FaSave, FaTimes,
    FaLightbulb, FaChartLine, FaMagic
} from 'react-icons/fa';

const CategoryManager = ({ onCategoryChange }) => {
    const { showNotification } = useNotification();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [suggestions, setSuggestions] = useState([]);
    const [popularCategories, setPopularCategories] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        color: '#667eea',
        icon: '\uD83D\uDCCC'
    });

    const presetColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#FF9F1C', '#A06AB4', '#48C774',
        '#F14668', '#667EEA', '#ED8936', '#9F7AEA', '#F56565'
    ];

    const presetIcons = [
        '🍔', '🚗', '🛍️', '🎬', '📄', '🏥', '📚', '🛒', '✈️', '💰',
        '📌', '🏠', '☕', '🍕', '🎮', '💡', '📱', '👕', '🎵', '🏃',
        '💼', '🎓', '🏥', '🚑', '🔧', '🛠️', '📦', '🎁', '💳', '🏦'
    ];

    useEffect(() => {
        fetchCategories();
        fetchSuggestions();
        fetchPopularCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const res = await categoryAPI.getAll();
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchSuggestions = async () => {
        try {
            const res = await categoryAPI.getSuggestions();
            setSuggestions(res.data);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
        }
    };

    const fetchPopularCategories = async () => {
        try {
            const res = await categoryAPI.getPopular();
            setPopularCategories(res.data);
        } catch (err) {
            console.error('Failed to fetch popular categories:', err);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name.trim()) {
            showNotification('Please enter a category name', 'error');
            return;
        }

        try {
            if (editingCategory) {
                await categoryAPI.update(editingCategory.id, formData);
                showNotification('Category updated successfully!', 'success');
            } else {
                await categoryAPI.create(formData);
                showNotification('Category created successfully!', 'success');
            }
            
            resetForm();
            fetchCategories();
            if (onCategoryChange) onCategoryChange();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Failed to save category', 'error');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure? This category will be deleted.')) return;
        
        try {
            await categoryAPI.delete(id);
            showNotification('Category deleted', 'success');
            fetchCategories();
            if (onCategoryChange) onCategoryChange();
        } catch (err) {
            showNotification(err.response?.data?.message || 'Cannot delete category with transactions', 'error');
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setFormData({
            name: category.name,
            color: category.color || '#667eea',
            icon: category.icon || '\uD83D\uDCCC'
        });
        setShowAddForm(true);
    };

    const handleUseSuggestion = (suggestion) => {
        setFormData({
            ...formData,
            name: suggestion.suggested_name.toLowerCase(),
            icon: suggestion.icon || '\uD83D\uDCCC'
        });
    };

    const handleUsePopular = (popular) => {
        setFormData({
            name: popular.name,
            color: popular.color || '#667eea',
            icon: popular.icon || '\uD83D\uDCCC'
        });
    };

    const resetForm = () => {
        setShowAddForm(false);
        setEditingCategory(null);
        setFormData({
            name: '',
            color: '#667eea',
            icon: '\uD83D\uDCCC'
        });
    };

    const getRandomColor = () => {
        const randomColor = presetColors[Math.floor(Math.random() * presetColors.length)];
        setFormData({ ...formData, color: randomColor });
    };

    return (
        <div className="card">
            <div className="card-header">
                <h3 className="card-title">
                    <FaMagic /> Category Manager
                </h3>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <FaPlus /> New Category
                </button>
            </div>

            {/* Add/Edit Form */}
            {showAddForm && (
                <div style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, #667eea10, #764ba210)',
                    borderRadius: '10px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ marginBottom: '15px' }}>
                        {editingCategory ? '✏️ Edit Category' : '➕ Create New Category'}
                    </h4>
                    
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Category Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="e.g., Freelance, Pet Care, Gardening..."
                                style={{
                                    width: '100%',
                                    padding: '10px',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '5px',
                                    fontSize: '16px'
                                }}
                                required
                            />
                        </div>

                        {/* Color Selector */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Category Color
                            </label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                                <input
                                    type="color"
                                    value={formData.color}
                                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                    style={{ width: '60px', height: '50px' }}
                                />
                                <button
                                    type="button"
                                    onClick={getRandomColor}
                                    className="btn"
                                >
                                    🎲 Random
                                </button>
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: '5px'
                            }}>
                                {presetColors.slice(0, 10).map(color => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        style={{
                                            height: '30px',
                                            background: color,
                                            border: formData.color === color ? '4px solid white' : 'none',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            boxShadow: 'var(--shadow-sm)',
                                            outline: formData.color === color ? `2px solid ${color}` : 'none'
                                        }}
                                        title={color}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Icon Selector */}
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Category Icon
                            </label>
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '24px',
                                    padding: '10px',
                                    border: '2px solid var(--border-color)',
                                    borderRadius: '5px',
                                    background: formData.color + '20',
                                    minWidth: '50px',
                                    textAlign: 'center'
                                }}>
                                    {formData.icon}
                                </div>
                                <input
                                    type="text"
                                    value={formData.icon}
                                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                    placeholder="Enter emoji or icon"
                                    style={{
                                        padding: '10px',
                                        border: '2px solid var(--border-color)',
                                        borderRadius: '5px',
                                        fontSize: '16px',
                                        flex: 1
                                    }}
                                />
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(10, 1fr)',
                                gap: '5px'
                            }}>
                                {presetIcons.map(icon => (
                                    <button
                                        key={icon}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, icon })}
                                        style={{
                                            fontSize: '18px',
                                            padding: '8px',
                                            background: formData.icon === icon ? formData.color + '40' : 'white',
                                            border: formData.icon === icon ? `2px solid ${formData.color}` : '2px solid var(--border-color)',
                                            borderRadius: '5px',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                        title={icon}
                                    >
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn btn-primary">
                                <FaSave /> {editingCategory ? 'Update' : 'Create'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn">
                                <FaTimes /> Cancel
                            </button>
                        </div>
                    </form>

                    {/* Smart Suggestions */}
                    {suggestions.length > 0 && !editingCategory && (
                        <div style={{ marginTop: '20px' }}>
                            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaLightbulb color="#ff9f1c" /> Smart Suggestions
                            </h5>
                            <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
                                Based on your uncategorized transactions:
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {suggestions.map((sugg, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleUseSuggestion(sugg)}
                                        className="btn"
                                        style={{
                                            background: '#ff9f1c10',
                                            border: '2px solid #ff9f1c',
                                            color: '#ff9f1c'
                                        }}
                                    >
                                        {sugg.suggested_name} ({sugg.frequency}×)
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Popular Categories */}
                    {popularCategories.length > 0 && !editingCategory && (
                        <div style={{ marginTop: '15px' }}>
                            <h5 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <FaChartLine color="#48c774" /> Popular with Others
                            </h5>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {popularCategories.map((pop, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleUsePopular(pop)}
                                        className="btn"
                                        style={{
                                            background: `${pop.color}20`,
                                            border: `2px solid ${pop.color}`,
                                            color: pop.color
                                        }}
                                    >
                                        {pop.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Categories List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <div className="loading-spinner"></div>
                    <p>Loading categories...</p>
                </div>
            ) : (
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
                    gap: '15px',
                    padding: '10px'
                }}>
                    {categories.map(category => (
                        <div
                            key={category.id}
                            style={{
                                padding: '15px',
                                background: category.is_default ? '#f8f9fa' : 'white',
                                borderRadius: '10px',
                                borderLeft: `4px solid ${category.color}`,
                                position: 'relative',
                                transition: 'all 0.3s',
                                opacity: category.is_default ? 0.8 : 1
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    fontSize: '24px',
                                    background: category.color + '20',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    border: `2px solid ${category.color}40`
                                }}>
                                    {category.icon || '\uD83D\uDCCC'}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{ margin: 0, fontSize: '16px' }}>
                                        {category.name}
                                        {category.is_default && (
                                            <span style={{
                                                fontSize: '12px',
                                                color: '#999',
                                                marginLeft: '8px'
                                            }}>
                                                (system)
                                            </span>
                                        )}
                                    </h4>
                                    {!category.is_default && (
                                        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                            Used {category.usage_count || 0} times
                                            {category.last_used && ` • Last: ${category.last_used}`}
                                        </div>
                                    )}
                                </div>
                                {!category.is_default && (
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button
                                            onClick={() => handleEdit(category)}
                                            style={{
                                                padding: '5px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#667eea',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <FaEdit />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(category.id)}
                                            style={{
                                                padding: '5px',
                                                background: 'transparent',
                                                border: 'none',
                                                color: '#f14668',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CategoryManager;