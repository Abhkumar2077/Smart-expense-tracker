// frontend/src/components/ExpenseForm.js
import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaArrowUp, FaTimes, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ExpenseForm = ({ onSubmit, categories, editingExpense, onCancel }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        category_id: editingExpense.category_id || '',
        amount: editingExpense.amount || '',
        description: editingExpense.description || '',
        date: editingExpense.date || new Date().toISOString().split('T')[0],
        type: editingExpense.type || 'expense'
      });
    }
  }, [editingExpense]);

  useEffect(() => {
    console.log('📋 Available categories in ExpenseForm:', categories);
  }, [categories]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleTypeChange = (type) => {
    setFormData(prev => ({
      ...prev,
      type: type
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.category_id) {
      newErrors.category_id = 'Please select a category';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Please enter an amount';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (isNaN(parseFloat(formData.amount))) {
      newErrors.amount = 'Please enter a valid number';
    }
    
    if (!formData.date) {
      newErrors.date = 'Please select a date';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    const submitData = {
      ...formData,
      amount: parseFloat(formData.amount),
      type: formData.type || 'expense'
    };
    
    console.log('📝 Submitting transaction:', submitData);
    onSubmit(submitData);
    
    if (!editingExpense) {
      setFormData({
        category_id: '',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'expense'
      });
    }
  };

  const goToSettings = () => {
    navigate('/settings');
  };

  // Filter categories based on transaction type
  const getFilteredCategories = () => {
    if (!categories || categories.length === 0) {
      return [];
    }
    
    if (formData.type === 'income') {
      // For income, show Income category and Other
      return categories.filter(c => 
        c.name === 'Income' || c.name === 'Other'
      );
    } else {
      // For expense, show all expense categories (exclude Income)
      return categories.filter(c => c.name !== 'Income');
    }
  };

  const filteredCategories = getFilteredCategories();

  return (
    <div className="card" style={{
      marginBottom: 'var(--spacing-2xl)',
      background: 'var(--bg-primary)',
      border: '1px solid var(--border-light)',
      borderRadius: 'var(--radius-xl)',
      boxShadow: 'var(--shadow-lg)',
      overflow: 'hidden'
    }}>
      <div className="card-header" style={{
        background: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        padding: 'var(--spacing-xl) var(--spacing-2xl)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 className="card-title" style={{
          margin: 0,
          fontSize: 'var(--font-size-xl)',
          fontWeight: 'var(--font-weight-bold)',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--spacing-md)'
        }}>
          {editingExpense ? '✏️ Edit Transaction' : '💰 Add New Transaction'}
        </h3>
        {editingExpense && (
          <button 
            onClick={onCancel} 
            style={{ 
              background: 'var(--error-color)',
              color: 'white',
              border: 'none',
              padding: 'var(--spacing-sm) var(--spacing-lg)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 'var(--font-weight-medium)',
              transition: 'all var(--transition-fast)',
              boxShadow: 'var(--shadow-sm)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--error-hover)';
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = 'var(--shadow-md)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'var(--error-color)';
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'var(--shadow-sm)';
            }}
          >
            <FaTimes /> Cancel
          </button>
        )}
      </div>
      
      <div style={{ padding: 'var(--spacing-2xl)' }}>
        <form onSubmit={handleSubmit}>
          {/* Transaction Type Toggle */}
          <div style={{ 
            display: 'flex', 
            gap: 'var(--spacing-lg)', 
            marginBottom: 'var(--spacing-2xl)',
            background: 'var(--bg-tertiary)',
            padding: 'var(--spacing-md)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-light)'
          }}>
            <button
              type="button"
              onClick={() => handleTypeChange('expense')}
              style={{
                flex: 1,
                padding: 'var(--spacing-lg)',
                background: formData.type === 'expense' ? 'var(--error-color)' : 'var(--bg-primary)',
                color: formData.type === 'expense' ? 'white' : 'var(--text-primary)',
                border: formData.type === 'expense' ? 'none' : '2px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-fast)',
                boxShadow: formData.type === 'expense' ? 'var(--shadow-md)' : 'none'
              }}
            >
              <FaArrowUp style={{ fontSize: 'var(--font-size-lg)' }} /> Expense
            </button>
            
            <button
              type="button"
              onClick={() => handleTypeChange('income')}
              style={{
                flex: 1,
                padding: 'var(--spacing-lg)',
                background: formData.type === 'income' ? 'var(--success-color)' : 'var(--bg-primary)',
                color: formData.type === 'income' ? 'white' : 'var(--text-primary)',
                border: formData.type === 'income' ? 'none' : '2px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 'var(--spacing-md)',
                fontSize: 'var(--font-size-base)',
                fontWeight: 'var(--font-weight-semibold)',
                transition: 'all var(--transition-fast)',
                boxShadow: formData.type === 'income' ? 'var(--shadow-md)' : 'none'
              }}
            >
              <FaArrowDown style={{ fontSize: 'var(--font-size-lg)' }} /> Income
            </button>
          </div>

          <div className="form-row" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: 'var(--spacing-xl)',
            marginBottom: 'var(--spacing-xl)'
          }}>
            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                Category <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              
              {(!categories || categories.length === 0) ? (
                <div style={{
                  padding: 'var(--spacing-xl)',
                  background: 'var(--error-light)',
                  border: '1px solid var(--error-color)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: 'var(--error-color)',
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    ⚠️ No categories found!
                  </p>
                  <button
                    type="button"
                    onClick={goToSettings}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'all var(--transition-fast)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--primary-hover)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--primary-color)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    <FaPlus /> Create Categories
                  </button>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div style={{
                  padding: 'var(--spacing-xl)',
                  background: 'var(--warning-light)',
                  border: '1px solid var(--warning-color)',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center'
                }}>
                  <p style={{
                    color: 'var(--warning-color)',
                    marginBottom: 'var(--spacing-lg)',
                    fontSize: 'var(--font-size-base)',
                    fontWeight: 'var(--font-weight-medium)'
                  }}>
                    No categories available for {formData.type}
                  </p>
                  <button
                    type="button"
                    onClick={goToSettings}
                    style={{
                      padding: 'var(--spacing-sm) var(--spacing-lg)',
                      background: 'var(--primary-color)',
                      color: 'white',
                      border: 'none',
                      borderRadius: 'var(--radius-md)',
                      cursor: 'pointer',
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 'var(--font-weight-medium)',
                      transition: 'all var(--transition-fast)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'var(--primary-hover)';
                      e.target.style.transform = 'translateY(-1px)';
                      e.target.style.boxShadow = 'var(--shadow-md)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'var(--primary-color)';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'var(--shadow-sm)';
                    }}
                  >
                    Manage Categories
                  </button>
                </div>
              ) : (
                <select
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleChange}
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg)',
                    border: `2px solid ${errors.category_id ? 'var(--error-color)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-base)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    transition: 'all var(--transition-fast)',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.category_id ? 'var(--error-color)' : 'var(--border-medium)';
                    e.target.style.boxShadow = 'none';
                  }}
                >
                  <option value="">Select a category</option>
                  {filteredCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              )}
              
              {errors.category_id && (
                <p style={{
                  color: 'var(--error-color)',
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--spacing-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {errors.category_id}
                </p>
              )}
              
              {categories && categories.length > 0 && (
                <button
                  type="button"
                  onClick={goToSettings}
                  style={{
                    marginTop: 'var(--spacing-sm)',
                    padding: 'var(--spacing-xs) var(--spacing-md)',
                    background: 'transparent',
                    border: '1px dashed var(--primary-color)',
                    color: 'var(--primary-color)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: 'var(--font-size-xs)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'var(--primary-light)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'transparent';
                  }}
                >
                  <FaPlus /> Add new category
                </button>
              )}
            </div>

            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                Amount (₹) <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute',
                  left: 'var(--spacing-lg)',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-lg)',
                  zIndex: 1
                }}>₹</span>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  min="0.01"
                  step="0.01"
                  required
                  style={{
                    width: '100%',
                    padding: 'var(--spacing-md) var(--spacing-lg) var(--spacing-md) calc(var(--spacing-lg) + 20px)',
                    border: `2px solid ${errors.amount ? 'var(--error-color)' : 'var(--border-medium)'}`,
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 'var(--font-weight-bold)',
                    backgroundColor: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    transition: 'all var(--transition-fast)',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = 'var(--primary-color)';
                    e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = errors.amount ? 'var(--error-color)' : 'var(--border-medium)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
              {errors.amount && (
                <p style={{
                  color: 'var(--error-color)',
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--spacing-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {errors.amount}
                </p>
              )}
            </div>

            <div className="form-group">
              <label style={{ 
                display: 'block', 
                marginBottom: 'var(--spacing-sm)',
                fontWeight: 'var(--font-weight-semibold)',
                color: 'var(--text-primary)',
                fontSize: 'var(--font-size-base)'
              }}>
                Date <span style={{ color: 'var(--error-color)' }}>*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                style={{
                  width: '100%',
                  padding: 'var(--spacing-md) var(--spacing-lg)',
                  border: `2px solid ${errors.date ? 'var(--error-color)' : 'var(--border-medium)'}`,
                  borderRadius: 'var(--radius-md)',
                  fontSize: 'var(--font-size-base)',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  transition: 'all var(--transition-fast)',
                  outline: 'none',
                  cursor: 'pointer'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-color)';
                  e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = errors.date ? 'var(--error-color)' : 'var(--border-medium)';
                  e.target.style.boxShadow = 'none';
                }}
              />
              {errors.date && (
                <p style={{
                  color: 'var(--error-color)',
                  fontSize: 'var(--font-size-sm)',
                  marginTop: 'var(--spacing-xs)',
                  fontWeight: 'var(--font-weight-medium)'
                }}>
                  {errors.date}
                </p>
              )}
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: 'var(--spacing-sm)',
              fontWeight: 'var(--font-weight-semibold)',
              color: 'var(--text-primary)',
              fontSize: 'var(--font-size-base)'
            }}>
              Description (Optional)
            </label>
            <input
              type="text"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={formData.type === 'income' 
                ? "e.g., Salary, Freelance, Gift, Refund..." 
                : "e.g., Grocery shopping, Movie tickets, Uber..."}
              style={{
                width: '100%',
                padding: 'var(--spacing-md) var(--spacing-lg)',
                border: '2px solid var(--border-medium)',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--font-size-base)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                transition: 'all var(--transition-fast)',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-color)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-light)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border-medium)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div className="form-group" style={{
            display: 'flex',
            gap: 'var(--spacing-lg)',
            justifyContent: 'flex-end',
            marginTop: 'var(--spacing-2xl)'
          }}>
            <button 
              type="submit" 
              disabled={!categories || categories.length === 0}
              style={{
                padding: 'var(--spacing-lg) var(--spacing-2xl)',
                background: !categories || categories.length === 0 
                  ? 'var(--text-muted)' 
                  : formData.type === 'income' 
                    ? 'linear-gradient(135deg, var(--success-color), var(--success-hover))' 
                    : 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))',
                color: 'grey',
                border: 'none',
                borderRadius: 'var(--radius-lg)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'var(--font-weight-bold)',
                cursor: (!categories || categories.length === 0) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)',
                transition: 'all var(--transition-fast)',
                boxShadow: (!categories || categories.length === 0) ? 'none' : 'var(--shadow-lg)',
                opacity: (!categories || categories.length === 0) ? 0.5 : 1,
                transform: 'translateY(0)'
              }}
              onMouseEnter={(e) => {
                if (categories && categories.length > 0) {
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = 'var(--shadow-xl)';
                }
              }}
              onMouseLeave={(e) => {
                if (categories && categories.length > 0) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'var(--shadow-lg)';
                }
              }}
            >
              {formData.type === 'income' ? <FaArrowDown style={{ fontSize: 'var(--font-size-lg)' }} /> : <FaArrowUp style={{ fontSize: 'var(--font-size-lg)' }} />}
              {editingExpense ? 'Update' : 'Add'} {formData.type === 'income' ? 'Income' : 'Expense'}
            </button>
            
            {editingExpense && (
              <button 
                type="button" 
                onClick={onCancel}
                style={{
                  padding: 'var(--spacing-lg) var(--spacing-2xl)',
                  background: 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: '2px solid var(--border-medium)',
                  borderRadius: 'var(--radius-lg)',
                  fontSize: 'var(--font-size-lg)',
                  fontWeight: 'var(--font-weight-semibold)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--spacing-md)',
                  transition: 'all var(--transition-fast)',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = 'var(--error-color)';
                  e.target.style.color = 'white';
                  e.target.style.borderColor = 'var(--error-color)';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = 'var(--shadow-md)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'var(--bg-secondary)';
                  e.target.style.color = 'var(--text-primary)';
                  e.target.style.borderColor = 'var(--border-medium)';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'var(--shadow-sm)';
                }}
              >
                <FaTimes style={{ fontSize: 'var(--font-size-lg)' }} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ExpenseForm;