import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { FiClock, FiCheckCircle, FiXCircle, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-4xl mx-auto px-4 space-y-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (error && !quiz) {
    // Get module_id from stored error data or quiz if available
    const moduleId = errorData?.module_id || (quiz && quiz.module_id);
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAlertCircle className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-red-700 text-lg mb-8 font-medium">{error}</p>
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-3">
              <button
                onClick={fetchQuiz}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ลองใหม่อีกครั้ง
              </button>
              {moduleId ? (
                <Link
                  to={`/module/${moduleId}`}
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าหลักสูตร
                </Link>
              ) : (
                <Link
                  to="/modules"
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าหลักสูตร
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-gray-600 text-lg mb-6">ไม่พบแบบทดสอบ</p>
          <Link to="/modules" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl inline-block hover:scale-105">
            กลับไปหน้าหลักสูตร
          </Link>
        </div>
      </div>
    );
  }

  // Check if quiz has questions
  if (!quiz.questions || quiz.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50 flex items-center justify-center px-4" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-yellow-200 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAlertCircle className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-4">ไม่พบคำถาม</h2>
            <p className="text-yellow-700 text-lg mb-8 font-medium">แบบทดสอบนี้ยังไม่มีคำถาม กรุณาติดต่อผู้ดูแลระบบ</p>
            <div className="flex items-center justify-center space-x-4">
              {quiz.module_id ? (
                <Link
                  to={`/module/${quiz.module_id}`}
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าหลักสูตร
                </Link>
              ) : (
                <Link
                  to="/modules"
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าหลักสูตร
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 py-12 px-4" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-3xl mx-auto">
          <Link
            to={`/module/${quiz.module_id}`}
            className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 mb-8 font-semibold transition-all hover:translate-x-1 group"
          >
            <FiArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
            <span>กลับไปหน้าหลักสูตร</span>
          </Link>

          <div className={`bg-gradient-to-br ${result.passed ? 'from-green-50 to-emerald-50' : 'from-red-50 to-orange-50'} backdrop-blur-sm border-2 ${result.passed ? 'border-green-200' : 'border-red-200'} rounded-3xl shadow-2xl p-12 text-center`}>
            <div className={`w-32 h-32 rounded-full mx-auto mb-8 flex items-center justify-center shadow-2xl bg-gradient-to-br ${
              result.passed ? 'from-green-500 to-emerald-500' : 'from-red-500 to-orange-500'
            } animate-bounce`}>
              {result.passed ? (
                <FiCheckCircle className="text-white" size={64} />
              ) : (
                <FiXCircle className="text-white" size={64} />
              )}
            </div>
            <h2 className={`text-5xl font-bold mb-6 bg-gradient-to-r ${result.passed ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'} bg-clip-text text-transparent`}>
              {result.passed ? 'ผ่าน!' : 'ไม่ผ่าน'}
            </h2>
            <div className="mb-6">
              <div className={`inline-block px-8 py-4 rounded-2xl shadow-xl bg-gradient-to-r ${result.passed ? 'from-green-600 to-emerald-600' : 'from-red-600 to-orange-600'}`}>
                <p className="text-3xl font-bold text-white">
                  คะแนน: {result.score}%
                </p>
              </div>
            </div>
            <p className={`text-xl mb-8 font-medium ${result.passed ? 'text-green-700' : 'text-red-700'}`}>
              {result.passed
                ? 'ยินดีด้วย! คุณผ่านเกณฑ์การทดสอบแล้ว'
                : `คุณต้องได้คะแนนอย่างน้อย ${quiz.passing_score || 70}% เพื่อผ่านการทดสอบ กรุณาทำใหม่อีกครั้ง`}
            </p>
            {result.attempt_number && (
              <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 mb-8 inline-block">
                <p className="text-lg text-gray-700 font-semibold">
                  ครั้งที่ {result.attempt_number} / 20
                  {result.remaining_attempts !== undefined && result.remaining_attempts > 0 && (
                    <span className="ml-2 text-blue-600">(เหลือ {result.remaining_attempts} ครั้ง)</span>
                  )}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-4">
              <Link
                to={`/module/${quiz.module_id}`}
                className="inline-flex items-center space-x-2 px-8 py-4 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all font-bold shadow-lg hover:shadow-xl text-lg hover:scale-105"
              >
                <FiArrowLeft size={24} />
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
                className={`px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-bold shadow-lg hover:shadow-xl text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105`}
              >
                {attemptInfo && !attemptInfo.can_attempt ? 'ทำครบ 20 ครั้งแล้ว' : 'ทำใหม่'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 pb-12" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="max-w-4xl mx-auto px-4 space-y-6">
        <Link
          to={`/module/${quiz.module_id}`}
          className="inline-flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold transition-all hover:translate-x-1 group"
        >
          <FiArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>กลับไปหน้าหลักสูตร</span>
        </Link>

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer"></div>
          <div className="relative flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2 drop-shadow-lg">{quiz.title}</h1>
              <p className="text-lg text-purple-100 font-semibold">
                {quiz.questions?.length || 0} คำถาม
              </p>
            </div>
            {timeLeft !== null && (
              <div className="flex items-center space-x-3 bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 shadow-lg">
                <FiClock size={24} />
                <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {quiz.questions?.map((question, index) => (
            <div 
              key={question.question_id} 
              className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 transition-all duration-300 border-2 ${
                answers[question.question_id] 
                  ? 'border-purple-400 shadow-2xl scale-[1.02]' 
                  : 'border-white/50 hover:border-purple-200 hover:shadow-2xl'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-all duration-300 ${
                  answers[question.question_id]
                    ? 'bg-gradient-to-br from-purple-600 to-indigo-600 scale-110'
                    : 'bg-gradient-to-br from-gray-400 to-gray-500'
                }`}>
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800 mb-4 leading-relaxed">
                    {question.question}
                  </h3>
                  <div className="space-y-3">
                    {question.options?.map((option, optIndex) => (
                      <label
                        key={optIndex}
                        className={`flex items-center space-x-4 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                          answers[question.question_id] === option
                            ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-indigo-50 shadow-lg scale-[1.02]'
                            : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50 hover:shadow-md'
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
                        <span className="text-gray-700 flex-1 font-medium">{option}</span>
                        {answers[question.question_id] === option && (
                          <FiCheckCircle className="text-purple-600 animate-bounce" size={24} />
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
        <div className="bg-gradient-to-br from-white to-purple-50/30 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50">
          <div className="mb-6 space-y-2">
            <p className="text-lg font-bold text-gray-700">ตอบแล้ว: <span className="text-purple-600">{Object.keys(answers).length}</span> / {quiz.questions?.length || 0} คำถาม</p>
            {attemptInfo && (
              <p className="text-base text-gray-600 font-semibold">
                ครั้งที่ทำแล้ว: {attemptInfo.attempt_count} / {attemptInfo.max_attempts} ครั้ง
                {attemptInfo.remaining_attempts > 0 && (
                  <span className="ml-2 text-blue-600 font-bold"> (เหลือ {attemptInfo.remaining_attempts} ครั้ง)</span>
                )}
              </p>
            )}
          </div>
          <button
            onClick={() => handleSubmit(false)}
            disabled={submitted || submitting || Object.keys(answers).length === 0 || (attemptInfo && !attemptInfo.can_attempt)}
            className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white py-5 rounded-xl hover:from-purple-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center space-x-3 shadow-2xl hover:shadow-purple-500/50 hover:scale-[1.02] relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                <span>กำลังส่ง...</span>
              </>
            ) : attemptInfo && !attemptInfo.can_attempt ? (
              <span>ทำครบ {attemptInfo.max_attempts} ครั้งแล้ว</span>
            ) : (
              <span>ส่งคำตอบ</span>
            )}
          </button>
        </div>
      </div>
      
      {/* Confirm Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl border-2 border-purple-200 animate-bounce">
            <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">ยืนยันการส่งคำตอบ</h3>
            <p className="text-gray-700 text-lg mb-8 whitespace-pre-line font-medium">{confirmMessage}</p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold text-lg hover:scale-105 hover:shadow-lg"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => handleSubmit(true)}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold text-lg hover:scale-105 shadow-lg hover:shadow-xl"
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

