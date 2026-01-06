import React, { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { FiPlay, FiCheckCircle, FiClock, FiArrowRight, FiClipboard, FiAlertCircle, FiStar } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const QuizSection = ({ moduleId, videos = [], videosLoading = false }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        <div className={`bg-gradient-to-br ${pretestDone ? 'from-green-50 to-green-100 border-green-200' : 'from-orange-50 to-orange-100 border-orange-200'} rounded-lg shadow-md p-4 sm:p-5 border-2`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`p-2 rounded-full ${pretestDone ? 'bg-green-500' : 'bg-orange-500'} text-white`}>
              <FiClipboard size={20} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              แบบทดสอบก่อนเรียน (Pre-test)
            </h2>
          </div>
          <p className="text-sm sm:text-base text-gray-600 mb-4">
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
              className="inline-flex items-center space-x-2 bg-orange-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-orange-700 transition-colors font-semibold text-sm sm:text-base shadow-md cursor-pointer"
              style={{ textDecoration: 'none' }}
            >
              <span>เริ่มทำแบบทดสอบก่อนเรียน</span>
              <FiArrowRight size={18} />
            </a>
          ) : (
            <div className="flex items-center space-x-2 text-green-600 font-semibold text-base">
              <FiCheckCircle size={20} />
              <span>ทำแบบทดสอบก่อนเรียนแล้ว {pretest.last_score >= 0 && `(คะแนน: ${pretest.last_score}%)`}</span>
            </div>
          )}
        </div>
      )}

      {/* Main Content (Videos and Other Quizzes) */}
      <div className={!pretestDone ? 'opacity-50 pointer-events-none' : ''}>
        {!pretestDone && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 flex items-center space-x-2 font-semibold text-sm">
            <FiAlertCircle size={18} />
            <span>กรุณาทำแบบทดสอบก่อนเรียนด้านบนให้เสร็จก่อน จึงจะสามารถเข้าถึงเนื้อหาได้</span>
          </div>
        )}
        
        {/* Videos List Wrapper */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-5 mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">วิดีโอในหมวดนี้</h2>
          {videosLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
              <p className="text-gray-600 text-sm">กำลังโหลดวิดีโอ...</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="text-center py-8">
              <FiPlay className="mx-auto text-gray-400 mb-3" size={40} />
              <p className="text-gray-600 text-sm">ยังไม่มีวิดีโอในหมวดนี้</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-5 md:space-y-6">
              {videos
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
                    className={`block border-2 rounded-lg p-3 sm:p-4 transition-all ${
                      isLocked
                        ? 'border-gray-300 bg-gray-50 opacity-60 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:shadow-md'
                    }`}
                  >
                    {isLocked ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <FiAlertCircle className="text-gray-500" size={18} />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-gray-500 mb-2 line-clamp-2">{video.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                              <span className="flex items-center space-x-1">
                                <FiClock size={14} />
                                <span className="font-medium">{Math.floor((video.duration || 0) / 60)} นาที</span>
                              </span>
                              <span className="text-red-600 font-semibold text-sm">
                                🔒 กรุณาดูวิดีโอที่ {prevVideo?.order_index || index} ให้ครบ 100% ก่อน
                              </span>
                            </div>
                          </div>
                        </div>
                        <FiAlertCircle className="text-gray-400 flex-shrink-0" size={18} />
                      </div>
                    ) : (
                      <Link
                        to={`/video/${video.video_id}`}
                        className="block"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className="flex-shrink-0">
                              {video.is_complete === 1 ? (
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                                  <FiCheckCircle className="text-green-600" size={18} />
                                </div>
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                  <FiPlay className="text-blue-600" size={18} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-2">{video.title}</h3>
                              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                                <span className="flex items-center space-x-1">
                                  <FiClock size={14} />
                                  <span className="font-medium">{Math.floor((video.duration || 0) / 60)} นาที</span>
                                </span>
                                {video.duration > 0 && (
                                  <span className="text-blue-600 font-semibold text-sm">
                                    ดูแล้ว: {video.is_complete === 1 ? 100 : Math.floor(((video.watch_time || 0) / video.duration) * 100)}%
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <FiArrowRight className="text-gray-400 flex-shrink-0" size={18} />
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Subsequent Quizzes */}
        <div className="space-y-6 sm:space-y-8">
          {otherQuizzes.map((quiz, index) => {
            const videoOrder = quiz.order_index || 1;
            const video = videos.find(v => v.order_index === videoOrder);
            const isVideoCompleted = video && video.is_complete === 1;
            const isLastQuiz = index === otherQuizzes.length - 1;
            
            return (
              <div key={quiz.quiz_id} className="bg-white rounded-lg shadow-md p-4 sm:p-5">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">
                  {otherQuizzes.length === 1 ? 'แบบทดสอบท้ายหลักสูตร' : (isLastQuiz ? `${quiz.title} (แบบทดสอบสุดท้าย)` : quiz.title)}
                </h2>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  {!isVideoCompleted 
                    ? `กรุณาดูวิดีโอที่ ${videoOrder} ให้ครบ 100% ก่อนทำแบบทดสอบ`
                    : `คุณดูวิดีโอที่ ${videoOrder} ครบแล้ว สามารถทำแบบทดสอบได้`}
                </p>
                {isVideoCompleted ? (
                  <Link
                    to={`/quiz/${quiz.quiz_id}`}
                    className="inline-flex items-center space-x-2 bg-purple-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-purple-700 transition-colors font-semibold text-sm sm:text-base shadow-md"
                  >
                    <FiClipboard size={18} />
                    <span>ทำแบบทดสอบ</span>
                  </Link>
                ) : (
                  <div className="inline-flex items-center space-x-2 bg-gray-400 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg cursor-not-allowed font-semibold text-sm sm:text-base shadow-md opacity-60">
                    <FiClipboard size={18} />
                    <span>ทำแบบทดสอบ (ต้องดูวิดีโอที่ ${videoOrder} ครบ 100%)</span>
                  </div>
                )}
                {quiz.last_score >= 0 && (
                  <div className="mt-4 p-3 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border-2 border-purple-200">
                    <p className="text-sm text-gray-700">
                      คะแนนล่าสุด: <span className="font-bold text-base text-purple-700">{quiz.last_score}%</span>
                      {quiz.last_passed === 1 ? (
                        <span className="ml-3 text-green-600 font-semibold text-sm">✓ ผ่าน</span>
                      ) : (
                        <span className="ml-3 text-red-600 font-semibold text-sm">✗ ไม่ผ่าน</span>
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
    <div className="bg-white rounded-lg shadow-md p-4 sm:p-5">
      <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">แบบประเมินความพึงพอใจ</h2>
      <p className="text-sm sm:text-base text-gray-600 mb-4">
        หลังจากเรียนและฝึกปฏิบัติเสร็จแล้ว กรุณาประเมินความพึงพอใจต่อการเข้าอบรมในครั้งนี้
      </p>
      <Link
        to={`/evaluation/${moduleId}`}
        className="inline-flex items-center space-x-2 bg-green-600 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg hover:bg-green-700 transition-colors font-semibold text-sm sm:text-base shadow-md"
      >
        <FiStar size={18} />
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
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const fetchModules = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/videos/modules`);
      setModules(response.data);
      if (moduleId) {
        const module = response.data.find((m) => m.module_id === moduleId);
        setSelectedModule(module);
      }
    } catch (error) {
      console.error('Failed to fetch modules:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลหลักสูตรได้';
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleId]); // Removed 'modules' dependency to prevent unnecessary re-runs

  const fetchVideos = async (id) => {
    try {
      setVideosLoading(true);
      const response = await axios.get(`${API_URL}/videos/module/${id}`);
      if (response && response.data) {
        const newVideos = Array.isArray(response.data) ? response.data : [];
        console.log('📹 Fetched videos:', { count: newVideos.length, videos: newVideos });
        // Only update state if data actually changed to prevent unnecessary re-renders
        setVideos(prevVideos => {
          const dataChanged = JSON.stringify(prevVideos) !== JSON.stringify(newVideos);
          return dataChanged ? newVideos : prevVideos;
        });
      } else {
        console.warn('⚠️ No videos data in response');
        setVideos([]);
      }
    } catch (error) {
      console.error('❌ Failed to fetch videos:', error);
      // Don't update state on error if we already have videos to prevent flickering
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดวิดีโอได้';
      showToast(errorMessage, 'error');
      // Only clear videos if we don't have any yet
      setVideos(prevVideos => prevVideos.length === 0 ? [] : prevVideos);
    } finally {
      setVideosLoading(false);
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
    // Debug: Log videos state
    console.log('📹 Module videos state:', { 
      moduleId, 
      videosCount: videos.length, 
      videos: videos,
      videosLoading 
    });
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-lg p-4 sm:p-6 text-white shadow-md">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3">{selectedModule.title}</h1>
            <p className="text-sm sm:text-base md:text-lg text-blue-50">{selectedModule.description}</p>
          </div>

          <QuizSection moduleId={moduleId} videos={videos} videosLoading={videosLoading} />

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
      <div className="w-full max-w-full mx-auto px-4 lg:px-6">
        {/* Hero Header */}
        <div className="mb-6">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-lg p-4 sm:p-6 text-white shadow-md">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3">หลักสูตรทั้งหมด</h1>
            <p className="text-sm sm:text-base lg:text-lg text-blue-50">หลักสูตรพื้นฐานสำหรับผู้ที่ต้องการเริ่มต้นทำธุรกิจ</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-3xl mx-auto">
            <div className="relative">
              <FiPlay className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาหลักสูตรที่คุณต้องการ..."
                className="w-full px-4 py-3 pl-12 pr-4 border border-gray-300 rounded-xl text-base shadow-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none transition-all hover:shadow-xl"
              />
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        {filteredModules.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center border-2 border-dashed border-gray-300">
            <FiPlay className="mx-auto text-gray-400 mb-4" size={40} />
            <h3 className="text-xl font-bold text-gray-700 mb-2">ไม่พบหลักสูตร</h3>
            <p className="text-base text-gray-500">ลองค้นหาด้วยคำอื่น</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
            {filteredModules.map((module) => (
              <Link
                key={module.module_id}
                to={`/module/${module.module_id}`}
                className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-200 hover:border-blue-300 transform hover:-translate-y-1"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20"></div>
                
                <div className="relative h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center overflow-hidden">
                  {/* Animated background pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                  }}></div>
                  <div className="relative z-10">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                      <FiPlay className="text-white opacity-90 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-300" size={28} />
                    </div>
                  </div>
                  {module.category && (
                    <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-blue-200 z-10">
                      {module.category}
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <h2 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{module.title}</h2>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm leading-relaxed">{module.description || 'เรียนรู้เนื้อหาที่น่าสนใจ'}</p>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className="text-blue-600 font-bold text-sm group-hover:text-blue-700 transition-colors">เริ่มต้นบทเรียน</span>
                    <FiArrowRight className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-2 transition-all duration-300" size={20} />
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
