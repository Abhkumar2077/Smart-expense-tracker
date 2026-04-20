// frontend/src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios default header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['x-auth-token'] = token;
      console.log('✅ Token set in axios headers');
    } else {
      delete axios.defaults.headers.common['x-auth-token'];
      console.log('❌ Token removed from axios headers');
    }
  }, [token]);

  // Verify token and fetch user on mount
  useEffect(() => {
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('token');
      
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        // Set token in axios
        axios.defaults.headers.common['x-auth-token'] = storedToken;
        setToken(storedToken);
        
        // Fetch user data
        const res = await axios.get('/api/auth/me');
        setUser(res.data);
        console.log('✅ User authenticated:', res.data.email);
      } catch (err) {
        console.error('❌ Token verification failed:', err);
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, []);

  const login = async (email, password) => {
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      const { token, user } = res.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      
      // Set axios header
      axios.defaults.headers.common['x-auth-token'] = token;
      
      setToken(token);
      setUser(user);
      
      console.log('✅ Login successful:', user.email);
      return { success: true };
    } catch (err) {
      console.error('❌ Login failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed';
      throw new Error(errorMessage);
    }
  };

  const register = async (name, email, password) => {
    try {
      const res = await axios.post('/api/auth/register', { name, email, password });
      const { token, user } = res.data;
      
      // Save to localStorage
      localStorage.setItem('token', token);
      
      // Set axios header
      axios.defaults.headers.common['x-auth-token'] = token;
      
      setToken(token);
      setUser(user);
      
      console.log('✅ Registration successful:', user.email);
      return { success: true };
    } catch (err) {
      console.error('❌ Registration failed:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['x-auth-token'];
    setToken(null);
    setUser(null);
    console.log('✅ Logged out');
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};