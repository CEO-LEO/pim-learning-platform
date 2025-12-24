import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiUser, FiLock, FiLogIn, FiEye, FiEyeOff } from 'react-icons/fi';
import Toast from '../components/Toast';

const Login = () => {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const studentIdInputRef = useRef(null);
  const passwordInputRef = useRef(null);

  // Auto-focus on student ID input when component mounts
  useEffect(() => {
    studentIdInputRef.current?.focus();
  }, []);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const handleKeyDown = (e) => {
    // Allow Enter key to submit form
    if (e.key === 'Enter' && !loading) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Input validation
    const trimmedStudentId = studentId.trim();
    const trimmedPassword = password.trim();
    
    if (!trimmedStudentId) {
      setError('กรุณากรอกรหัสนักศึกษา');
      return;
    }
    
    if (!trimmedPassword) {
      setError('กรุณากรอกรหัสผ่าน');
      return;
    }
    
    if (trimmedStudentId.length < 3) {
      setError('รหัสนักศึกษาต้องมีอย่างน้อย 3 ตัวอักษร');
      return;
    }
    
    if (trimmedPassword.length < 4) {
      setError('รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร');
      return;
    }
    
    setLoading(true);

    const result = await login(trimmedStudentId, trimmedPassword);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error || 'เข้าสู่ระบบไม่สำเร็จ');
    }
  };

  const handlePIMAccountLogin = () => {
    // TODO: Implement PIM Account SSO
    showToast('ฟีเจอร์นี้จะเปิดใช้งานเร็วๆ นี้', 'info');
  };

  const handleForgotPassword = () => {
    showToast('กรุณาติดต่อผู้ดูแลระบบเพื่อรีเซ็ตรหัสผ่าน', 'info');
  };

  const handleContactAdmin = () => {
    showToast('กรุณาติดต่อผู้ดูแลระบบเพื่อสร้างบัญชี', 'info');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 via-blue-400 to-cyan-400 p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mb-48 blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 lg:p-10 border border-white/20">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl mb-4 shadow-lg">
              <span className="text-white font-bold text-4xl">N</span>
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-2">
              PIM Learning Platform
            </h1>
            <p className="text-gray-600 font-medium">มหาวิทยาลัยปัญญาภิวัฒน์</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="studentId" className="block text-sm font-semibold text-gray-700 mb-2">
                รหัสนักศึกษา
              </label>
              <div className="relative">
                <FiUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="studentId"
                  ref={studentIdInputRef}
                  type="text"
                  value={studentId}
                  onChange={(e) => {
                    setStudentId(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      passwordInputRef.current?.focus();
                    }
                  }}
                  className="w-full pl-12 pr-4 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                  placeholder="กรอกรหัสนักศึกษา"
                  required
                  autoComplete="username"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                รหัสผ่าน
              </label>
              <div className="relative">
                <FiLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  id="password"
                  ref={passwordInputRef}
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Clear error when user types
                  }}
                  onKeyDown={handleKeyDown}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                  placeholder="กรอกรหัสผ่าน"
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  disabled={loading}
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <button 
                type="button"
                onClick={handleForgotPassword}
                className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                ลืมรหัสผ่าน?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-600 transition-all shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <FiLogIn size={20} />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6">
            <button
              type="button"
              onClick={handlePIMAccountLogin}
              className="w-full border-2 border-blue-600 text-blue-600 py-3.5 rounded-xl font-semibold hover:bg-blue-50 transition-all hover:shadow-md cursor-pointer"
            >
              เข้าสู่ระบบด้วย PIM Account
            </button>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>ยังไม่มีบัญชี? <button 
              type="button"
              onClick={handleContactAdmin}
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >ติดต่อผู้ดูแลระบบ</button></p>
          </div>
        </div>
      </div>
      
      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          duration={4000}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default Login;

