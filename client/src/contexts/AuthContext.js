import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  }, []);

  const fetchUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      if (response.data) {
        setUser(response.data);
      } else {
        logout();
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Only logout if token is invalid (401/403), not on network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:21',message:'AuthContext useEffect',data:{hasToken:!!token,tokenLength:token?.length,localStorageToken:!!localStorage.getItem('token'),authHeader:axios.defaults.headers.common['Authorization']?.substring(0,30)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,F'})}).catch(()=>{});
    // #endregion
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.js:23',message:'Setting axios header',data:{authHeaderSet:!!axios.defaults.headers.common['Authorization'],headerPrefix:axios.defaults.headers.common['Authorization']?.substring(0,20)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,F'})}).catch(()=>{});
      // #endregion
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (studentId, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        student_id: studentId,
        password,
      });
      const { token: newToken, user: userData } = response.data;
      
      if (!newToken || !userData) {
        return {
          success: false,
          error: 'Invalid response from server',
        };
      }
      
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      // Handle network errors
      if (!error.response) {
        return {
          success: false,
          error: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต',
        };
      }
      
      // Handle server errors
      const status = error.response?.status;
      if (status === 401) {
        return {
          success: false,
          error: 'รหัสนักศึกษาหรือรหัสผ่านไม่ถูกต้อง',
        };
      }
      
      if (status >= 500) {
        return {
          success: false,
          error: 'เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ กรุณาลองใหม่อีกครั้ง',
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.error || 'เข้าสู่ระบบไม่สำเร็จ',
      };
    }
  };

  const register = async (studentId, name, email, password, yearLevel) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        student_id: studentId,
        name,
        email,
        password,
        year_level: yearLevel,
      });
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed',
      };
    }
  };


  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

