import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiPlay, FiCheckCircle, FiClock, FiArrowRight, FiClipboard, FiAlertCircle, FiStar } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QuizSection = ({ moduleId, videos = [] }) => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Reset state when moduleId changes
    setQuizzes([]);
    setLoading(true);
    // Force immediate fetch
    fetchQuizzes();
    // Refresh every 30 seconds to catch updates (reduced frequency to prevent flickering)
    const interval = setInterval(() => {
      fetchQuizzes();
    }, 30000);
    return () => clearInterval(interval);
  }, [moduleId]); // Removed 'videos' dependency to prevent unnecessary re-runs

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_URL}/quizzes/module/${moduleId}/all`);
      
      // Only update state if data actually changed to prevent unnecessary re-renders
      const newData = response.data || [];
      setQuizzes(prevQuizzes => {
        // Compare data to avoid unnecessary updates
        const dataChanged = JSON.stringify(prevQuizzes) !== JSON.stringify(newData);
        return dataChanged ? [...newData] : prevQuizzes;
      });
      
      // Debug: Log pre-test status
      const pretest = response.data.find(q => {
        const orderIndex = typeof q.order_index === 'string' ? parseInt(q.order_index, 10) : q.order_index;
        return orderIndex === 0;
      });
      
      if (pretest) {
        console.log('🔍 Pre-test API response:', {
          quiz_id: pretest.quiz_id,
          title: pretest.title,
          last_passed: pretest.last_passed,
          last_score: pretest.last_score,
          order_index: pretest.order_index,
          type_last_passed: typeof pretest.last_passed,
          raw_data: JSON.stringify(pretest)
        });
      } else {
        console.warn('⚠️ No pre-test found in quizzes:', response.data);
      }
    } catch (error) {
      console.error('❌ Failed to fetch quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return null;

  const pretest = quizzes.find(q => {
    const orderIndex = typeof q.order_index === 'string' ? parseInt(q.order_index, 10) : q.order_index;
    return orderIndex === 0;
  });
  const otherQuizzes = quizzes.filter(q => {
    const orderIndex = typeof q.order_index === 'string' ? parseInt(q.order_index, 10) : q.order_index;
    return orderIndex !== 0;
  });
  
  // Normalize last_passed - FORCE to -1 if not exactly 0 or 1
  let normalizedLastPassed = -1;
  
  if (pretest) {
    const raw = pretest.last_passed;
    
    // If last_passed is null, undefined, or -1, user has NOT attempted pre-test
    if (raw === null || raw === undefined || raw === -1) {
      normalizedLastPassed = -1;
    } else {
      // Try to parse as number
      let numValue = -1;
      if (typeof raw === 'string') {
        numValue = parseInt(raw, 10);
      } else if (typeof raw === 'number') {
        numValue = raw;
      }
      
      // ONLY accept 0 or 1, everything else becomes -1
      // 0 = attempted but failed, 1 = attempted and passed
      normalizedLastPassed = (numValue === 0 || numValue === 1) ? numValue : -1;
    }
  }
  
  
  // Check if pre-test has been attempted (any attempt, passed or failed)
  // pretestDone = true if user has attempted pre-test (last_passed is 0 or 1), false if never attempted (-1)
  const pretestDone = pretest && normalizedLastPassed !== -1 && (normalizedLastPassed === 0 || normalizedLastPassed === 1);
  
  
  // Debug log for troubleshooting
  if (pretest) {
    console.log('🎯 Pre-test UI check:', {
      hasPretest: !!pretest,
      quiz_id: pretest.quiz_id,
      module_id: pretest.module_id,
      last_passed: normalizedLastPassed,
      original_last_passed: pretest.last_passed,
      original_type: typeof pretest.last_passed,
      normalized_type: typeof normalizedLastPassed,
      pretestDone: pretestDone,
      willShowButton: !pretestDone,
      condition: `normalizedLastPassed (${normalizedLastPassed}) !== -1 && (${normalizedLastPassed} === 0 || ${normalizedLastPassed} === 1) = ${pretestDone}`,
      full_pretest_data: pretest
    });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Pre-test Section */}
      {pretest && (
        <div className={`bg-gradient-to-br ${pretestDone ? 'from-green-50 to-green-100 border-green-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-xl md:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 border-2`}>
          <div className="flex items-center space-x-4 mb-4">
            <div className={`p-3 rounded-full ${pretestDone ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
              <FiClipboard size={32} />
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800">
              แบบทดสอบก่อนเรียน (Pre-test)
            </h2>
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-6">
            {pretestDone 
              ? normalizedLastPassed === 1
                ? 'คุณทำแบบทดสอบก่อนเรียนเรียบร้อยแล้ว สามารถเริ่มเรียนเนื้อหาวิดีโอได้'
                : 'คุณทำแบบทดสอบก่อนเรียนแล้ว สามารถเริ่มเรียนเนื้อหาวิดีโอได้ (ทำได้เพียงครั้งเดียว)'
              : 'กรุณาทำแบบทดสอบก่อนเรียนเพื่อวัดความรู้พื้นฐานก่อนเริ่มเข้าสู่บทเรียน (ทำได้เพียงครั้งเดียว)'}
          </p>
          {!pretestDone ? (
            <a
              href={`/quiz/${pretest.quiz_id}`}
              onClick={(e) => {
                console.log('✅ Pre-test button clicked!', {
                  quiz_id: pretest.quiz_id,
                  last_passed: normalizedLastPassed,
                  pretestDone: pretestDone
                });
              }}
              className="inline-flex items-center space-x-4 bg-orange-600 text-white px-10 sm:px-12 py-5 sm:py-6 rounded-xl md:rounded-2xl hover:bg-orange-700 transition-colors font-bold text-lg sm:text-xl md:text-2xl shadow-lg cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <span>เริ่มทำแบบทดสอบก่อนเรียน</span>
              <FiArrowRight size={28} />
            </a>
          ) : (
            <div className="flex items-center space-x-3 text-green-600 font-bold text-2xl">
              <FiCheckCircle size={32} />
              <span>ทำแบบทดสอบก่อนเรียนแล้ว {pretest.last_score >= 0 && `(คะแนน: ${pretest.last_score}%)`}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content (Videos and Other Quizzes) */}
      <div className={!pretestDone ? 'opacity-50 pointer-events-none' : ''}>
        {!pretestDone && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 flex items-center space-x-3 font-bold text-xl">
            <FiAlertCircle size={28} />
            <span>กรุณาทำแบบทดสอบก่อนเรียนด้านบนให้เสร็จก่อน จึงจะสามารถเข้าถึงเนื้อหาได้</span>
          </div>
        )}
        
        {/* Videos List Wrapper */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10 mb-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-6 sm:mb-8 md:mb-10">วิดีโอในหมวดนี้</h2>
          <div className="space-y-4 sm:space-y-5 md:space-y-6">
            {videos
              .filter(v => v.url && v.url.trim() !== '')
              .filter((v, index, arr) => arr.findIndex(v2 => v2.order_index === v.order_index) === index)
              .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
              .map((video, index, sortedVideos) => {
                // Check if previous video is completed
                const prevVideo = index > 0 ? sortedVideos[index - 1] : null;
                const isPrevVideoCompleted = !prevVideo || prevVideo.is_complete === 1;
                const isLocked = !isPrevVideoCompleted;
                
                return (
                  <div
                    key={video.video_id}
                    className={`block border-2 rounded-xl md:rounded-2xl p-6 sm:p-7 md:p-8 lg:p-10 transition-all ${
                      isLocked
                        ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:shadow-xl transform hover:scale-[1.01] md:hover:scale-[1.02]'
                    }`}
                  >
                    {isLocked ? (
                      <div className="flex items-center justify-between gap-5 sm:gap-6">
                        <div className="flex items-center space-x-4 sm:space-x-5 md:space-x-6 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-gray-200 flex items-center justify-center shadow-lg">
                              <FiAlertCircle className="text-gray-500" size={32} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-500 mb-3 sm:mb-4 line-clamp-2">{video.title}</h3>
                            <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-500">
                              <span className="flex items-center space-x-2 sm:space-x-3">
                                <FiClock size={22} />
                                <span className="font-semibold">{Math.floor((video.duration || 0) / 60)} นาที</span>
                              </span>
                              <span className="text-red-600 font-bold text-lg sm:text-xl md:text-2xl">
                                🔒 กรุณาดูวิดีโอที่ {prevVideo?.order_index || index} ให้ครบ 100% ก่อน
                              </span>
                            </div>
                          </div>
                        </div>
                        <FiAlertCircle className="text-gray-400 flex-shrink-0" size={28} />
                      </div>
                    ) : (
                      <Link
                        to={`/video/${video.video_id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between gap-5 sm:gap-6">
                          <div className="flex items-center space-x-4 sm:space-x-5 md:space-x-6 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {video.is_complete === 1 ? (
                                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-green-100 flex items-center justify-center shadow-lg">
                                  <FiCheckCircle className="text-green-600" size={32} />
                                </div>
                              ) : (
                                <div className="w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-blue-100 flex items-center justify-center shadow-lg">
                                  <FiPlay className="text-blue-600" size={32} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-800 mb-3 sm:mb-4 line-clamp-2">{video.title}</h3>
                              <div className="flex flex-wrap items-center gap-4 sm:gap-5 text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600">
                                <span className="flex items-center space-x-2 sm:space-x-3">
                                  <FiClock size={22} />
                                  <span className="font-semibold">{Math.floor((video.duration || 0) / 60)} นาที</span>
                                </span>
                                {video.duration > 0 && (
                                  <span className="text-blue-600 font-bold text-lg sm:text-xl md:text-2xl">
                                    ดูแล้ว: {video.is_complete === 1 ? 100 : Math.floor(((video.watch_time || 0) / video.duration) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <FiArrowRight className="text-gray-400 flex-shrink-0" size={28} />
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
          </div>
        </div>

        {/* Subsequent Quizzes */}
        <div className="space-y-6 sm:space-y-8">
          {otherQuizzes.map((quiz, index) => {
            const videoOrder = quiz.order_index || 1;
            const video = videos.find(v => v.order_index === videoOrder);
            const isVideoCompleted = video && video.is_complete === 1;
            const isLastQuiz = index === otherQuizzes.length - 1;
            
            return (
              <div key={quiz.quiz_id} className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-5 sm:mb-6">
                  {otherQuizzes.length === 1 ? 'แบบทดสอบท้ายหลักสูตร' : (isLastQuiz ? `${quiz.title} (แบบทดสอบสุดท้าย)` : quiz.title)}
                </h2>
                <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-6 sm:mb-8">
                  {!isVideoCompleted 
                    ? `กรุณาดูวิดีโอที่ ${videoOrder} ให้ครบ 100% ก่อนทำแบบทดสอบ`
                    : `คุณดูวิดีโอที่ ${videoOrder} ครบแล้ว สามารถทำแบบทดสอบได้`}
                </p>
                {isVideoCompleted ? (
                  <Link
                    to={`/quiz/${quiz.quiz_id}`}
                    className="inline-flex items-center space-x-4 bg-purple-600 text-white px-10 sm:px-12 py-5 sm:py-6 md:py-7 lg:py-8 rounded-xl md:rounded-2xl hover:bg-purple-700 transition-colors font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl shadow-lg hover:shadow-xl"
                  >
                    <FiClipboard size={28} />
                    <span>ทำแบบทดสอบ</span>
                  </Link>
                ) : (
                  <div className="inline-flex items-center space-x-4 bg-gray-400 text-white px-10 sm:px-12 py-5 sm:py-6 md:py-7 lg:py-8 rounded-xl md:rounded-2xl cursor-not-allowed font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl shadow-lg opacity-60">
                    <FiClipboard size={28} />
                    <span>ทำแบบทดสอบ (ต้องดูวิดีโอที่ ${videoOrder} ครบ 100%)</span>
                  </div>
                )}
                {quiz.last_score >= 0 && (
                  <div className="mt-6 sm:mt-8 p-6 sm:p-8 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl md:rounded-2xl border-2 border-purple-200">
                    <p className="text-lg sm:text-xl md:text-2xl text-gray-700">
                      คะแนนล่าสุด: <span className="font-bold text-2xl sm:text-3xl md:text-4xl text-purple-700">{quiz.last_score}%</span>
                      {quiz.last_passed === 1 ? (
                        <span className="ml-4 text-green-600 font-bold text-xl sm:text-2xl md:text-3xl">✓ ผ่าน</span>
                      ) : (
                        <span className="ml-4 text-red-600 font-bold text-xl sm:text-2xl md:text-3xl">✗ ไม่ผ่าน</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Evaluation Section */}
        <div className="mt-8">
          <EvaluationSection moduleId={moduleId} />
        </div>
      </div>
    </div>
  );
};

const EvaluationSection = ({ moduleId }) => {
  return (
    <div className="bg-white rounded-xl md:rounded-2xl shadow-lg p-6 sm:p-8 md:p-10">
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-800 mb-5 sm:mb-6">แบบประเมินความพึงพอใจ</h2>
      <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-gray-600 mb-6 sm:mb-8">
        หลังจากเรียนและฝึกปฏิบัติเสร็จแล้ว กรุณาประเมินความพึงพอใจต่อการเข้าอบรมในครั้งนี้
      </p>
      <Link
        to={`/evaluation/${moduleId}`}
        className="inline-flex items-center space-x-4 bg-green-600 text-white px-10 sm:px-12 py-5 sm:py-6 md:py-7 lg:py-8 rounded-xl md:rounded-2xl hover:bg-green-700 transition-colors font-bold text-lg sm:text-xl md:text-2xl lg:text-3xl shadow-lg hover:shadow-xl"
      >
        <FiStar size={28} />
        <span>ทำแบบประเมิน</span>
      </Link>
    </div>
  );
};

const Modules = () => {
  const { moduleId } = useParams();
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const [modules, setModules] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchModules();
  }, [category]);

  useEffect(() => {
    if (moduleId) {
      if (modules.length > 0) {
        const module = modules.find((m) => m.module_id === moduleId);
        if (module) setSelectedModule(module);
      }
      fetchVideos(moduleId);
      // Reduced refresh frequency from 5s to 30s to prevent flickering
      const interval = setInterval(() => fetchVideos(moduleId), 30000);
      return () => clearInterval(interval);
    }
  }, [moduleId]); // Removed 'modules' dependency to prevent unnecessary re-runs

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/videos/modules`);
      setModules(response.data);
      if (moduleId) {
        const module = response.data.find((m) => m.module_id === moduleId);
        setSelectedModule(module);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลหลักสูตรได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideos = async (id) => {
    try {
      const response = await axios.get(`${API_URL}/videos/module/${id}`);
      if (response && response.data) {
        const newVideos = Array.isArray(response.data) ? response.data : [];
        // Only update state if data actually changed to prevent unnecessary re-renders
        setVideos(prevVideos => {
          const dataChanged = JSON.stringify(prevVideos) !== JSON.stringify(newVideos);
          return dataChanged ? newVideos : prevVideos;
        });
      } else {
        setVideos([]);
      }
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Don't update state on error if we already have videos to prevent flickering
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดวิดีโอได้';
      showToast(errorMessage, 'error');
    }
  };

  const filteredModules = modules.filter((module) => {
    if (searchQuery.length < 3) return true;
    return (
      module.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (module.description && module.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (moduleId && selectedModule) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-3xl p-12 md:p-16 text-white shadow-2xl">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mb-6">{selectedModule.title}</h1>
            <p className="text-2xl sm:text-3xl md:text-4xl text-blue-50">{selectedModule.description}</p>
          </div>

          <QuizSection moduleId={moduleId} videos={videos} />

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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Hero Header */}
        <div className="mb-16">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-3xl p-16 md:p-20 text-white shadow-2xl transform transition-all hover:scale-[1.01]">
            <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold mb-10">เริ่มต้นทำธุรกิจ</h1>
            <p className="text-4xl lg:text-5xl text-blue-50">หลักสูตรพื้นฐานสำหรับผู้ที่ต้องการเริ่มต้นทำธุรกิจ</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-12">
          <div className="relative max-w-3xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาหลักสูตร..."
              className="w-full px-12 py-8 pl-20 border-2 border-gray-300 rounded-2xl text-3xl shadow-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
            />
            <FiPlay className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={32} />
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center border-2 border-dashed border-gray-300">
            <FiPlay className="mx-auto text-gray-400 mb-6" size={80} />
            <h3 className="text-4xl font-bold text-gray-700 mb-4">ไม่พบหลักสูตร</h3>
            <p className="text-2xl text-gray-500">ลองค้นหาด้วยคำอื่น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-12">
            {filteredModules.map((module) => (
              <Link
                key={module.module_id}
                to={`/module/${module.module_id}`}
                className="relative bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 group border-2 border-transparent hover:border-blue-200"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20"></div>
                
                <div className="relative h-80 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                  {/* Animated background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-400/50 to-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                  <FiPlay className="relative z-10 text-white opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-125 group-hover:rotate-12 duration-300 drop-shadow-2xl" size={112} />
                  {module.category && (
                    <span className="absolute top-8 right-8 bg-white/95 backdrop-blur-md text-blue-600 px-6 py-3 rounded-full text-lg font-bold shadow-xl border-2 border-blue-200 transform group-hover:scale-110 transition-transform z-10">
                      {module.category}
                    </span>
                  )}
                </div>
                <div className="p-12">
                  <h2 className="text-4xl font-bold text-gray-800 mb-6 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{module.title}</h2>
                  <p className="text-gray-600 mb-10 line-clamp-2 text-xl leading-relaxed">{module.description || 'เรียนรู้เนื้อหาที่น่าสนใจ'}</p>
                  <div className="flex items-center justify-between pt-6 border-t-2 border-gray-200">
                    <span className="text-blue-600 font-bold text-3xl group-hover:text-blue-700 transition-colors">เข้าสู่บทเรียน</span>
                    <FiArrowRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all" size={40} />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default Modules;
