// frontend/src/pages/Auth.js
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import './Auth.css';

const Auth = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ name: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const { login, register } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const containerRef = useRef(null);

  const validateEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email);
  };

  const handleSignInSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    const newErrors = {};

    if (!signInData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signInData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signInData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (signInData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
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
      setErrors({ general: error.message });
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
      newErrors.name = 'Name is required';
    }

    if (!signUpData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(signUpData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!signUpData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (signUpData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    try {
      await register(signUpData.name, signUpData.email, signUpData.password);
      setRegistrationSuccess(true);
      setSignUpData({ name: '', email: '', password: '' });

      setTimeout(() => {
        setIsRightPanelActive(false);
        setRegistrationSuccess(false);
      }, 2000);
    } catch (error) {
      setErrors({ general: error.message });
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
            <div className="social-container">
              <a href="#" className="social facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social google">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="social linkedin">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span>or use your email for registration</span>

            {errors.general && (
              <div className="error-message">{errors.general}</div>
            )}

            {registrationSuccess && (
              <div className="success-message">
                ✅ Registration successful! Redirecting to login...
              </div>
            )}

            <input
              type="text"
              placeholder="Name"
              value={signUpData.name}
              onChange={(e) => setSignUpData({ ...signUpData, name: e.target.value })}
              className={errors.name ? 'error' : ''}
              disabled={isLoading || registrationSuccess}
              required
            />
            {errors.name && <span className="error-text">{errors.name}</span>}

            <input
              type="email"
              placeholder="Email"
              value={signUpData.email}
              onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
              className={errors.email ? 'error' : ''}
              disabled={isLoading || registrationSuccess}
              required
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <input
              type="password"
              placeholder="Password"
              value={signUpData.password}
              onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
              className={errors.password ? 'error' : ''}
              disabled={isLoading || registrationSuccess}
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}

            <button type="submit" disabled={isLoading || registrationSuccess}>
              {isLoading ? 'Signing Up...' : 'Sign Up'}
            </button>
          </form>
        </div>

        <div className="form-container sign-in-container">
          <form className="form" onSubmit={handleSignInSubmit}>
            <h1>Sign In</h1>
            <div className="social-container">
              <a href="#" className="social facebook">
                <i className="fab fa-facebook-f"></i>
              </a>
              <a href="#" className="social google">
                <i className="fab fa-google-plus-g"></i>
              </a>
              <a href="#" className="social linkedin">
                <i className="fab fa-linkedin-in"></i>
              </a>
            </div>
            <span>or use your account</span>

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
            />
            {errors.email && <span className="error-text">{errors.email}</span>}

            <input
              type="password"
              placeholder="Password"
              value={signInData.password}
              onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
              className={errors.password ? 'error' : ''}
              disabled={isLoading}
              required
            />
            {errors.password && <span className="error-text">{errors.password}</span>}

            <a href="#" className="forgot-password">Forgot your password?</a>
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
              <h1>Hello, Friend!</h1>
              <p>Enter your personal details and start journey with us</p>
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