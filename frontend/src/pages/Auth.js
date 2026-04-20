// frontend/src/pages/Auth.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './Auth.css';

const Auth = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  const { login, register } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const validatePassword = (password) => {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special character
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    return password.length >= 8 && hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
  };

  const validateName = (name) => {
    // At least 2 characters, only letters and spaces
    return name.trim().length >= 2 && /^[a-zA-Z\s]+$/.test(name.trim());
  };

  const getPasswordStrength = (password) => {
    if (!password) return { text: 'None', color: '#999' };

    let score = 0;
    const checks = [
      password.length >= 8, // length
      /[A-Z]/.test(password), // uppercase
      /[a-z]/.test(password), // lowercase
      /\d/.test(password), // numbers
      /[!@#$%^&*(),.?":{}|<>]/.test(password) // special chars
    ];

    score = checks.filter(Boolean).length;

    if (score <= 2) return { text: 'Weak', color: '#ff4444' };
    if (score <= 3) return { text: 'Medium', color: '#ffaa00' };
    if (score <= 4) return { text: 'Strong', color: '#00aa44' };
    return { text: 'Very Strong', color: '#00aa44' };
  };

  const handleSignUpBlur = (field) => {
    const newErrors = { ...errors };

    if (field === 'password' && signUpData.password && !validatePassword(signUpData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    } else if (field === 'password') {
      delete newErrors.password;
    }

    setErrors(newErrors);
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors = {};

    if (!signInData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(signInData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    if (!signInData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (signInData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters long';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await login(signInData.email, signInData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      // Handle specific error types
      if (error.message?.includes('Invalid credentials') || error.message?.includes('401')) {
        setErrors({ general: 'Invalid email or password. Please check your credentials and try again.' });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setErrors({ general: 'Network error. Please check your internet connection and try again.' });
      } else if (error.message?.includes('500')) {
        setErrors({ general: 'Server error. Please try again later or contact support.' });
      } else {
        setErrors({ general: error.message || 'An unexpected error occurred. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors = {};

    if (!signUpData.name.trim()) {
      newErrors.name = 'Full name is required';
    } else if (!validateName(signUpData.name)) {
      newErrors.name = 'Name must be at least 2 characters and contain only letters and spaces';
    }

    if (!signUpData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = 'Please enter a valid email address (e.g., user@example.com)';
    }

    if (!signUpData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(signUpData.password)) {
      newErrors.password = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await register(signUpData.name, signUpData.email, signUpData.password);
      
      // Automatically log in the new user
      await login(signUpData.email, signUpData.password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      // Handle specific error types
      if (error.message?.includes('already exists') || error.message?.includes('409')) {
        setErrors({ general: 'An account with this email already exists. Please try signing in instead.' });
      } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
        setErrors({ general: 'Network error. Please check your internet connection and try again.' });
      } else if (error.message?.includes('500')) {
        setErrors({ general: 'Server error. Please try again later or contact support.' });
      } else if (error.message?.includes('validation')) {
        setErrors({ general: 'Please check your input and try again.' });
      } else {
        setErrors({ general: error.message || 'Registration failed. Please try again.' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
    setErrors({});
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
    setErrors({});
  };

  return (
    <div className="auth-page">
      <div className={`container ${isRightPanelActive ? 'right-panel-active' : ''}`} ref={containerRef}>
        <div className="form-container sign-up-container">
          <form className="form" onSubmit={handleSignUpSubmit}>
            <h1>Create Account</h1>
            <span style={{ marginBottom: '20px', display: 'block' }}>or use your email for registration</span>

            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <input
              type="text"
              placeholder="Name"
              value={signUpData.name}
              onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
              className={errors.name ? 'error' : ''}
              disabled={isLoading}
              required
              style={{ 
                padding: '16px 15px',
                height: '50px',
                fontSize: '16px'
              }}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}

            <input
              type="email"
              placeholder="Email"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
              required
              style={{ 
                padding: '16px 15px',
                height: '50px',
                fontSize: '16px'
              }}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <div style={{ position: 'relative' }}>
              <input
                type={showSignUpPassword ? 'text' : 'password'}
                placeholder="Password"
                value={signUpData.password}
                onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                onBlur={() => handleSignUpBlur('password')}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
                required
                style={{ 
                  padding: '16px 50px 16px 15px',
                  height: '50px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  width: '35px',
                  height: '35px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                disabled={isLoading}
              >
                {showSignUpPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {signUpData.password && (
              <div style={{ 
                marginTop: '5px', 
                fontSize: '12px', 
                color: getPasswordStrength(signUpData.password).color,
                fontWeight: '500'
              }}>
                Password strength: {getPasswordStrength(signUpData.password).text}
              </div>
            )}
            {errors.password && <span className="error-text">{errors.password}</span>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form className="form" onSubmit={handleSignInSubmit}>
            <h1>Sign In</h1>
            <span style={{ marginBottom: '20px', display: 'block' }}>or use your account</span>

            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={signInData.email}
              onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
              className={errors.email ? 'error' : ''}
              disabled={isLoading}
              required
              style={{ 
                padding: '16px 15px',
                height: '50px',
                fontSize: '16px'
              }}
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <div style={{ position: 'relative' }}>
              <input
                type={showSignInPassword ? 'text' : 'password'}
                placeholder="Password"
                value={signInData.password}
                onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                className={errors.password ? 'error' : ''}
                disabled={isLoading}
                required
                style={{ 
                  padding: '16px 50px 16px 15px',
                  height: '50px',
                  fontSize: '16px'
                }}
              />
              <button
                type="button"
                onClick={() => setShowSignInPassword(!showSignInPassword)}
                style={{
                  position: 'absolute',
                  right: '15px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  padding: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  width: '35px',
                  height: '35px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.05)'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                disabled={isLoading}
              >
                {showSignInPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
            {errors.password && <span className="error-text">{errors.password}</span>}

            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="overlay-container">
          <div className="overlay">
            <div className="overlay-panel overlay-left">
              <h1>Welcome Back!</h1>
              <p>To keep connected with us please login with your personal info</p>
              <button className="ghost" onClick={handleSignInClick} disabled={isLoading}>
                Sign In
              </button>
            </div>
            <div className="overlay-panel overlay-right">
              <h1>Unlock Your Financial Potential!</h1>
              <p style={{ color: 'white', fontSize: '14px' }}>
                Intelligent Expense Tracking<br/>
                AI-Powered Insights<br/>
                Goal Achievement with Reminders
              </p>
              <button className="ghost" onClick={handleSignUpClick} disabled={isLoading}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;