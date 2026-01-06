import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiAlertCircle, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Announcements = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    target_audience: 'all',
    module_id: '',
    expires_at: '',
    is_important: false
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchAnnouncements();
    
    const interval = setInterval(() => {
      fetchAnnouncements(true);
    }, 15000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnnouncements = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const response = await axios.get(`${API_URL}/announcements`);
      
      setAnnouncements(prevAnnouncements => {
        const dataChanged = JSON.stringify(prevAnnouncements) !== JSON.stringify(response.data);
        return dataChanged ? response.data : prevAnnouncements;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch announcements:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดประกาศได้';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/announcements`, formData);
      showToast('สร้างประกาศสำเร็จ', 'success');
      setShowModal(false);
      setFormData({
        title: '',
        content: '',
        target_audience: 'all',
        module_id: '',
        expires_at: '',
        is_important: false
      });
      fetchAnnouncements();
    } catch (error) {
      console.error('Failed to create announcement:', error);
      const errorMessage = error.response?.data?.error || 'สร้างประกาศไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Group announcements by importance
  const groupedAnnouncements = useMemo(() => {
    const important = announcements.filter(a => a.is_important === 1);
    const normal = announcements.filter(a => a.is_important !== 1);
    return { important, normal };
  }, [announcements]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
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

  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
      <div className="w-full max-w-full mx-auto px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                ประกาศ
              </h1>
              <p className="text-sm sm:text-base text-gray-600">ติดตามข่าวสารและประกาศล่าสุด</p>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                  <FiRefreshCw size={14} className="animate-spin" />
                  <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                </p>
              )}
            </div>
            {isAdminOrInstructor && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <FiPlus size={18} />
                <span>สร้างประกาศ</span>
              </button>
            )}
          </div>
        </div>

        {/* Error State */}
        {error && announcements.length === 0 && (
          <div className="bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-200 rounded-2xl p-8 text-center mb-6 shadow-xl">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <FiAlertCircle className="text-white" size={40} />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-3">เกิดข้อผิดพลาด</h3>
            <p className="text-lg text-red-700 mb-6 font-medium">{error}</p>
            <button
              onClick={() => fetchAnnouncements(false)}
              className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Empty State */}
        {announcements.length === 0 && !error && (
          <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-xl p-12 text-center border-2 border-dashed border-orange-300">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiBell className="text-orange-400" size={48} />
            </div>
            <h3 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-3">ยังไม่มีประกาศ</h3>
            <p className="text-lg text-gray-600 font-medium">ประกาศจะแสดงที่นี่เมื่อมีข้อมูล</p>
          </div>
        )}

        {/* Important Announcements */}
        {groupedAnnouncements.important.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                <FiAlertCircle className="text-white" size={24} />
              </div>
              <span className="bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">ประกาศสำคัญ ({groupedAnnouncements.important.length})</span>
            </h2>
            <div className="space-y-6">
              {groupedAnnouncements.important.map((announcement) => (
                <AnnouncementCard key={announcement.announcement_id} announcement={announcement} />
              ))}
            </div>
          </div>
        )}

        {/* Normal Announcements */}
        {groupedAnnouncements.normal.length > 0 && (
          <div>
            {groupedAnnouncements.important.length > 0 && (
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl shadow-lg">
                  <FiBell className="text-white" size={24} />
                </div>
                <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">ประกาศทั่วไป ({groupedAnnouncements.normal.length})</span>
              </h2>
            )}
            <div className="space-y-6">
              {groupedAnnouncements.normal.map((announcement) => (
                <AnnouncementCard key={announcement.announcement_id} announcement={announcement} />
              ))}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && isAdminOrInstructor && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-2 border-orange-200 transform transition-all">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">สร้างประกาศ</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      title: '',
                      content: '',
                      target_audience: 'all',
                      module_id: '',
                      expires_at: '',
                      is_important: false
                    });
                  }}
                  className="p-2 hover:bg-red-100 rounded-xl transition-all hover:scale-110"
                >
                  <FiX size={24} className="text-red-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อ *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">เนื้อหา *</label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:outline-none transition-all"
                    rows={6}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">กลุ่มเป้าหมาย</label>
                  <select
                    value={formData.target_audience}
                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:outline-none transition-all bg-white"
                  >
                    <option value="all">ทุกคน</option>
                    <option value="student">นักศึกษา</option>
                    <option value="instructor">อาจารย์</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">วันหมดอายุ (ไม่บังคับ)</label>
                  <input
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="flex items-center p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <input
                    type="checkbox"
                    checked={formData.is_important}
                    onChange={(e) => setFormData({ ...formData, is_important: e.target.checked })}
                    className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                  />
                  <label className="ml-3 text-sm font-semibold text-gray-700">ประกาศสำคัญ</label>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        title: '',
                        content: '',
                        target_audience: 'all',
                        module_id: '',
                        expires_at: '',
                        is_important: false
                      });
                    }}
                    className="px-8 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-bold text-lg hover:scale-105 shadow-md"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl transition-all font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-xl hover:shadow-2xl hover:scale-105"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                        <span>กำลังสร้าง...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus size={20} />
                        <span>สร้างประกาศ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
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

// Announcement Card Component
const AnnouncementCard = ({ announcement }) => {
  const isImportant = announcement.is_important === 1;
  const isExpired = announcement.expires_at && new Date(announcement.expires_at) < new Date();

  return (
    <div className={`bg-gradient-to-br rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-[6px] hover:scale-[1.01] ${
      isImportant 
        ? 'border-red-500 from-red-50 via-orange-50 to-white' 
        : 'border-blue-500 from-blue-50 via-cyan-50 to-white'
    }`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center flex-wrap gap-3 mb-4">
              {isImportant && (
                <div className="p-2.5 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl shadow-lg">
                  <FiAlertCircle className="text-white" size={20} />
                </div>
              )}
              <h2 className={`text-xl font-bold ${
                isImportant 
                  ? 'bg-gradient-to-r from-red-700 to-orange-700 bg-clip-text text-transparent'
                  : 'bg-gradient-to-r from-blue-700 to-cyan-700 bg-clip-text text-transparent'
              }`}>{announcement.title}</h2>
              {isExpired && (
                <span className="px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-full text-xs font-bold shadow-md">
                  หมดอายุแล้ว
                </span>
              )}
            </div>
            <p className="text-gray-700 mb-6 whitespace-pre-wrap leading-relaxed text-base font-medium">{announcement.content}</p>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold shadow-md ${
                isImportant
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
              }`}>
                <span>โดย:</span>
                <span>{announcement.created_by_name}</span>
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-md">
                {new Date(announcement.created_at).toLocaleString('th-TH')}
              </span>
              {announcement.expires_at && (
                <span className={`px-4 py-2 rounded-xl font-semibold shadow-md ${
                  isExpired 
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                }`}>
                  หมดอายุ: {new Date(announcement.expires_at).toLocaleDateString('th-TH')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
