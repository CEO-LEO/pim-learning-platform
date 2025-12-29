import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FiBell, FiCheck, FiTrash2 } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, unread
  const [, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const fetchNotifications = async () => {
    try {
      setError(null);
      const params = filter === 'unread' ? { unread_only: 'true' } : {};
      const response = await axios.get(`${API_URL}/notifications`, { params });
      setNotifications(response.data);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดการแจ้งเตือนได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`);
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
      // Silently fail for unread count
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${API_URL}/notifications/${notificationId}/read`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark as read:', error);
      showToast('ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  };

  const markAllAsRead = async () => {
    try {
      await axios.put(`${API_URL}/notifications/read-all`);
      showToast('ทำเครื่องหมายอ่านทั้งหมดแล้ว', 'success');
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      showToast('ไม่สามารถอัปเดตสถานะได้', 'error');
    }
  };

  const deleteNotification = (notificationId) => {
    setShowDeleteConfirm(notificationId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      await axios.delete(`${API_URL}/notifications/${showDeleteConfirm}`);
      showToast('ลบการแจ้งเตือนสำเร็จ', 'success');
      setShowDeleteConfirm(null);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      const errorMessage = error.response?.data?.error || 'ลบการแจ้งเตือนไม่สำเร็จ';
      showToast(errorMessage, 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">การแจ้งเตือน</h1>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1 rounded ${filter === 'all' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-1 rounded ${filter === 'unread' ? 'bg-blue-600 text-white' : 'text-gray-700'}`}
            >
              ยังไม่อ่าน ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <FiCheck size={18} />
              <span>อ่านทั้งหมด</span>
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FiBell size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">ไม่มีการแจ้งเตือน</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.notification_id}
              className={`bg-white rounded-xl shadow-md p-6 ${
                notification.is_read === 0 ? 'border-l-4 border-blue-600' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {notification.is_read === 0 && (
                      <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                    )}
                    <h3 className="font-semibold text-gray-800">{notification.title}</h3>
                  </div>
                  <p className="text-gray-600 mb-2">{notification.message}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(notification.created_at).toLocaleString('th-TH')}
                  </p>
                  {notification.link && (
                    <Link
                      to={notification.link}
                      className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                    >
                      ดูรายละเอียด →
                    </Link>
                  )}
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  {notification.is_read === 0 && (
                    <button
                      onClick={() => markAsRead(notification.notification_id)}
                      className="p-2 text-gray-600 hover:text-blue-600"
                      title="ทำเครื่องหมายว่าอ่านแล้ว"
                    >
                      <FiCheck size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteNotification(notification.notification_id)}
                    className="p-2 text-gray-600 hover:text-red-600"
                    title="ลบ"
                  >
                    <FiTrash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ยืนยันการลบ</h3>
            <p className="text-gray-600 mb-6">คุณต้องการลบการแจ้งเตือนนี้หรือไม่?</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                ลบ
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
  );
};

export default Notifications;

