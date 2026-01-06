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
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-5xl mx-auto px-4">
          <div className="mb-6">
            <div className="h-10 bg-gradient-to-r from-gray-200 to-gray-100 rounded-xl w-80 mb-2 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (moduleId && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-8">งานที่ได้รับมอบหมาย</h1>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/50">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiUpload className="text-gray-400" size={48} />
            </div>
            <p className="text-gray-600 text-xl font-medium">ยังไม่มีงานในหมวดนี้</p>
          </div>
        </div>
      </div>
    );
  }

  if (!moduleId && assignments.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-8">งานที่ส่งแล้ว</h1>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-12 text-center border border-white/50">
            <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiCheckCircle className="text-gray-400" size={48} />
            </div>
            <p className="text-gray-600 text-xl font-medium">คุณยังไม่ได้ส่งงานใดๆ</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 pb-12" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="max-w-5xl mx-auto px-4">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-8">
          {moduleId ? 'งานที่ได้รับมอบหมาย' : 'งานที่ส่งแล้ว'}
        </h1>

        <div className="space-y-6">
          {assignments.map((assignment) => (
            <div key={assignment.assignment_id || assignment.submission_id} className="bg-gradient-to-br from-white to-orange-50/30 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300 hover:scale-[1.01]">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="flex-1 min-w-[300px]">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent mb-3">
                    {assignment.title || assignment.assignment_title}
                  </h2>
                  {assignment.description && (
                    <p className="text-gray-700 mb-6 leading-relaxed">{assignment.description}</p>
                  )}
                  
                  <div className="flex items-center flex-wrap gap-3 text-sm mb-6">
                    {assignment.due_date && (
                      <div className="flex items-center space-x-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-4 py-2 rounded-xl shadow-md">
                        <FiClock size={16} />
                        <span className="font-semibold">กำหนดส่ง: {new Date(assignment.due_date).toLocaleDateString('th-TH')}</span>
                      </div>
                    )}
                    {assignment.max_score && (
                      <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl font-semibold shadow-md">คะแนนเต็ม: {assignment.max_score}</span>
                    )}
                  </div>

                  {assignment.submitted === 1 ? (
                    <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl inline-flex shadow-lg">
                      <FiCheckCircle size={24} />
                      <span className="font-bold text-lg">ส่งแล้ว</span>
                    </div>
                  ) : assignment.submitted === 0 && moduleId ? (
                    <button
                      onClick={() => {
                        setSelectedAssignment(assignment);
                        setShowSubmitModal(true);
                      }}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-cyan-700 transition-all font-semibold flex items-center space-x-2 shadow-lg hover:shadow-xl hover:scale-105"
                    >
                      <FiUpload size={20} />
                      <span>ส่งงาน</span>
                    </button>
                  ) : null}

                  {assignment.score !== null && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-md">
                      <p className="text-lg font-bold text-gray-700 mb-2">
                        คะแนน: <span className="text-2xl bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{assignment.score}/{assignment.max_score || 100}</span>
                      </p>
                      {assignment.feedback && (
                        <p className="text-base text-gray-600 mt-3 font-medium">ความคิดเห็น: {assignment.feedback}</p>
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-white to-orange-50 rounded-2xl shadow-2xl max-w-2xl w-full p-8 border-2 border-orange-200">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-6">ส่งงาน: {selectedAssignment.title}</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">เนื้อหา</label>
                  <textarea
                    value={submission.content}
                    onChange={(e) => setSubmission({ ...submission, content: e.target.value })}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all text-base"
                    rows={6}
                    placeholder="กรอกเนื้อหางาน..."
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-gray-700 mb-3">ไฟล์แนบ (ถ้ามี)</label>
                  <input
                    type="file"
                    onChange={(e) => setSubmission({ ...submission, file: e.target.files[0] })}
                    className="w-full px-5 py-4 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-orange-500 file:to-amber-500 file:text-white file:font-semibold file:cursor-pointer hover:file:from-orange-600 hover:file:to-amber-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-4 mt-8">
                <button
                  onClick={() => {
                    setShowSubmitModal(false);
                    setSubmission({ content: '', file: null });
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg hover:scale-105"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={() => handleSubmit(selectedAssignment.assignment_id)}
                  disabled={submitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 font-semibold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-105"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>กำลังส่ง...</span>
                    </>
                  ) : (
                    <>
                      <FiUpload size={20} />
                      <span>ส่งงาน</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
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
