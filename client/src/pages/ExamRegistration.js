import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, 
  FiClock, 
  FiUsers, 
  FiCheckCircle, 
  FiXCircle, 
  FiArrowRight,
  FiAlertCircle,
  FiRefreshCw
} from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ExamRegistration = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(null);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  // Real-time polling setup
  useEffect(() => {
    fetchExams();
    
    const interval = setInterval(() => {
      fetchExams(true);
    }, 5000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchExams(true);
      }
    };
    
    const handleFocus = () => {
      fetchExams(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchExams = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const response = await axios.get(`${API_URL}/exams/available`);
      
      setExams(prevExams => {
        if (!prevExams || prevExams.length !== response.data.length) {
          return response.data;
        }
        
        const hasChanges = prevExams.some((prevExam, idx) => {
          const newExam = response.data[idx];
          if (!newExam) return true;
          return prevExam.remaining !== newExam.remaining ||
                 prevExam.is_registered !== newExam.is_registered ||
                 prevExam.registered_count !== newExam.registered_count;
        });
        
        return hasChanges ? response.data : prevExams;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch exams:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลรอบสอบได้';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleRegister = async (examId) => {
    setRegistering(examId);
    try {
      await axios.post(`${API_URL}/exams/register`, { exam_id: examId });
      showToast('ลงทะเบียนสำเร็จ!', 'success');
      
      setTimeout(async () => {
        await fetchExams(false);
      }, 300);
    } catch (error) {
      console.error('Register error:', error);
      const errorMessage = error.response?.data?.error || 'ลงทะเบียนไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setRegistering(null);
    }
  };

  // Memoized exam cards
  const examCards = useMemo(() => {
    return exams.map((exam) => {
      const remaining = exam.remaining !== undefined 
        ? exam.remaining 
        : (exam.limit_count || exam.limit || 0) - (exam.registered_count || 0);
      const total = exam.limit_count || exam.limit || 0;
      const isFull = remaining <= 0;
      const isRegistered = exam.is_registered;
      const progressPercent = total > 0 ? ((total - remaining) / total) * 100 : 0;

      return (
        <div
          key={exam.exam_id}
          className={`group relative bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border-2 transform hover:-translate-y-1 h-full flex flex-col ${
            isRegistered 
              ? 'border-green-400 bg-gradient-to-br from-green-50 via-white to-green-50/50' 
              : isFull 
              ? 'border-gray-300 opacity-75' 
              : 'border-blue-200 hover:border-blue-400 bg-gradient-to-br from-blue-50/30 via-white to-cyan-50/30'
          }`}
        >
          {/* Shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
          
          {/* Status Badge */}
          {isRegistered && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center space-x-1.5 shadow-lg z-10 backdrop-blur-sm border-2 border-white/30">
              <FiCheckCircle size={14} />
              <span>ลงทะเบียนแล้ว</span>
            </div>
          )}
          
          {isFull && !isRegistered && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-red-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-sm font-semibold flex items-center space-x-1.5 shadow-lg z-10 backdrop-blur-sm border-2 border-white/30">
              <FiAlertCircle size={14} />
              <span>เต็มแล้ว</span>
            </div>
          )}

            <div className="relative z-10 p-6 flex-1 flex flex-col">
              {/* Header */}
              <div className="mb-4 flex-1">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center space-x-3">
                  <div className={`p-2 rounded-lg shadow-md transform group-hover:rotate-12 transition-transform duration-300 ${isRegistered ? 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-600 border-2 border-green-200' : 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-600 border-2 border-blue-200'}`}>
                    <FiCalendar size={20} />
                  </div>
                  <span className="group-hover:text-blue-600 transition-colors">รอบสอบปฏิบัติ</span>
                </h3>
              
              {/* Exam Details */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3 text-gray-700">
                  <FiCalendar className="text-blue-600 flex-shrink-0" size={18} />
                  <span className="font-semibold text-base">
                    {new Date(exam.date).toLocaleDateString('th-TH', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-700">
                  <FiClock className="text-blue-600 flex-shrink-0" size={18} />
                  <span className="font-semibold text-base">{exam.start_time} - {exam.end_time} น.</span>
                </div>
                
                <div className="flex items-center space-x-3 text-gray-700">
                  <FiUsers className="text-blue-600 flex-shrink-0" size={18} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        เหลือ <span className={`font-bold ${remaining > 10 ? 'text-green-600' : remaining > 0 ? 'text-orange-600' : 'text-red-600'}`}>{remaining}</span> / {total} ที่นั่ง
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner border border-gray-300">
                      <div 
                        className={`h-full transition-all duration-500 shadow-md ${
                          progressPercent >= 90 ? 'bg-gradient-to-r from-red-500 to-rose-600' : 
                          progressPercent >= 70 ? 'bg-gradient-to-r from-orange-500 to-amber-600' : 
                          'bg-gradient-to-r from-green-500 to-emerald-600'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      >
                        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="pt-4 border-t-2 border-gray-200">
              {isRegistered ? (
                <div className="space-y-3">
                  <button
                    disabled
                    className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-3 rounded-lg font-semibold text-base cursor-not-allowed flex items-center justify-center space-x-2 shadow-md"
                  >
                    <FiCheckCircle size={18} />
                    <span>ลงทะเบียนแล้ว</span>
                  </button>
                  <Link
                    to="/my-exams"
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-lg font-semibold text-sm flex items-center justify-center space-x-2 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                  >
                    <FiXCircle size={16} />
                    <span>ยกเลิกการลงทะเบียน</span>
                    <FiArrowRight size={16} />
                  </Link>
                </div>
              ) : isFull ? (
                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-600 py-3 rounded-lg font-semibold text-base cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  <FiAlertCircle size={18} />
                  <span>เต็มแล้ว</span>
                </button>
              ) : (
                <button
                  onClick={() => handleRegister(exam.exam_id)}
                  disabled={registering === exam.exam_id}
                  className="relative w-full bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-600 text-white py-3 rounded-lg font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md hover:shadow-lg transform hover:scale-[1.02] disabled:transform-none overflow-hidden group/btn"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                  {registering === exam.exam_id ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>กำลังลงทะเบียน...</span>
                    </>
                  ) : (
                    <>
                      <FiCheckCircle size={18} />
                      <span>ยืนยันลงทะเบียน</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exams, registering]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-80 mb-3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                ลงทะเบียนเข้าทดสอบปฏิบัติ
              </h1>
              <p className="text-lg text-gray-600">เลือกรอบสอบที่ต้องการลงทะเบียน</p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 mt-2 flex items-center space-x-2">
                  <FiRefreshCw size={14} className="animate-spin" />
                  <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                </p>
              )}
            </div>
          <Link
            to="/my-exams"
            className="inline-flex items-center space-x-2 bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 px-4 py-2 rounded-lg font-semibold text-base transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
          >
            <span>การสอบของฉัน</span>
            <FiArrowRight size={18} />
          </Link>
          </div>
        </div>

        {/* Error State */}
        {error && exams.length === 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center mb-8">
            <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
            <h3 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchExams(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Exam Cards */}
        {exams.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
            <FiCalendar className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">ไม่มีรอบสอบที่เปิดให้ลงทะเบียน</h3>
            <p className="text-gray-500">กรุณาตรวจสอบอีกครั้งในภายหลัง</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {examCards}
          </div>
        )}
        
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
    </div>
  );
};

export default ExamRegistration;
