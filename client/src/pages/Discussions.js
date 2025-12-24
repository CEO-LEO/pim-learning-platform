import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiMessageSquare, FiMapPin, FiUser, FiSend, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Discussions = () => {
  const { user } = useAuth();
  const { moduleId } = useParams();
  const [discussions, setDiscussions] = useState([]);
  const [selectedDiscussion, setSelectedDiscussion] = useState(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (moduleId) {
      fetchDiscussions(moduleId);
    }
  }, [moduleId]);

  const fetchDiscussions = async (id) => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/discussions/module/${id}`);
      setDiscussions(response.data);
    } catch (error) {
      console.error('Failed to fetch discussions:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดการสนทนาได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiscussion = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/discussions/${id}`);
      setSelectedDiscussion(response.data);
    } catch (error) {
      console.error('Failed to fetch discussion:', error);
      showToast('ไม่สามารถโหลดการสนทนาได้', 'error');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      showToast('กรุณากรอกหัวข้อและเนื้อหา', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/discussions`, {
        module_id: moduleId,
        title: newPost.title.trim(),
        content: newPost.content.trim()
      });
      showToast('สร้างโพสต์สำเร็จ', 'success');
      setShowNewPostModal(false);
      setNewPost({ title: '', content: '' });
      fetchDiscussions(moduleId);
    } catch (error) {
      console.error('Failed to create post:', error);
      const errorMessage = error.response?.data?.error || 'สร้างโพสต์ไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (discussionId) => {
    if (!replyContent.trim()) {
      showToast('กรุณากรอกข้อความ', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/discussions/${discussionId}/reply`, {
        content: replyContent.trim()
      });
      showToast('ตอบกลับสำเร็จ', 'success');
      setReplyContent('');
      fetchDiscussion(discussionId);
    } catch (error) {
      console.error('Failed to reply:', error);
      const errorMessage = error.response?.data?.error || 'ตอบกลับไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (selectedDiscussion) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <button
          onClick={() => setSelectedDiscussion(null)}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          ← กลับไปรายการสนทนา
        </button>

        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                {selectedDiscussion.is_pinned === 1 && <FiMapPin className="inline text-yellow-500 mr-2" />}
                {selectedDiscussion.title}
              </h1>
              <p className="text-sm text-gray-600">
                โดย {selectedDiscussion.created_by_name} ({selectedDiscussion.student_id}) • {new Date(selectedDiscussion.created_at).toLocaleString('th-TH')}
              </p>
            </div>
          </div>
          <div className="text-gray-700 whitespace-pre-wrap">{selectedDiscussion.content}</div>
        </div>

        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-bold text-gray-800">ตอบกลับ ({selectedDiscussion.replies?.length || 0})</h2>
          {selectedDiscussion.replies?.map((reply) => (
            <div key={reply.reply_id} className="bg-white rounded-xl shadow-md p-4">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{reply.user_name} ({reply.student_id})</p>
                  <p className="text-sm text-gray-600 mb-2">{new Date(reply.created_at).toLocaleString('th-TH')}</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{reply.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">ตอบกลับ</h3>
          <textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
            rows={4}
            placeholder="เขียนตอบกลับ..."
          />
          <button
            onClick={() => handleReply(selectedDiscussion.discussion_id)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiSend size={18} />
            <span>ส่ง</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ฟอรั่มสนทนา</h1>
        {moduleId && (
          <button
            onClick={() => setShowNewPostModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiMessageSquare size={20} />
            <span>สร้างโพสต์ใหม่</span>
          </button>
        )}
      </div>

      {discussions.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">ยังไม่มีโพสต์ในฟอรั่มนี้</p>
        </div>
      ) : (
        <div className="space-y-4">
          {discussions.map((discussion) => (
            <div
              key={discussion.discussion_id}
              className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => fetchDiscussion(discussion.discussion_id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center">
                    {discussion.is_pinned === 1 && <FiMapPin className="text-yellow-500 mr-2" />}
                    {discussion.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{discussion.content}</p>
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    <span>โดย {discussion.created_by_name}</span>
                    <span>•</span>
                    <span>{discussion.reply_count || 0} ตอบกลับ</span>
                    {discussion.last_reply_at && (
                      <>
                        <span>•</span>
                        <span>ตอบล่าสุด: {new Date(discussion.last_reply_at).toLocaleDateString('th-TH')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Post Modal */}
      {showNewPostModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">สร้างโพสต์ใหม่</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อ</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="หัวข้อโพสต์..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">เนื้อหา</label>
                <textarea
                  value={newPost.content}
                  onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="เนื้อหาโพสต์..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowNewPostModal(false);
                  setNewPost({ title: '', content: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                สร้างโพสต์
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

export default Discussions;

