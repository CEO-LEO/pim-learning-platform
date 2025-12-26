import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { 
  FiCalendar, 
  FiClock, 
  FiCheckCircle, 
  FiXCircle, 
  FiAlertCircle,
  FiArrowLeft,
  FiRefreshCw,
  FiTrash2
} from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const MyExams = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchMyExams();
    
    const interval = setInterval(() => {
      fetchMyExams(true);
    }, 5000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchMyExams(true);
      }
    };
    
    const handleFocus = () => {
      fetchMyExams(true);
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

  const fetchMyExams = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const response = await axios.get(`${API_URL}/exams/my-registrations`);
      const newData = response.data || [];
      
      setExams(prevExams => {
        if (!prevExams || prevExams.length !== newData.length) {
          return newData;
        }
        
        const hasChanges = prevExams.some((prevExam, idx) => {
          const newExam = newData[idx];
          if (!newExam) return true;
          return prevExam.registration_id !== newExam.registration_id ||
                 prevExam.status !== newExam.status ||
                 prevExam.date !== newExam.date ||
                 prevExam.score !== newExam.score;
        });
        
        return hasChanges ? newData : prevExams;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch exams:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลการสอบได้';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleCancel = (registrationId) => {
    setShowCancelConfirm(registrationId);
  };

  const confirmCancel = async () => {
    if (!showCancelConfirm) return;

    setCancelling(true);
    try {
      await axios.post(`${API_URL}/exams/cancel/${showCancelConfirm}`);
      showToast('ยกเลิกการลงทะเบียนสำเร็จ', 'success');
      setShowCancelConfirm(null);
      
      setTimeout(async () => {
        await fetchMyExams(false);
      }, 300);
    } catch (error) {
      console.error('Cancel error:', error);
      const errorMessage = error.response?.data?.error || 'ยกเลิกการลงทะเบียนไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      passed: {
        bg: 'bg-green-100',
        text: 'text-green-700',
        icon: FiCheckCircle,
        label: 'ผ่าน'
      },
      failed: {
        bg: 'bg-red-100',
        text: 'text-red-700',
        icon: FiXCircle,
        label: 'ไม่ผ่าน'
      },
      registered: {
        bg: 'bg-blue-100',
        text: 'text-blue-700',
        icon: FiAlertCircle,
        label: 'ลงทะเบียนแล้ว'
      },
      cancelled: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        icon: FiXCircle,
        label: 'ยกเลิกแล้ว'
      }
    };

    const config = statusConfig[status] || {
      bg: 'bg-gray-100',
      text: 'text-gray-700',
      icon: FiAlertCircle,
      label: status
    };

    const Icon = config.icon;

    return (
      <span className={`px-10 py-5 ${config.bg} ${config.text} rounded-full text-xl font-bold flex items-center space-x-4 shadow-lg`}>
        <Icon size={28} />
        <span>{config.label}</span>
      </span>
    );
  };

  // Group exams by status
  const groupedExams = useMemo(() => {
    const groups = {
      upcoming: [],
      completed: [],
      cancelled: []
    };

    exams.forEach(exam => {
      const status = exam.status || exam.exam_status || 'unknown';
      const examDate = new Date(exam.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (status === 'cancelled') {
        groups.cancelled.push(exam);
      } else if (status === 'passed' || status === 'failed') {
        groups.completed.push(exam);
      } else if (examDate >= today) {
        groups.upcoming.push(exam);
      } else {
        groups.completed.push(exam);
      }
    });

    return groups;
  }, [exams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-7xl sm:text-8xl lg:text-9xl font-bold text-gray-800 mb-8 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                การสอบของฉัน
              </h1>
              <p className="text-4xl text-gray-600">ดูผลสอบและรอบสอบที่ลงทะเบียนไว้</p>
              {lastUpdate && (
                <p className="text-sm text-gray-500 mt-2 flex items-center space-x-2">
                  <FiRefreshCw size={14} className="animate-spin" />
                  <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                </p>
              )}
            </div>
            <Link
              to="/exams"
              className="inline-flex items-center space-x-3 bg-white hover:bg-blue-50 text-blue-600 border-2 border-blue-600 px-8 py-4 rounded-xl font-bold text-xl transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
            >
              <FiArrowLeft size={24} />
              <span>ลงทะเบียนสอบ</span>
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
              onClick={() => fetchMyExams(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Empty State */}
        {exams.length === 0 && !error && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-300">
            <FiCalendar className="mx-auto text-gray-400 mb-4" size={64} />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">คุณยังไม่ได้ลงทะเบียนสอบ</h3>
            <p className="text-gray-500 mb-6">เริ่มต้นด้วยการลงทะเบียนสอบปฏิบัติ</p>
            <Link
              to="/exams"
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white px-8 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <span>ไปยังหน้าลงทะเบียน</span>
              <FiArrowLeft size={20} className="rotate-180" />
            </Link>
          </div>
        )}

        {/* Exam Lists */}
        {exams.length > 0 && (
          <div className="space-y-12">
            {/* Upcoming Exams */}
            {groupedExams.upcoming.length > 0 && (
              <div>
                <h2 className="text-5xl font-bold text-gray-800 mb-12 flex items-center space-x-5">
                  <div className="p-5 bg-blue-100 rounded-3xl">
                    <FiCalendar className="text-blue-600" size={44} />
                  </div>
                  <span>การสอบที่กำลังจะมาถึง ({groupedExams.upcoming.length})</span>
                </h2>
                <div className="space-y-10">
                  {groupedExams.upcoming.map((exam) => (
                    <ExamCard 
                      key={exam.registration_id} 
                      exam={exam} 
                      onCancel={handleCancel}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed Exams */}
            {groupedExams.completed.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <FiCheckCircle className="text-green-600" size={28} />
                  </div>
                  <span>การสอบที่เสร็จสิ้น ({groupedExams.completed.length})</span>
                </h2>
                <div className="space-y-6">
                  {groupedExams.completed.map((exam) => (
                    <ExamCard 
                      key={exam.registration_id} 
                      exam={exam} 
                      onCancel={handleCancel}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Cancelled Exams */}
            {groupedExams.cancelled.length > 0 && (
              <div>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                  <div className="p-3 bg-gray-100 rounded-xl">
                    <FiXCircle className="text-gray-600" size={28} />
                  </div>
                  <span>การสอบที่ยกเลิก ({groupedExams.cancelled.length})</span>
                </h2>
                <div className="space-y-6">
                  {groupedExams.cancelled.map((exam) => (
                    <ExamCard 
                      key={exam.registration_id} 
                      exam={exam} 
                      onCancel={handleCancel}
                      getStatusBadge={getStatusBadge}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <FiTrash2 className="text-red-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการยกเลิก</h3>
                <p className="text-gray-600">คุณต้องการยกเลิกการลงทะเบียนหรือไม่?</p>
                <p className="text-sm text-gray-500 mt-2">การกระทำนี้ไม่สามารถยกเลิกได้</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>กำลังยกเลิก...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={18} />
                      <span>ยืนยันยกเลิก</span>
                    </>
                  )}
                </button>
              </div>
            </div>
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

// Exam Card Component
const ExamCard = ({ exam, onCancel, getStatusBadge }) => {
  const status = exam.status || exam.exam_status || 'unknown';
  const isRegistered = status === 'registered';
  const isCancelled = status === 'cancelled';
  const examDate = new Date(exam.date);
  const isPast = examDate < new Date();

  return (
    <div className={`bg-white rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 ${
      isCancelled ? 'border-gray-400 opacity-75' :
      isPast ? 'border-green-500' :
      'border-blue-500'
    }`}>
      <div className="p-16">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-10">
          {/* Left Side - Exam Info */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-10">
              <h3 className="text-5xl font-bold text-gray-800 mb-5">
                {exam.exam_name || 'การสอบปฏิบัติ'}
              </h3>
              {getStatusBadge(status)}
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center space-x-6 text-gray-700">
                <FiCalendar className="text-blue-600 flex-shrink-0" size={36} />
                <span className="font-bold text-2xl">
                  {examDate.toLocaleDateString('th-TH', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>
              
              <div className="flex items-center space-x-6 text-gray-700">
                <FiClock className="text-blue-600 flex-shrink-0" size={36} />
                <span className="font-bold text-2xl">{exam.start_time} - {exam.end_time} น.</span>
              </div>

              {/* Score Display */}
              {exam.score !== null && exam.score !== undefined && (
                <div className="mt-10 p-10 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-3xl border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-700">คะแนนสอบ</span>
                    <span className={`text-6xl font-bold ${
                      exam.passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {exam.score}%
                    </span>
                  </div>
                  {exam.passed && (
                    <div className="mt-5 flex items-center space-x-4 text-green-600 text-xl font-bold">
                      <FiCheckCircle size={28} />
                      <span>ผ่านเกณฑ์</span>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {exam.feedback && (
                <div className="mt-10 p-10 bg-blue-50 rounded-3xl border-2 border-blue-200">
                  <p className="text-xl text-gray-700 leading-relaxed">{exam.feedback}</p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side - Actions */}
          {isRegistered && !isPast && (
            <div className="flex sm:flex-col items-center sm:items-end space-x-5 sm:space-x-0 sm:space-y-5">
              <button
                onClick={() => onCancel(exam.registration_id)}
                className="px-10 py-5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-2xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-4"
              >
                <FiTrash2 size={32} />
                <span>ยกเลิก</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyExams;
