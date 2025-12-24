import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiFile, FiDownload, FiUpload, FiTrash2, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const CourseFiles = () => {
  const { user } = useAuth();
  const { moduleId } = useParams();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadData, setUploadData] = useState({ title: '', file: null });
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (moduleId) {
      fetchFiles(moduleId);
    }
  }, [moduleId]);

  const fetchFiles = async (id) => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/files/module/${id}`);
      setFiles(response.data);
    } catch (error) {
      console.error('Failed to fetch files:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดไฟล์ได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!uploadData.file || !uploadData.title.trim()) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('title', uploadData.title.trim());
      formData.append('module_id', moduleId);

      await axios.post(`${API_URL}/files/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('อัปโหลดไฟล์สำเร็จ', 'success');
      setShowUploadModal(false);
      setUploadData({ title: '', file: null });
      fetchFiles(moduleId);
    } catch (error) {
      console.error('Failed to upload file:', error);
      const errorMessage = error.response?.data?.error || 'อัปโหลดไฟล์ไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = (fileId) => {
    window.open(`${API_URL}/files/download/${fileId}`, '_blank');
  };

  const handleDelete = async (fileId) => {
    setShowDeleteConfirm(fileId);
  };

  const confirmDelete = async () => {
    if (!showDeleteConfirm) return;

    try {
      await axios.delete(`${API_URL}/files/${showDeleteConfirm}`);
      showToast('ลบไฟล์สำเร็จ', 'success');
      setShowDeleteConfirm(null);
      fetchFiles(moduleId);
    } catch (error) {
      console.error('Failed to delete file:', error);
      const errorMessage = error.response?.data?.error || 'ลบไฟล์ไม่สำเร็จ';
      showToast(errorMessage, 'error');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">เอกสารประกอบ</h1>
        {(user?.role === 'admin' || user?.role === 'instructor') && (
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FiUpload size={20} />
            <span>อัปโหลดไฟล์</span>
          </button>
        )}
      </div>

      {files.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FiFile size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">ยังไม่มีไฟล์ในหมวดนี้</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {files.map((file) => (
            <div key={file.file_id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FiFile className="text-blue-600" size={24} />
                </div>
                {(user?.role === 'admin' || user?.role === 'instructor') && (
                  <button
                    onClick={() => handleDelete(file.file_id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 size={18} />
                  </button>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">{file.title}</h3>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>ประเภท: {file.file_type?.toUpperCase()}</p>
                <p>ขนาด: {formatFileSize(file.file_size)}</p>
                <p>อัปโหลดโดย: {file.uploaded_by_name}</p>
                <p>วันที่: {new Date(file.uploaded_at).toLocaleDateString('th-TH')}</p>
              </div>

              <button
                onClick={() => handleDownload(file.file_id)}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FiDownload size={18} />
                <span>ดาวน์โหลด</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (user?.role === 'admin' || user?.role === 'instructor') && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">อัปโหลดไฟล์</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อไฟล์ *</label>
                <input
                  type="text"
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">เลือกไฟล์ *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadData({ ...uploadData, file: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadData({ title: '', file: null });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังอัปโหลด...</span>
                  </>
                ) : (
                  <span>อัปโหลด</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ยืนยันการลบไฟล์</h3>
            <p className="text-gray-600 mb-6">คุณแน่ใจหรือไม่ว่าต้องการลบไฟล์นี้?</p>
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

export default CourseFiles;

