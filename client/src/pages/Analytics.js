import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiBook, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Analytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/analytics/student`);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดสถิติได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-96 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบข้อมูลสถิติ</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">สถิติการเรียน</h1>
        <p className="text-gray-600">ดูสถิติและความคืบหน้าการเรียนของคุณ</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">ชั่วโมงเรียนทั้งหมด</p>
              <p className="text-3xl font-bold text-gray-800">{analytics.total_hours || 0}</p>
              <p className="text-sm text-gray-500 mt-1">ชั่วโมง</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <FiClock className="text-blue-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Module ที่ผ่าน</p>
              <p className="text-3xl font-bold text-gray-800">{analytics.completed_modules || 0}</p>
              <p className="text-sm text-gray-500 mt-1">Module</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheckCircle className="text-green-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">คะแนนเฉลี่ย</p>
              <p className="text-3xl font-bold text-gray-800">{analytics.average_score || 0}</p>
              <p className="text-sm text-gray-500 mt-1">%</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <FiTrendingUp className="text-purple-600" size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">วิดีโอที่ดู</p>
              <p className="text-3xl font-bold text-gray-800">{analytics.watched_videos || 0}</p>
              <p className="text-sm text-gray-500 mt-1">วิดีโอ</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
              <FiBook className="text-orange-600" size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Module Progress */}
      {analytics.modules && analytics.modules.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ความคืบหน้าแต่ละ Module</h2>
          <div className="space-y-4">
            {analytics.modules.map((module) => (
              <div key={module.module_id}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-gray-800">{module.title}</span>
                  <span className="text-sm text-gray-600">{module.completion_rate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all"
                    style={{ width: `${module.completion_rate}%` }}
                  ></div>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm text-gray-600">
                  <span>ชั่วโมง: {module.hours || 0} ชม.</span>
                  <span>คะแนน: {module.score || '-'}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Learning Hours by Module */}
      {analytics.hours_by_module && analytics.hours_by_module.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">ชั่วโมงเรียนตาม Module</h2>
          <div className="space-y-3">
            {analytics.hours_by_module.map((item) => (
              <div key={item.module_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-800">{item.module_title}</span>
                <span className="text-blue-600 font-semibold">{item.hours} ชั่วโมง</span>
              </div>
            ))}
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
  );
};

export default Analytics;

