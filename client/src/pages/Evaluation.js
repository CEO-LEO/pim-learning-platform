import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Evaluation = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const [module, setModule] = useState(null);
  const [answers, setAnswers] = useState({
    q1: '', // การปฏิบัติในช่วงเรียนเป็นประโยชน์หรือไม่
    q2: '', // เนื้อหาที่เรียนช่วยให้ทำงานได้ดีขึ้นหรือไม่
    q3: '', // วิดีโอเข้าใจง่ายหรือไม่
    q4: '', // แบบทดสอบเหมาะสมหรือไม่
    q5: '', // ความคิดเห็นเพิ่มเติม
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchModule();
  }, [moduleId]);

  const fetchModule = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/videos/modules`);
      const foundModule = response.data.find(m => m.module_id === moduleId);
      setModule(foundModule);
      if (!foundModule) {
        setError('ไม่พบหลักสูตร');
      }
    } catch (error) {
      console.error('Failed to fetch module:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลหลักสูตรได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!answers.q1 || !answers.q2) {
      showToast('กรุณาตอบคำถามที่จำเป็น', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/evaluations`, {
        module_id: moduleId,
        answers,
      });
      setSubmitted(true);
      showToast('ส่งแบบประเมินสำเร็จ!', 'success');
    } catch (error) {
      console.error('Failed to submit evaluation:', error);
      const errorMessage = error.response?.data?.error || 'ส่งแบบประเมินไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingStars = (value) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => handleAnswerChange('q1', (i + 1).toString())}
        className={`text-2xl ${
          parseInt(answers.q1) > i ? 'text-yellow-400' : 'text-gray-300'
        } hover:text-yellow-400 transition-colors`}
      >
        ★
      </button>
    ));
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !module) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchModule}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="max-w-2xl mx-auto" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
            <FiCheckCircle className="text-green-600" size={48} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">ขอบคุณสำหรับการประเมิน</h2>
          <p className="text-gray-600 mb-6">
            เราได้รับแบบประเมินของคุณแล้ว และจะนำไปใช้ในการปรับปรุงหลักสูตรต่อไป
          </p>
          <button
            onClick={() => navigate('/modules')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            กลับไปหน้าหลักสูตร
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">แบบประเมินหลังการฝึกปฏิบัติ</h1>
        <p className="text-gray-600">
          {module?.title || 'Module'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-6">
        {/* Question 1: Practice Usefulness */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            1. การปฏิบัติในช่วงเรียนเป็นประโยชน์ต่อการทำงานจริงหรือไม่? <span className="text-red-500">*</span>
          </label>
          <div className="flex items-center space-x-2 mb-2">
            {getRatingStars()}
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>ไม่เป็นประโยชน์</span>
            <span>เป็นประโยชน์มากที่สุด</span>
          </div>
        </div>

        {/* Question 2: Content Helpfulness */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            2. เนื้อหาที่เรียนช่วยให้คุณทำงานได้ดีขึ้นหรือไม่? <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            {[
              { value: '1', label: 'ไม่ช่วยเลย' },
              { value: '2', label: 'ช่วยน้อย' },
              { value: '3', label: 'ช่วยปานกลาง' },
              { value: '4', label: 'ช่วยมาก' },
              { value: '5', label: 'ช่วยมากที่สุด' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="q2"
                  value={option.value}
                  checked={answers.q2 === option.value}
                  onChange={(e) => handleAnswerChange('q2', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 3: Video Clarity */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            3. วิดีโอเข้าใจง่ายหรือไม่?
          </label>
          <div className="space-y-2">
            {[
              { value: '1', label: 'เข้าใจยากมาก' },
              { value: '2', label: 'เข้าใจยาก' },
              { value: '3', label: 'เข้าใจปานกลาง' },
              { value: '4', label: 'เข้าใจง่าย' },
              { value: '5', label: 'เข้าใจง่ายมาก' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="q3"
                  value={option.value}
                  checked={answers.q3 === option.value}
                  onChange={(e) => handleAnswerChange('q3', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 4: Quiz Appropriateness */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            4. แบบทดสอบเหมาะสมหรือไม่?
          </label>
          <div className="space-y-2">
            {[
              { value: '1', label: 'ไม่เหมาะสมเลย' },
              { value: '2', label: 'ไม่เหมาะสม' },
              { value: '3', label: 'เหมาะสมปานกลาง' },
              { value: '4', label: 'เหมาะสม' },
              { value: '5', label: 'เหมาะสมมาก' },
            ].map((option) => (
              <label
                key={option.value}
                className="flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-colors hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name="q4"
                  value={option.value}
                  checked={answers.q4 === option.value}
                  onChange={(e) => handleAnswerChange('q4', e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Question 5: Additional Comments */}
        <div>
          <label className="block text-lg font-semibold text-gray-800 mb-3">
            5. ความคิดเห็นเพิ่มเติม
          </label>
          <textarea
            value={answers.q5}
            onChange={(e) => handleAnswerChange('q5', e.target.value)}
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="กรุณาใส่ความคิดเห็นของคุณ..."
          />
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={() => navigate('/modules')}
            className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg hover:from-blue-700 hover:to-cyan-600 transition-all font-semibold disabled:opacity-50"
          >
            {submitting ? 'กำลังส่ง...' : 'ส่งแบบประเมิน'}
          </button>
        </div>
      </form>
      
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

export default Evaluation;

