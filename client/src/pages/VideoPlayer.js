import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiArrowLeft, FiAlertCircle, FiBook } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
// Use API_URL base for video URLs if SERVER_URL is not set
const getServerUrl = () => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  // Extract base URL from API_URL (remove /api)
  if (API_URL.includes('/api')) {
    return API_URL.replace('/api', '');
  }
  return 'http://localhost:5000';
};
const SERVER_URL = getServerUrl();

// Debug logging for environment variables
console.log('[VideoPlayer] Environment Variables:', {
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL,
  API_URL,
  SERVER_URL
});

const VideoPlayer = () => {
  const { videoId } = useParams();
  const navigate = useNavigate();
  // #region agent log
  try{fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:11',message:'VideoPlayer component mount',data:{videoId,hasVideoId:!!videoId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});}catch(e){}
  // #endregion
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [error, setError] = useState(null);
  const [errorData, setErrorData] = useState(null); // Store error response data
  const [toast, setToast] = useState(null);
  const videoRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const hasRestoredPosition = useRef(false);
  const lastUpdateTime = useRef(0);
  const maxTimeWatched = useRef(0); // Track maximum time naturally watched
  const isSeeking = useRef(false);
  const initialIsComplete = useRef(false); // Store initial completion status

  // Helper function to get full video URL
  const getVideoUrl = (url) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:52',message:'getVideoUrl entry',data:{url,urlType:typeof url,urlLength:url?.length,hasUrl:!!url,apiUrl:API_URL,serverUrl:SERVER_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    if (!url) {
      console.error('[VideoPlayer] No video URL provided');
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:54',message:'getVideoUrl no url',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return null;
    }
    // If already a full URL (http:// or https://), return as is
    if (url.startsWith('http://') || url.startsWith('https://')) {
      console.log('[VideoPlayer] Using full URL:', url);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:59',message:'getVideoUrl full url',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      return url;
    }
    
    // Extract filename from path (e.g., /uploads/videos/video-module_1-1.mp4 -> video-module_1-1.mp4)
    let filename = url;
    if (url.includes('/')) {
      filename = url.split('/').pop();
    }
    
    // Use video streaming route with authentication instead of static files
    // This ensures video files are accessible even if Git LFS files aren't pulled
    // Add token to query parameter because video element can't send Authorization header
    const token = localStorage.getItem('token');
    const fullUrl = token 
      ? `${API_URL}/videos/stream/${filename}?token=${encodeURIComponent(token)}`
      : `${API_URL}/videos/stream/${filename}`;
    
    // Enhanced debug logging
    const debugInfo = { 
      original: url,
      filename: filename,
      serverUrl: SERVER_URL,
      apiUrl: API_URL,
      fullUrl,
      hasServerUrl: !!SERVER_URL,
      hasApiUrl: !!API_URL,
      envApiUrl: process.env.REACT_APP_API_URL,
      envServerUrl: process.env.REACT_APP_SERVER_URL,
      allEnvVars: Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')),
      hasToken: !!token,
      tokenLength: token?.length
    };
    console.log('[VideoPlayer] Constructed URL:', debugInfo);
    
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:77',message:'getVideoUrl constructed',data:debugInfo,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
    // #endregion
    
    // Alert if API_URL is missing (for debugging)
    if (!API_URL || API_URL === 'http://localhost:5000/api') {
      console.warn('[VideoPlayer] ⚠️ API_URL is missing or using default!', {
        API_URL,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:93',message:'getVideoUrl api url missing',data:{apiUrl:API_URL,envApiUrl:process.env.REACT_APP_API_URL,envServerUrl:process.env.REACT_APP_SERVER_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
    }
    
    return fullUrl;
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    // #region agent log
    try{fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:44',message:'useEffect triggered',data:{videoId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});}catch(e){}
    // #endregion
    
    // Validate videoId
    if (!videoId) {
      setError('ไม่พบ ID วิดีโอ');
      setLoading(false);
      return;
    }
    
    // Ensure axios defaults are set before making request
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    
    fetchVideo();
    hasRestoredPosition.current = false; // Reset when video changes
    return () => {
      // Copy ref value to avoid stale closure
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const intervalId = progressIntervalRef.current;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      console.log('[DEBUG] fetchVideo called', { videoId, hasToken: !!localStorage.getItem('token') });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:54',message:'fetchVideo entry',data:{videoId,hasToken:!!localStorage.getItem('token'),authHeader:axios.defaults.headers.common['Authorization']?.substring(0,20)+'...',apiUrl:API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setError(null);
      setErrorData(null);
      
      // Ensure token is always fresh and set for this request
      const token = localStorage.getItem('token');
      if (!token) {
        const errorMsg = 'กรุณาเข้าสู่ระบบก่อนดูวิดีโอ';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      // Update axios defaults and also include in request config for safety
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log('[DEBUG] Making request', { url: `${API_URL}/videos/${videoId}`, hasToken: !!token });
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:58',message:'Before axios request',data:{url:`${API_URL}/videos/${videoId}`,hasToken:!!token,hasConfig:!!config.headers,authHeader:axios.defaults.headers.common['Authorization']?.substring(0,30)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await axios.get(`${API_URL}/videos/${videoId}`, config);
      console.log('[DEBUG] Request successful', { status: response.status });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:59',message:'fetchVideo success',data:{status:response.status,hasVideo:!!response.data},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setVideo(response.data);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:173',message:'Video data received',data:{videoId:response.data.video_id,url:response.data.url,urlType:typeof response.data.url,urlLength:response.data.url?.length,hasUrl:!!response.data.url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      setProgress(response.data.watch_progress || 0);
      const completeStatus = response.data.is_complete === 1;
      setIsComplete(completeStatus);
      initialIsComplete.current = completeStatus; // Store initial status
      
      // Initialize both from database to restore progress
      maxTimeWatched.current = response.data.watch_time || 0;
      lastUpdateTime.current = response.data.watch_time || 0;
    } catch (error) {
      console.error('[DEBUG] Failed to fetch video:', error);
      console.error('[DEBUG] Error details:', { 
        hasResponse: !!error.response, 
        status: error.response?.status, 
        statusText: error.response?.statusText,
        errorMsg: error.response?.data?.error,
        errorMessage: error.message,
        requestMade: !!error.request 
      });
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:69',message:'fetchVideo error',data:{hasResponse:!!error.response,status:error.response?.status,statusText:error.response?.statusText,errorMsg:error.response?.data?.error,errorMessage:error.message,requestMade:!!error.request},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
      // #endregion
      
      let errorMessage = 'ไม่สามารถโหลดวิดีโอได้';
      const status = error.response?.status;
      const serverErrorMsg = error.response?.data?.error;
      
      // Store error data for rendering
      if (error.response?.data) {
        setErrorData(error.response.data);
      }
      
      // Handle different error types
      if (status === 401) {
        // Authentication error - token missing or invalid
        errorMessage = serverErrorMsg || 'กรุณาเข้าสู่ระบบก่อนดูวิดีโอ';
        // Clear invalid token
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        // Redirect to login after showing error
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (status === 403) {
        // Check if it's a pre-test requirement error
        const errorData = error.response.data;
        if (errorData?.requires_pretest) {
          errorMessage = serverErrorMsg || 'กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ';
          const moduleId = errorData?.module_id;
          if (moduleId) {
            setTimeout(() => {
              navigate(`/module/${moduleId}`);
            }, 2000);
          }
        } else if (errorData?.requires_previous_video) {
          // Check if previous video needs to be completed
          errorMessage = serverErrorMsg || 'กรุณาดูวิดีโอก่อนหน้านี้ให้ครบ 100% ก่อนดูวิดีโอนี้';
          const moduleId = errorData?.module_id;
          if (moduleId) {
            setTimeout(() => {
              navigate(`/module/${moduleId}`);
            }, 2000);
          }
        } else if (serverErrorMsg === 'Access token required' || 
                   serverErrorMsg === 'Invalid or expired token' ||
                   serverErrorMsg?.includes('token')) {
          // Token-related 403 error
          errorMessage = 'กรุณาเข้าสู่ระบบก่อนดูวิดีโอ';
          localStorage.removeItem('token');
          delete axios.defaults.headers.common['Authorization'];
          setTimeout(() => {
            navigate('/login');
          }, 2000);
        } else {
          // Other 403 errors - use server message
          errorMessage = serverErrorMsg || errorMessage;
        }
      } else if (status === 404) {
        errorMessage = serverErrorMsg || 'ไม่พบวิดีโอ';
      } else if (serverErrorMsg) {
        errorMessage = serverErrorMsg;
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต';
      } else {
        // Other errors
        errorMessage = error.message || 'ไม่สามารถโหลดวิดีโอได้';
      }
      
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (forceUpdate = false) => {
    if (!video || !videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const previousTime = lastUpdateTime.current;
    
    if (duration > 0) {
      // Check if this is natural playback (time increases gradually)
      const timeDiff = currentTime - previousTime;
      const isNaturalPlayback = !isSeeking.current && (timeDiff >= 0 && timeDiff <= 1.5); // Allow up to 1.5s forward naturally
      
      // STRICT SEEKING CHECK: Prevent seeking forward beyond maxTimeWatched
      if (currentTime > maxTimeWatched.current + 1.5) {
        // Force snap back immediately
        videoRef.current.currentTime = maxTimeWatched.current;
        showToast('ไม่อนุญาตให้ลากวิดีโอเพื่อข้ามเนื้อหา กรุณาดูวิดีโอจนจบตามลำดับ', 'warning');
        return;
      }
      
      // Update maxTimeWatched ONLY during natural playback
      if (isNaturalPlayback && currentTime > maxTimeWatched.current) {
        maxTimeWatched.current = currentTime;
      }
      
      // Update lastUpdateTime for next check
      lastUpdateTime.current = currentTime;
      
      // Calculate progress based on maxTimeWatched
      const currentProgress = (maxTimeWatched.current / duration) * 100;
      
      // Update to server every 5 seconds to reduce load
      const shouldUpdate = forceUpdate || Math.floor(currentTime) % 5 === 0;
      
      if (shouldUpdate && isNaturalPlayback) {
        try {
          await axios.post(`${API_URL}/videos/progress`, {
            video_id: videoId,
            watch_time: currentTime,
            is_complete: currentProgress >= 95 ? 1 : 0,
          });
          // Update local state less frequently to avoid re-renders
          if (forceUpdate) {
            setVideo(prev => prev ? { ...prev, watch_time: currentTime } : prev);
          }
        } catch (error) {
          console.error('Failed to update progress:', error);
          // Check if error is about previous video requirement
          if (error.response?.status === 403 && error.response?.data?.requires_previous_video) {
            const errorMessage = error.response.data.error || 'กรุณาดูวิดีโอก่อนหน้านี้ให้ครบ 100% ก่อนดูวิดีโอนี้';
            showToast(errorMessage, 'error');
            const moduleId = error.response.data?.module_id;
            if (moduleId) {
              setTimeout(() => {
                navigate(`/module/${moduleId}`);
              }, 2000);
            }
          }
        }
      }
      
      // Mark as complete if watched 95% or more
      if (currentProgress >= 95 && !isComplete) {
        setIsComplete(true);
        try {
          await axios.post(`${API_URL}/videos/progress`, {
            video_id: videoId,
            watch_time: duration,
            is_complete: 1,
          });
        } catch (error) {
          console.error('Failed to mark as complete:', error);
          // Check if error is about previous video requirement
          if (error.response?.status === 403 && error.response?.data?.requires_previous_video) {
            const errorMessage = error.response.data.error || 'กรุณาดูวิดีโอก่อนหน้านี้ให้ครบ 100% ก่อนดูวิดีโอนี้';
            showToast(errorMessage, 'error');
            const moduleId = error.response.data?.module_id;
            if (moduleId) {
              setTimeout(() => {
                navigate(`/module/${moduleId}`);
              }, 2000);
            }
          }
        }
      }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration > 0) {
      const currentTime = videoRef.current.currentTime;
      const duration = videoRef.current.duration;
      
      // Strict check in timeupdate for immediate snapback
      if (currentTime > maxTimeWatched.current + 1.5) {
        videoRef.current.currentTime = maxTimeWatched.current;
        return;
      }

      // Update UI progress bar based on maxTimeWatched to reflect true progress
      const currentProgress = (maxTimeWatched.current / duration) * 100;
      setProgress(currentProgress);
    }
    
    // Call updateProgress for server sync and natural playback logic
    updateProgress();
  };

  const handleSeeked = () => {
    isSeeking.current = false;
    if (videoRef.current) {
      const currentTime = videoRef.current.currentTime;
      if (currentTime > maxTimeWatched.current + 1) {
        videoRef.current.currentTime = maxTimeWatched.current;
        showToast('ห้ามลากวิดีโอเพื่อข้ามเนื้อหา', 'warning');
      } else {
        lastUpdateTime.current = currentTime;
      }
    }
    updateProgress(true);
  };

  const handleSeeking = () => {
    isSeeking.current = true;
    if (videoRef.current) {
      const targetTime = videoRef.current.currentTime;
      if (targetTime > maxTimeWatched.current + 0.5) {
        videoRef.current.currentTime = maxTimeWatched.current;
      }
    }
  };

  const handleVideoEnded = async () => {
    // Mark video as complete if not already complete
    if (!isComplete) {
      setIsComplete(true);
      try {
        await axios.post(`${API_URL}/videos/progress`, {
          video_id: videoId,
          watch_time: videoRef.current?.duration || 0,
          is_complete: 1,
        });
        // Update video state
        setVideo(prev => prev ? { ...prev, is_complete: 1, watch_time: videoRef.current?.duration || 0 } : prev);
      } catch (error) {
        console.error('Failed to mark video as complete:', error);
      }
    }

    // E-LEARNING FLOW: Always navigate to quiz when video ends
    // Flow: Video 1 → Quiz 1 → Video 2 → Quiz 2 → Complete
    try {
      const currentVideoOrder = video.order_index || 1;
      // Fetch quiz based on video order_index
      const response = await axios.get(`${API_URL}/quizzes/module/${video.module_id}?orderIndex=${currentVideoOrder}`);
      const quiz = response.data;
      
      if (quiz && quiz.quiz_id) {
        if (currentVideoOrder === 1) {
          showToast('วิดีโอที่ 1 จบแล้ว กำลังไปหน้าแบบทดสอบที่ 1...', 'success');
        } else {
          showToast('วิดีโอที่ 2 จบแล้ว กำลังไปหน้าแบบทดสอบที่ 2 (แบบทดสอบสุดท้าย)...', 'success');
        }
        setTimeout(() => {
          navigate(`/quiz/${quiz.quiz_id}`);
        }, 1500);
      } else {
        showToast('วิดีโอจบแล้ว แต่ไม่พบแบบทดสอบ', 'info');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        showToast('วิดีโอจบแล้ว แต่ยังไม่มีแบบทดสอบ', 'info');
      } else {
        console.error('Failed to fetch quiz:', error);
        showToast('วิดีโอจบแล้ว แต่ไม่สามารถโหลดแบบทดสอบได้', 'warning');
      }
    }
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <CardSkeleton />
        <div className="mt-6">
          <div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (error && !video) {
    const moduleId = errorData?.module_id;
    const requiresPretest = errorData?.requires_pretest;
    
    // #region agent log
    console.log('[DEBUG] Rendering error page', { error, errorData, moduleId, requiresPretest });
    try{fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:330',message:'Rendering error page',data:{error,errorData,moduleId,requiresPretest},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});}catch(e){}
    // #endregion
    
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <FiAlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
          <p className="text-red-600 mb-4">{error}</p>
          {requiresPretest && (
            <p className="text-orange-600 mb-4 font-semibold">
              กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ
            </p>
          )}
          <div className="flex items-center justify-center space-x-4 flex-wrap gap-2">
            {moduleId ? (
              <Link
                to={`/module/${moduleId}`}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                กลับไปหน้าโมดูล
              </Link>
            ) : (
              <Link
                to="/modules"
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                กลับไปหน้าหลักสูตร
              </Link>
            )}
            <button
              onClick={fetchVideo}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <FiAlertCircle className="text-gray-400" size={48} />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">ไม่พบข้อมูลวิดีโอ</h2>
            <p className="text-gray-600 mb-6">
              วิดีโอที่คุณกำลังมองหาอาจถูกลบหรือไม่พร้อมใช้งานในขณะนี้
            </p>
            <div className="flex items-center justify-center space-x-4">
              <Link
                to="/modules"
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold inline-flex items-center space-x-2"
              >
                <FiArrowLeft size={20} />
                <span>กลับไปหน้าหลักสูตร</span>
              </Link>
              <button
                onClick={fetchVideo}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <Link
        to={`/module/${video.module_id}`}
        className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
      >
        <FiArrowLeft size={20} />
        <span>กลับไปหน้าหลักสูตร</span>
      </Link>

      {/* Video Player */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="aspect-video bg-gradient-to-br from-gray-900 to-black relative">
          {video.url ? (() => {
            const videoSrc = getVideoUrl(video.url);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:571',message:'Rendering video element',data:{originalUrl:video.url,videoSrc,hasVideoSrc:!!videoSrc,apiUrl:API_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,D'})}).catch(()=>{});
            // #endregion
            
            // Validate video URL before setting it
            if (!videoSrc) {
              console.error('[VideoPlayer] Invalid video URL:', { originalUrl: video.url, videoSrc });
              return (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <FiAlertCircle size={48} className="mb-4" />
                  <p className="text-xl font-semibold mb-2">ไม่พบ URL วิดีโอ</p>
                  <p className="text-sm opacity-75">กรุณาติดต่อผู้ดูแลระบบ</p>
                </div>
              );
            }
            
            // Validate API_URL is set correctly
            if (!API_URL || API_URL === 'http://localhost:5000/api') {
              console.error('[VideoPlayer] API_URL not configured:', { API_URL, envApiUrl: process.env.REACT_APP_API_URL });
              return (
                <div className="w-full h-full flex flex-col items-center justify-center text-white">
                  <FiAlertCircle size={48} className="mb-4" />
                  <p className="text-xl font-semibold mb-2">การตั้งค่า API ไม่ถูกต้อง</p>
                  <p className="text-sm opacity-75">กรุณาตรวจสอบ environment variables</p>
                </div>
              );
            }
            
            return (
              <video
                ref={videoRef}
                src={videoSrc}
                controls
                autoPlay
                muted
                controlsList="nodownload noplaybackrate"
                disablePictureInPicture
                onContextMenu={(e) => e.preventDefault()}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onSeeking={handleSeeking}
                onSeeked={handleSeeked}
                onEnded={handleVideoEnded}
              onError={(e) => {
                const videoElement = videoRef.current;
                const error = videoElement?.error;
                const videoUrl = getVideoUrl(video.url);
                
                const errorData = {
                  event: e,
                  errorCode: error?.code,
                  errorMessage: error?.message,
                  videoUrl: videoUrl,
                  serverUrl: SERVER_URL,
                  originalUrl: video.url,
                  networkState: videoElement?.networkState,
                  readyState: videoElement?.readyState,
                  videoSrc: videoElement?.src,
                  videoCurrentSrc: videoElement?.currentSrc,
                  videoElement: videoElement ? {
                    src: videoElement.src,
                    currentSrc: videoElement.currentSrc,
                    networkState: videoElement.networkState,
                    readyState: videoElement.readyState,
                    error: error ? {
                      code: error.code,
                      message: error.message
                    } : null
                  } : null
                };
                
                console.error('[VideoPlayer] Video load error:', errorData);
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:586',message:'Video onError triggered',data:errorData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A,B,C,D,E'})}).catch(()=>{});
                // #endregion
                
                // Try to fetch the video URL to check if it exists
                if (videoUrl) {
                  const token = localStorage.getItem('token');
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:617',message:'Checking video URL accessibility',data:{videoUrl,hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
                  // #endregion
                  fetch(videoUrl, { 
                    method: 'HEAD',
                    headers: token ? {
                      'Authorization': `Bearer ${token}`
                    } : {}
                  })
                    .then(response => {
                      const checkData = {
                        url: videoUrl,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        contentType: response.headers.get('content-type'),
                        contentLength: response.headers.get('content-length'),
                        acceptRanges: response.headers.get('accept-ranges')
                      };
                      console.log('[VideoPlayer] Video URL check:', checkData);
                      
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:624',message:'Video URL HEAD response',data:checkData,timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B,C'})}).catch(()=>{});
                      // #endregion
                      
                      // If 401 or 403, token might be invalid
                      if (response.status === 401 || response.status === 403) {
                        console.error('[VideoPlayer] Authentication failed:', {
                          status: response.status,
                          statusText: response.statusText,
                          hasToken: !!token,
                          tokenLength: token?.length
                        });
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:635',message:'Authentication failed in HEAD check',data:{status:response.status,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                        // #endregion
                      }
                      
                      // If 404, video file might not exist
                      if (response.status === 404) {
                        console.error('[VideoPlayer] Video file not found:', {
                          url: videoUrl,
                          originalUrl: video.url,
                          filename: videoUrl.split('/').pop()
                        });
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:644',message:'Video file 404 in HEAD check',data:{url:videoUrl,originalUrl:video.url,filename:videoUrl.split('/').pop()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
                        // #endregion
                      }
                    })
                    .catch(err => {
                      console.error('[VideoPlayer] Video URL fetch error:', {
                        url: videoUrl,
                        error: err.message,
                        stack: err.stack
                      });
                      // #region agent log
                      fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:653',message:'Video URL fetch error',data:{url:videoUrl,error:err.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D,E'})}).catch(()=>{});
                      // #endregion
                    });
                } else {
                  console.error('[VideoPlayer] No video URL generated!', {
                    originalUrl: video.url,
                    video: video
                  });
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:660',message:'No video URL generated',data:{originalUrl:video.url,hasVideo:!!video},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                  // #endregion
                }
                
                // #region agent log
                fetch('http://127.0.0.1:7242/ingest/d6554544-7153-48cc-853b-110e134d2f3b',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'VideoPlayer.js:702',message:'Setting error message',data:{errorCode:error?.code,errorMessage:error?.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
                // #endregion
                
                let errorMessage = 'ไม่สามารถโหลดวิดีโอได้';
                if (error) {
                  switch (error.code) {
                    case 1: // MEDIA_ERR_ABORTED
                      errorMessage = 'การโหลดวิดีโอถูกยกเลิก';
                      break;
                    case 2: // MEDIA_ERR_NETWORK
                      errorMessage = 'เกิดข้อผิดพลาดจากเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ';
                      break;
                    case 3: // MEDIA_ERR_DECODE
                      errorMessage = 'ไม่สามารถถอดรหัสวิดีโอได้';
                      break;
                    case 4: // MEDIA_ERR_SRC_NOT_SUPPORTED
                      errorMessage = 'รูปแบบวิดีโอไม่รองรับ หรือ URL ไม่ถูกต้อง';
                      break;
                    default:
                      errorMessage = `ไม่สามารถโหลดวิดีโอได้ (Error ${error.code})`;
                  }
                }
                
                setError(errorMessage);
                showToast(errorMessage, 'error');
              }}
              onLoadedMetadata={async () => {
                // ... update duration logic ...
                if (videoRef.current && videoRef.current.duration > 0) {
                  const actualDuration = Math.floor(videoRef.current.duration);
                  const dbDuration = video.duration || 0;
                  if (Math.abs(actualDuration - dbDuration) > 1) {
                    try {
                      await axios.post(`${API_URL}/videos/duration`, {
                        video_id: videoId,
                        duration: actualDuration,
                      });
                      setVideo(prev => prev ? { ...prev, duration: actualDuration } : prev);
                    } catch (error) {
                      console.error('Failed to update duration:', error);
                    }
                  }
                }
                
                // Restore position strictly from maxTimeWatched
                if (videoRef.current && !hasRestoredPosition.current) {
                  const isFinished = video.is_complete === 1;
                  
                  if (isFinished) {
                    // If finished, start over from 0 as requested: "ถ้าดูจบแล้วให้วนกลับไปเล่นใหม่อีกรอบ"
                    videoRef.current.currentTime = 0;
                    lastUpdateTime.current = 0;
                    // If already complete, we allow seeking anywhere
                    maxTimeWatched.current = videoRef.current.duration || 999999;
                  } else {
                    // If not finished, continue from where left off: "ถ้าดูไม่จบให้เล่นต่อจากที่ดูค้างไว้"
                    videoRef.current.currentTime = video.watch_time || 0;
                    lastUpdateTime.current = video.watch_time || 0;
                    maxTimeWatched.current = video.watch_time || 0;
                  }
                  hasRestoredPosition.current = true;
                  
                  // Auto-play video after restoring position
                  videoRef.current.play().then(() => {
                    // Unmute after video starts playing
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                    }
                  }).catch((error) => {
                    console.error('Failed to auto-play video:', error);
                    // If autoplay fails, unmute anyway so user can manually play
                    if (videoRef.current) {
                      videoRef.current.muted = false;
                    }
                  });
                }
              }}
                style={{
                  pointerEvents: 'auto'
                }}
              />
            );
          })() : (
            <div className="w-full h-full flex flex-col items-center justify-center text-white">
              <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mb-4">
                <FiAlertCircle size={40} />
              </div>
              <p className="text-xl font-semibold mb-2">วิดีโอยังไม่พร้อม</p>
              <p className="text-gray-400 text-sm">วิดีโอนี้กำลังอยู่ในระหว่างการอัปโหลด</p>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-800 mb-3">{video.title}</h1>
            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center space-x-2 bg-gray-100 px-3 py-1.5 rounded-lg">
                <FiClock size={16} className="text-blue-600" />
                <span className="font-medium">ระยะเวลา: {Math.floor((video.duration || 0) / 60)} นาที</span>
              </span>
              {video.module_title && (
                <span className="flex items-center space-x-2 bg-blue-50 px-3 py-1.5 rounded-lg">
                  <FiBook size={16} className="text-blue-600" />
                  <span className="font-medium text-blue-700">{video.module_title}</span>
                </span>
              )}
            </div>
          </div>
          {isComplete && (
            <div className="flex items-center space-x-2 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <FiCheckCircle size={24} className="text-green-600" />
              <span className="font-semibold text-green-700">ดูครบแล้ว</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">ความคืบหน้าการดู</span>
            <span className="text-sm font-bold text-blue-600">{Math.floor(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

        {/* Description */}
        {video.description && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">รายละเอียด</h3>
            <p className="text-gray-700 leading-relaxed whitespace-pre-line">{video.description}</p>
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

export default VideoPlayer;

