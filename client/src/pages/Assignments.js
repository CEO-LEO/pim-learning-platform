import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiUpload } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Assignments = () => {
  const { moduleId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submission, setSubmission] = useState({ content: '', file: null });
  const [loading, setLoading] = useState(true);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    if (moduleId) {
      fetchAssignments(moduleId);
    } else {
      fetchMySubmissions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]);

  const fetchAssignments = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/assignments/module/${id}`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch assignments:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดงานได้';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMySubmissions = async () => {
    try {
      const response = await axios.get(`${API_URL}/assignments/my/submissions`);
      setAssignments(response.data);
    } catch (error) {
      console.error('Failed to fetch submissions:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดงานที่ส่งแล้วได้';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (assignmentId) => {
    if (!submission.content.trim()) {
      showToast('กรุณากรอกเนื้อหาหรืออัปโหลดไฟล์', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('content', submission.content.trim());
      if (submission.file) {
        formData.append('file', submission.file);
      }

      await axios.post(
        `${API_URL}/assignments/${assignmentId}/submit`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      showToast('ส่งงานสำเร็จ', 'success');
      setShowSubmitModal(false);
      setSubmission({ content: '', file: null });
      if (moduleId) {
        fetchAssignments(moduleId);
      } else {
        fetchMySubmissions();
      }
    } catch (error) {
      console.error('Failed to submit assignment:', error);
      const errorMessage = error.response?.data?.error || 'ส่งงานไม่สำเร็จ';
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

  if (moduleId && assignments.length === 0) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">งานที่ได้รับมอบหมาย</h1>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">ยังไม่มีงานในหมวดนี้</p>
        </div>
      </div>
    );
  }

  if (!moduleId && assignments.length === 0) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">งานที่ส่งแล้ว</h1>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <p className="text-gray-600">คุณยังไม่ได้ส่งงานใดๆ</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {moduleId ? 'งานที่ได้รับมอบหมาย' : 'งานที่ส่งแล้ว'}
      </h1>

      <div className="space-y-4">
        {assignments.map((assignment) => (
          <div key={assignment.assignment_id || assignment.submission_id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {assignment.title || assignment.assignment_title}
                </h2>
                {assignment.description && (
                  <p className="text-gray-600 mb-4">{assignment.description}</p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                  {assignment.due_date && (
                    <div className="flex items-center space-x-1">
                      <FiClock size={16} />
                      <span>กำหนดส่ง: {new Date(assignment.due_date).toLocaleDateString('th-TH')}</span>
                    </div>
                  )}
                  {assignment.max_score && (
                    <span>คะแนนเต็ม: {assignment.max_score}</span>
                  )}
                </div>

                {assignment.submitted === 1 ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <FiCheckCircle size={20} />
                    <span className="font-semibold">ส่งแล้ว</span>
                  </div>
                ) : assignment.submitted === 0 && moduleId ? (
                  <button
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowSubmitModal(true);
                    }}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                  >
                    <FiUpload size={18} />
                    <span>ส่งงาน</span>
                  </button>
                ) : null}

                {assignment.score !== null && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      คะแนน: <span className="font-semibold">{assignment.score}/{assignment.max_score || 100}</span>
                    </p>
                    {assignment.feedback && (
                      <p className="text-sm text-gray-600 mt-2">ความคิดเห็น: {assignment.feedback}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Modal */}
      {showSubmitModal && selectedAssignment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">ส่งงาน: {selectedAssignment.title}</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">เนื้อหา</label>
                <textarea
                  value={submission.content}
                  onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={6}
                  placeholder="กรอกเนื้อหางาน..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ไฟล์แนบ (ถ้ามี)</label>
                <input
                  type="file"
                  onChange={(e) => setSubmission({ ...submission, file: e.target.files[0] })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-4 mt-6">
              <button
                onClick={() => {
                  setShowSubmitModal(false);
                  setSubmission({ content: '', file: null });
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSubmit(selectedAssignment.assignment_id)}
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>กำลังส่ง...</span>
                  </>
                ) : (
                  <span>ส่งงาน</span>
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

export default Assignments;
