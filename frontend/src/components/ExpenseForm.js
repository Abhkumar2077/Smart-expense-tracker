// frontend/src/components/ExpenseForm.js
import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaArrowUp, FaTimes, FaPlus } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import './ExpenseForm.css';

const ExpenseForm = ({ onSubmit, categories, editingExpense, onCancel, embedded = false }) => {
  const [formData, setFormData] = useState({
    category_id: '',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    type: 'expense'
  });

  const [errors, setErrors] = useState({});
  const [isIncomePanelActive, setIsIncomePanelActive] = useState(false);
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
      setIsIncomePanelActive(editingExpense.type === 'income');
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

  const goToSettings = () => {
    navigate('/settings');
  };

  return (
    <div className={`expense-form-page ${embedded ? 'embedded' : ''}`}>
      <div className={`container ${isIncomePanelActive ? 'income-panel-active' : ''}`}>
        <div className="form-container expense-container">
          <form className="form-content" onSubmit={(e) => {
            e.preventDefault();
            const newErrors = validateForm();
            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
            const submitData = {
              ...formData,
              amount: parseFloat(formData.amount),
              type: 'expense'
            };
            console.log('📝 Submitting expense:', submitData);
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
          }}>
            <h1>{editingExpense ? '✏️ Edit Expense' : '💰 Add Expense'}</h1>

            <div className="grid">
              <div className="field-group">
                <label>
                  Category <span>*</span>
                </label>

                {(() => {
                  const filteredCategories = categories ? categories.filter(c => c.name !== 'Income') : [];
                  if (!categories || categories.length === 0) {
                    return (
                      <div className="no-categories">
                        <p>⚠️ No categories found!</p>
                        <button
                          type="button"
                          onClick={goToSettings}
                        >
                          <FaPlus /> Create Categories
                        </button>
                      </div>
                    );
                  } else if (filteredCategories.length === 0) {
                    return (
                      <div className="no-categories">
                        <p>No expense categories available</p>
                        <button
                          type="button"
                          onClick={goToSettings}
                        >
                          Manage Categories
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a category</option>
                        {filteredCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    );
                  }
                })()}

                {errors.category_id && (
                  <span className="error-text">{errors.category_id}</span>
                )}

                {categories && categories.length > 0 && (
                  <button
                    type="button"
                    onClick={goToSettings}
                    className="add-category-btn"
                  >
                    <FaPlus /> Add new category
                  </button>
                )}
              </div>

              <div className="field-group">
                <label>
                  Amount (₹) <span>*</span>
                </label>
                <div className="amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                {errors.amount && (
                  <span className="error-text">{errors.amount}</span>
                )}
              </div>

              <div className="field-group">
                <label>
                  Date <span>*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                {errors.date && (
                  <span className="error-text">{errors.date}</span>
                )}
              </div>
            </div>

            <div className="description-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Grocery shopping, Movie tickets, Uber..."
              />
            </div>

            <div className="buttons">
              <button
                type="submit"
                className="submit-btn"
                disabled={!categories || categories.length === 0}
              >
                <FaArrowUp />
                {editingExpense ? 'Update' : 'Add'} Expense
              </button>

              {editingExpense && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="cancel-btn"
                >
                  <FaTimes /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="form-container income-container">
          <form className="form-content" onSubmit={(e) => {
            e.preventDefault();
            const newErrors = validateForm();
            if (Object.keys(newErrors).length > 0) {
              setErrors(newErrors);
              return;
            }
            const submitData = {
              ...formData,
              amount: parseFloat(formData.amount),
              type: 'income'
            };
            console.log('📝 Submitting income:', submitData);
            onSubmit(submitData);
            if (!editingExpense) {
              setFormData({
                category_id: '',
                amount: '',
                description: '',
                date: new Date().toISOString().split('T')[0],
                type: 'income'
              });
            }
          }}>
            <h1>{editingExpense ? '✏️ Edit Income' : '💰 Add Income'}</h1>

            <div className="grid">
              <div className="field-group">
                <label>
                  Category <span>*</span>
                </label>

                {(() => {
                  const filteredCategories = categories ? categories.filter(c =>
                    c.name === 'Income' || c.name === 'Other'
                  ) : [];
                  if (!categories || categories.length === 0) {
                    return (
                      <div className="no-categories">
                        <p>⚠️ No categories found!</p>
                        <button
                          type="button"
                          onClick={goToSettings}
                        >
                          <FaPlus /> Create Categories
                        </button>
                      </div>
                    );
                  } else if (filteredCategories.length === 0) {
                    return (
                      <div className="no-categories">
                        <p>No income categories available</p>
                        <button
                          type="button"
                          onClick={goToSettings}
                        >
                          Manage Categories
                        </button>
                      </div>
                    );
                  } else {
                    return (
                      <select
                        name="category_id"
                        value={formData.category_id}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Select a category</option>
                        {filteredCategories.map(category => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    );
                  }
                })()}

                {errors.category_id && (
                  <span className="error-text">{errors.category_id}</span>
                )}

                {categories && categories.length > 0 && (
                  <button
                    type="button"
                    onClick={goToSettings}
                    className="add-category-btn"
                  >
                    <FaPlus /> Add new category
                  </button>
                )}
              </div>

              <div className="field-group">
                <label>
                  Amount (₹) <span>*</span>
                </label>
                <div className="amount-input">
                  <span>₹</span>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    required
                  />
                </div>
                {errors.amount && (
                  <span className="error-text">{errors.amount}</span>
                )}
              </div>

              <div className="field-group">
                <label>
                  Date <span>*</span>
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
                {errors.date && (
                  <span className="error-text">{errors.date}</span>
                )}
              </div>
            </div>

            <div className="description-group">
              <label>Description (Optional)</label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="e.g., Salary, Freelance, Gift, Refund..."
              />
            </div>

            <div className="buttons">
              <button
                type="submit"
                className="submit-btn"
                disabled={!categories || categories.length === 0}
              >
                <FaArrowDown />
                {editingExpense ? 'Update' : 'Add'} Income
              </button>

              {editingExpense && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="cancel-btn"
                >
                  <FaTimes /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Add Expense</h1>
              <p>Track your expenses to manage your budget better</p>
              <button onClick={() => setIsIncomePanelActive(false)}>Add Expense</button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Add Income</h1>
              <p>Record your income sources for better financial tracking</p>
              <button onClick={() => setIsIncomePanelActive(true)}>Add Income</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpenseForm;
