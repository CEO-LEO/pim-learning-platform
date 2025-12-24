import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton, LoadingSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Quiz = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [attemptInfo, setAttemptInfo] = useState(null);
  const [error, setError] = useState(null);
  const [errorData, setErrorData] = useState(null); // Store error response data for module_id
  const [toast, setToast] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchQuiz();
    fetchAttemptInfo();
  }, [quizId]);

  useEffect(() => {
    if (quiz && quiz.time_limit && !submitted && timeLeft !== null) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, submitted, timeLeft]);

  // Navigate logic when quiz is passed
  useEffect(() => {
    const handleQuizPassed = async () => {
      if (result && result.passed && quiz && quiz.module_id) {
        try {
          // Fetch videos from the module
          const videosResponse = await axios.get(`${API_URL}/videos/module/${quiz.module_id}`);
          const videos = videosResponse.data;
          
          // Find video 2
          const video2 = videos.find(v => v.order_index === 2);
          const hasVideo2 = !!video2;
          
          // Check which quiz was just passed based on quiz order_index
          const quizOrder = quiz.order_index || 1;
          
          if (quizOrder === 1) {
            // Just passed Quiz 1
            if (hasVideo2) {
              // Module has video 2 -> go to Video 2
              showToast('ผ่านแบบทดสอบที่ 1 แล้ว กำลังไปวิดีโอที่ 2...', 'success');
              setTimeout(() => {
                navigate(`/video/${video2.video_id}`);
              }, 2000);
            } else {
              // Module only has 1 video -> course finished!
              showToast('ยินดีด้วย! คุณผ่านแบบทดสอบแล้ว และจบหลักสูตรนี้แล้ว', 'success');
              setTimeout(() => {
                navigate(`/module/${quiz.module_id}`);
              }, 2000);
            }
          } else if (quizOrder === 2) {
            // Just passed Quiz 2 -> module finished
            showToast('ยินดีด้วย! คุณผ่านแบบทดสอบสุดท้ายแล้ว และจบหลักสูตรนี้แล้ว', 'success');
            setTimeout(() => {
              navigate(`/module/${quiz.module_id}`);
            }, 2000);
          } else {
            // Fallback for other quizzes
            showToast('ผ่านแบบทดสอบแล้ว', 'success');
            setTimeout(() => {
              navigate(`/module/${quiz.module_id}`);
            }, 2000);
          }
        } catch (error) {
          console.error('Failed to fetch videos for navigation:', error);
          showToast('ผ่านแบบทดสอบแล้ว', 'success');
          setTimeout(() => {
            navigate(`/module/${quiz.module_id}`);
          }, 2000);
        }
      }
    };

    handleQuizPassed();
  }, [result, quiz, navigate]);

  const fetchQuiz = async () => {
    try {
      setError(null);
      setErrorData(null); // Reset error data
      setLoading(true);
      const response = await axios.get(`${API_URL}/quizzes/${quizId}`);
      
      // Check if quiz data exists
      if (!response || !response.data) {
        throw new Error('ไม่พบข้อมูลแบบทดสอบ');
      }
      
      // Check if quiz has questions - be more defensive
      const questions = response.data.questions;
      if (!questions || !Array.isArray(questions) || questions.length === 0) {
        // Store module_id before throwing error
        if (response.data?.module_id) {
          setErrorData({ module_id: response.data.module_id });
        }
        throw new Error('ไม่พบคำถามในแบบทดสอบนี้');
      }
      setQuiz(response.data);
      if (response.data.time_limit) {
        setTimeLeft(response.data.time_limit * 60); // Convert minutes to seconds
      }
    } catch (error) {
      console.error('Failed to fetch quiz:', error);
      
      let errorMessage = 'ไม่สามารถโหลดแบบทดสอบได้';
      
      // Handle different error types
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        const serverErrorMsg = error.response.data?.error;
        const clientErrorMsg = error.message;
        
        // Handle authentication errors (401/403 from authenticateToken middleware)
        if (status === 401 || status === 403) {
          // Check if it's an authentication error (token missing or invalid)
          if (serverErrorMsg === 'Access token required' || 
              serverErrorMsg === 'Invalid or expired token' ||
              serverErrorMsg?.includes('token')) {
            errorMessage = 'กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ';
            // Redirect to login after showing error
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else if (status === 403) {
            // Handle other 403 errors (video completion, pre-test already completed)
            const errorData = error.response.data;
            if (errorData?.requires_video_completion || errorData?.already_completed) {
              errorMessage = serverErrorMsg || errorMessage;
              const moduleId = errorData?.module_id || (quiz && quiz.module_id);
              if (moduleId) {
                setTimeout(() => {
                  navigate(`/module/${moduleId}`);
                }, 2000);
              }
            } else {
              // Other 403 errors - use server message or default
              errorMessage = serverErrorMsg || errorMessage;
            }
          } else {
            // Other 401 errors
            errorMessage = serverErrorMsg || 'กรุณาเข้าสู่ระบบก่อนทำแบบทดสอบ';
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else if (status === 404) {
          const serverError = error.response.data?.error || '';
          if (serverError.includes('ไม่พบคำถาม')) {
            errorMessage = serverError;
          } else {
            errorMessage = serverError || 'ไม่พบแบบทดสอบ';
          }
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else {
        // Error setting up the request
        errorMessage = error.message || errorMessage;
      }
      
      // Store error data for module_id access
      if (error.response?.data) {
        setErrorData(error.response.data);
      } else {
        setErrorData(null);
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttemptInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/quizzes/${quizId}/attempts`);
      setAttemptInfo(response.data);
    } catch (error) {
      // Silently fail for attempt info - not critical for quiz functionality
      // Set default values if fetch fails
      setAttemptInfo({
        attempts: 0,
        attempt_count: 0,
        max_attempts: 20,
        remaining_attempts: 20,
        can_attempt: true
      });
    }
  };

  const handleAnswerChange = (questionId, answer) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));
  };

  const handleSubmit = async (confirmed = false) => {
    if (submitted || submitting) return;

    // Check attempt limit
    if (attemptInfo && !attemptInfo.can_attempt) {
      showToast(`คุณทำแบบทดสอบครบ ${attemptInfo.max_attempts} ครั้งแล้ว ไม่สามารถทำได้อีก`, 'warning');
      return;
    }

    // Convert answers object to array format
    const answersArray = Object.keys(answers).map(questionId => ({
      question_id: questionId,
      answer: answers[questionId]
    }));

    if (answersArray.length === 0) {
      showToast('กรุณาตอบคำถามอย่างน้อย 1 ข้อ', 'warning');
      return;
    }

    // Check if all questions are answered
    const totalQuestions = quiz.questions?.length || 0;
    if (!confirmed && answersArray.length < totalQuestions) {
      setConfirmMessage(`คุณยังไม่ได้ตอบคำถามทั้งหมด (ตอบแล้ว ${answersArray.length}/${totalQuestions} ข้อ)\nต้องการส่งคำตอบหรือไม่?`);
      setShowConfirmDialog(true);
      return;
    }

    setSubmitting(true);
    try {
      const response = await axios.post(`${API_URL}/quizzes/${quizId}/submit`, {
        answers: answersArray,
      });
      setResult(response.data);
      setSubmitted(true);
      showToast('ส่งคำตอบสำเร็จ!', 'success');
      // Refresh attempt info after submission
      fetchAttemptInfo();
    } catch (error) {
      console.error('Failed to submit quiz:', error);
      const errorMessage = error.response?.data?.error || 'ส่งคำตอบไม่สำเร็จ กรุณาลองอีกครั้ง';
      showToast(errorMessage, 'error');
      // Refresh attempt info on error
      fetchAttemptInfo();
    } finally {
      setSubmitting(false);
      setShowConfirmDialog(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (error && !quiz) {
    // Get module_id from stored error data or quiz if available
    const moduleId = errorData?.module_id || (quiz && quiz.module_id);
    
    return (
      <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={fetchQuiz}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
            {moduleId ? (
              <Link
                to={`/module/${moduleId}`}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                กลับไปหน้าหลักสูตร
              </Link>
            ) : (
              <Link
                to="/modules"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                กลับไปหน้าหลักสูตร
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">ไม่พบแบบทดสอบ</p>
        <Link to="/modules" className="text-blue-600 hover:underline mt-4 inline-block">
          กลับไปหน้าหลักสูตร
        </Link>
      </div>
    );
  }

  // Check if quiz has questions
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-yellow-800 mb-2">ไม่พบคำถาม</h2>
          <p className="text-yellow-600 mb-4">แบบทดสอบนี้ยังไม่มีคำถาม กรุณาติดต่อผู้ดูแลระบบ</p>
          <div className="flex items-center justify-center space-x-4">
            {quiz.module_id ? (
              <Link
                to={`/module/${quiz.module_id}`}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                กลับไปหน้าหลักสูตร
              </Link>
            ) : (
              <Link
                to="/modules"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                กลับไปหน้าหลักสูตร
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <Link
          to={`/module/${quiz.module_id}`}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
        >
          <FiArrowLeft size={20} />
          <span>กลับไปหน้าหลักสูตร</span>
        </Link>

        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <div className={`w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center ${
            result.passed ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {result.passed ? (
              <FiCheckCircle className="text-green-600" size={48} />
            ) : (
              <FiXCircle className="text-red-600" size={48} />
            )}
          </div>
          <h2 className="text-3xl font-bold text-gray-800 mb-2">
            {result.passed ? 'ผ่าน!' : 'ไม่ผ่าน'}
          </h2>
          <p className="text-2xl font-semibold text-blue-600 mb-4">
            คะแนน: {result.score}%
          </p>
          <p className="text-gray-600 mb-4">
            {result.passed
              ? 'ยินดีด้วย! คุณผ่านเกณฑ์การทดสอบแล้ว'
              : `คุณต้องได้คะแนนอย่างน้อย ${quiz.passing_score || 70}% เพื่อผ่านการทดสอบ กรุณาทำใหม่อีกครั้ง`}
          </p>
          {result.attempt_number && (
            <p className="text-sm text-gray-500 mb-6">
              ครั้งที่ {result.attempt_number} / 20
              {result.remaining_attempts !== undefined && result.remaining_attempts > 0 && (
                <span className="ml-2">(เหลือ {result.remaining_attempts} ครั้ง)</span>
              )}
            </p>
          )}
          <div className="flex items-center justify-center space-x-4">
            <Link
              to={`/module/${quiz.module_id}`}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-semibold"
            >
              <FiArrowLeft size={20} />
              <span>กลับหน้าหลักสูตร</span>
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setResult(null);
                if (quiz.time_limit) {
                  setTimeLeft(quiz.time_limit * 60);
                }
                fetchAttemptInfo();
              }}
              disabled={attemptInfo && !attemptInfo.can_attempt}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {attemptInfo && !attemptInfo.can_attempt ? 'ทำครบ 20 ครั้งแล้ว' : 'ทำใหม่'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <Link
        to={`/module/${quiz.module_id}`}
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <FiArrowLeft size={20} />
        <span>กลับไปหน้าหลักสูตร</span>
      </Link>

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">{quiz.title}</h1>
            <p className="text-purple-100">
              {quiz.questions?.length || 0} คำถาม
            </p>
          </div>
          {timeLeft !== null && (
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 rounded-lg px-4 py-2">
              <FiClock size={20} />
              <span className="text-xl font-bold">{formatTime(timeLeft)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {quiz.questions?.map((question, index) => (
          <div 
            key={question.question_id} 
            className={`bg-white rounded-xl shadow-md p-6 transition-all ${
              answers[question.question_id] 
                ? 'border-2 border-purple-200' 
                : 'border-2 border-transparent'
            }`}
          >
            <div className="flex items-start space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                answers[question.question_id]
                  ? 'bg-purple-600'
                  : 'bg-gray-300'
              }`}>
                {index + 1}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {question.question}
                </h3>
                <div className="space-y-2">
                  {question.options?.map((option, optIndex) => (
                    <label
                      key={optIndex}
                      className={`flex items-center space-x-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        answers[question.question_id] === option
                          ? 'border-purple-600 bg-purple-50 shadow-sm'
                          : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.question_id}
                        value={option}
                        checked={answers[question.question_id] === option}
                        onChange={(e) => handleAnswerChange(question.question_id, e.target.value)}
                        disabled={submitted || submitting}
                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />
                      <span className="text-gray-700 flex-1">{option}</span>
                      {answers[question.question_id] === option && (
                        <FiCheckCircle className="text-purple-600" size={20} />
                      )}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Submit Button */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="mb-4 text-sm text-gray-600">
          <p>ตอบแล้ว: {Object.keys(answers).length} / {quiz.questions?.length || 0} คำถาม</p>
          {attemptInfo && (
            <p className="mt-1">
              ครั้งที่ทำแล้ว: {attemptInfo.attempt_count} / {attemptInfo.max_attempts} ครั้ง
              {attemptInfo.remaining_attempts > 0 && (
                <span className="text-blue-600 font-semibold"> (เหลือ {attemptInfo.remaining_attempts} ครั้ง)</span>
              )}
            </p>
          )}
        </div>
        <button
          onClick={() => handleSubmit(false)}
          disabled={submitted || submitting || Object.keys(answers).length === 0 || (attemptInfo && !attemptInfo.can_attempt)}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-2"
        >
          {submitting ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>กำลังส่ง...</span>
            </>
          ) : attemptInfo && !attemptInfo.can_attempt ? (
            <span>ทำครบ {attemptInfo.max_attempts} ครั้งแล้ว</span>
          ) : (
            <span>ส่งคำตอบ</span>
          )}
        </button>
      </div>
      
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">ยืนยันการส่งคำตอบ</h3>
            <p className="text-gray-600 mb-6 whitespace-pre-line">{confirmMessage}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSubmit(true)}
                className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                ยืนยัน
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

export default Quiz;

