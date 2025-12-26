import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiMail, FiSend, FiUser } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Messages = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({ receiver_id: '', subject: '', content: '' });
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);
  const [, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [sending, setSending] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchConversations();
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.other_user_id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConversation]);

  const fetchConversations = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/messages/inbox`);
      setConversations(response.data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อความได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API_URL}/messages/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      // Silently fail for users list
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`${API_URL}/messages/conversation/${userId}`);
      setMessages(response.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      showToast('ไม่สามารถโหลดข้อความได้', 'error');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.receiver_id || !newMessage.subject.trim() || !newMessage.content.trim()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    setSending(true);
    try {
      await axios.post(`${API_URL}/messages`, {
        receiver_id: newMessage.receiver_id,
        subject: newMessage.subject.trim(),
        content: newMessage.content.trim()
      });
      showToast('ส่งข้อความสำเร็จ', 'success');
      setShowNewMessageModal(false);
      setNewMessage({ receiver_id: '', subject: '', content: '' });
      fetchConversations();
      if (newMessage.receiver_id) {
        fetchMessages(newMessage.receiver_id);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error.response?.data?.error || 'ส่งข้อความไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSending(false);
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleReply = async (userId) => {
    setSelectedConversation({ other_user_id: userId });
    setShowNewMessageModal(false);
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <CardSkeleton />
          </div>
          <div className="md:col-span-2">
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">ข้อความ</h1>
        <button
          onClick={() => setShowNewMessageModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <FiMail size={20} />
          <span>ส่งข้อความใหม่</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conversations List */}
        <div className="lg:col-span-1 bg-white rounded-xl shadow-md p-4">
          <h2 className="text-lg font-bold text-gray-800 mb-4">กล่องข้อความ</h2>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {conversations.length === 0 ? (
              <p className="text-gray-500 text-center py-8">ไม่มีข้อความ</p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.other_user_id}
                  onClick={() => setSelectedConversation(conv)}
                  className={`p-3 rounded-lg cursor-pointer hover:bg-gray-50 ${
                    selectedConversation?.other_user_id === conv.other_user_id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FiUser className="text-blue-600" size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">
                        {conv.other_user?.name || 'ผู้ใช้'}
                      </p>
                      <p className="text-sm text-gray-600 truncate">{conv.last_message}</p>
                      {conv.unread_count > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-blue-600 text-white text-xs rounded-full">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6 flex flex-col">
          {selectedConversation ? (
            <>
              <div className="mb-4 pb-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedConversation.other_user?.name || 'ผู้ใช้'}
                </h2>
                <p className="text-sm text-gray-600">
                  {selectedConversation.other_user?.email || selectedConversation.other_user?.student_id}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-4 max-h-[400px]">
                {messages.map((message) => (
                  <div
                    key={message.message_id}
                    className={`flex ${message.sender_id === user?.userId ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-4 ${
                        message.sender_id === user?.userId
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm font-semibold mb-1">
                        {message.sender_id === user?.userId ? 'คุณ' : message.sender_name}
                      </p>
                      {message.subject && (
                        <p className="text-sm font-semibold mb-2">{message.subject}</p>
                      )}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      <p className="text-xs mt-2 opacity-75">
                        {new Date(message.created_at).toLocaleString('th-TH')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value, receiver_id: selectedConversation.other_user_id })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  rows={3}
                  placeholder="พิมพ์ข้อความ..."
                />
                <button
                  onClick={() => {
                    setNewMessage({ ...newMessage, receiver_id: selectedConversation.other_user_id });
                    handleSendMessage();
                  }}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <FiSend size={18} />
                  <span>ส่ง</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">เลือกการสนทนาเพื่อดูข้อความ</p>
            </div>
          )}
        </div>
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ส่งข้อความใหม่</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ถึง</label>
                <select
                  value={newMessage.receiver_id}
                  onChange={(e) => setNewMessage({ ...newMessage, receiver_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">เลือกผู้รับ</option>
                  {users.map((u) => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name} ({u.student_id || u.email}) - {u.role}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อ (ไม่บังคับ)</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">เนื้อหา *</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowNewMessageModal(false);
                  setNewMessage({ receiver_id: '', subject: '', content: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSendMessage}
                disabled={sending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังส่ง...</span>
                  </>
                ) : (
                  <span>ส่งข้อความ</span>
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
  );
};

export default Messages;

