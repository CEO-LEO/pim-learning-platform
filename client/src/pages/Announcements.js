import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiAlertCircle, FiEdit, FiTrash2, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
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
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4 text-center mb-4">
            <FiAlertCircle className="mx-auto text-red-500 mb-3" size={32} />
            <h3 className="text-lg font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h3>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchAnnouncements(false)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Empty State */}
        {announcements.length === 0 && !error && (
          <div className="bg-white rounded-lg shadow-md p-6 text-center border-2 border-dashed border-gray-300">
            <FiBell className="mx-auto text-gray-400 mb-3" size={40} />
            <h3 className="text-lg font-bold text-gray-700 mb-2">ยังไม่มีประกาศ</h3>
            <p className="text-sm text-gray-500">ประกาศจะแสดงที่นี่เมื่อมีข้อมูล</p>
          </div>
        )}

        {/* Important Announcements */}
        {groupedAnnouncements.important.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <FiAlertCircle className="text-red-600" size={18} />
              </div>
              <span>ประกาศสำคัญ ({groupedAnnouncements.important.length})</span>
            </h2>
            <div className="space-y-4">
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
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FiBell className="text-blue-600" size={18} />
                </div>
                <span>ประกาศทั่วไป ({groupedAnnouncements.normal.length})</span>
              </h2>
            )}
            <div className="space-y-4">
              {groupedAnnouncements.normal.map((announcement) => (
                <AnnouncementCard key={announcement.announcement_id} announcement={announcement} />
              ))}
            </div>
          </div>
        )}

        {/* Create Modal */}
        {showModal && isAdminOrInstructor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-4 sm:p-6 transform transition-all animate-in fade-in zoom-in">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-800">สร้างประกาศ</h2>
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
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX size={20} className="text-gray-500" />
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

                <div className="flex items-center justify-end space-x-4 pt-4">
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
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>กำลังสร้าง...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus size={18} />
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
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border-l-4 ${
      isImportant ? 'border-red-500 bg-gradient-to-r from-red-50 to-white' : 'border-blue-500'
    }`}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-3">
              {isImportant && (
                <div className="p-2 bg-red-100 rounded-lg">
                  <FiAlertCircle className="text-red-600" size={18} />
                </div>
              )}
              <h2 className="text-base sm:text-lg font-bold text-gray-800">{announcement.title}</h2>
              {isExpired && (
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-semibold">
                  หมดอายุแล้ว
                </span>
              )}
            </div>
            <p className="text-gray-700 mb-4 whitespace-pre-wrap leading-relaxed text-sm">{announcement.content}</p>
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center space-x-1">
                <span className="font-semibold">โดย:</span>
                <span className="font-semibold">{announcement.created_by_name}</span>
              </span>
              <span>•</span>
              <span className="font-semibold">{new Date(announcement.created_at).toLocaleString('th-TH')}</span>
              {announcement.expires_at && (
                <>
                  <span>•</span>
                  <span className={isExpired ? 'text-red-600 font-semibold' : 'font-semibold'}>
                    หมดอายุ: {new Date(announcement.expires_at).toLocaleDateString('th-TH')}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Announcements;
