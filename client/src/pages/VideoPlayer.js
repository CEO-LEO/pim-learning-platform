import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiCheckCircle, FiClock, FiArrowLeft, FiAlertCircle, FiBook } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

// Always use production Railway backend URL as fallback
const PRODUCTION_API_URL = 'https://pim-learning-platform-production.up.railway.app/api';
const API_URL = process.env.REACT_APP_API_URL || PRODUCTION_API_URL;

// Use API_URL base for video URLs if SERVER_URL is not set
const getServerUrl = () => {
  if (process.env.REACT_APP_SERVER_URL) {
    return process.env.REACT_APP_SERVER_URL;
  }
  // Extract base URL from API_URL (remove /api)
  if (API_URL.includes('/api')) {
    return API_URL.replace('/api', '');
  }
  // Fallback to production server
  return 'https://pim-learning-platform-production.up.railway.app';
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
    if (!url) {
      console.error('[VideoPlayer] No video URL provided');
      return null;
    }
    
    // Extract filename from URL (handle both full URLs and relative paths)
    let filename = url;
    if (url.includes('/')) {
      filename = url.split('/').pop();
    }
    
    // Always use API_URL for video streaming (ignore URL from database if it's localhost)
    // This ensures videos work in production when REACT_APP_API_URL is set
    const dbUrl = url;
    const isLocalhostUrl = dbUrl && (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1'));
    
    // If database URL is localhost but we're in production (have REACT_APP_API_URL), use API_URL instead
    if (isLocalhostUrl && process.env.REACT_APP_API_URL && process.env.REACT_APP_API_URL !== 'http://localhost:5000/api') {
      console.log('[VideoPlayer] Database URL is localhost, but production API_URL is set. Using API_URL instead.');
    }
    
    // If already a full production URL (not localhost), use it
    if (url.startsWith('http://') || url.startsWith('https://')) {
      if (!isLocalhostUrl) {
        console.log('[VideoPlayer] Using full production URL from database:', url);
        return url;
      }
      // If it's localhost URL but we have production API_URL, fall through to use API_URL
    }
    
    // Use video streaming route with authentication
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
      tokenLength: token?.length,
      isLocalhostUrl,
      usingApiUrl: true
    };
    console.log('[VideoPlayer] Constructed URL:', debugInfo);
    
    // Alert if API_URL is missing (for debugging)
    if (!API_URL || API_URL === 'http://localhost:5000/api') {
      console.warn('[VideoPlayer] ⚠️ API_URL is missing or using default!', {
        API_URL,
        REACT_APP_API_URL: process.env.REACT_APP_API_URL,
        REACT_APP_SERVER_URL: process.env.REACT_APP_SERVER_URL
      });
    }
    
    return fullUrl;
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
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
      const token = localStorage.getItem('token');
      console.log('[DEBUG] fetchVideo called', { 
        videoId, 
        hasToken: !!token,
        tokenLength: token?.length,
        tokenPreview: token ? `${token.substring(0, 20)}...` : 'none'
      });
      
      if (!token) {
        const errorMsg = 'กรุณาเข้าสู่ระบบก่อนดูวิดีโอ';
        setError(errorMsg);
        showToast(errorMsg, 'error');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
        return;
      }
      
      setError(null);
      setErrorData(null);
      
      // Update axios defaults and also include in request config for safety
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const config = { headers: { Authorization: `Bearer ${token}` } };
      console.log('[DEBUG] Making request', { url: `${API_URL}/videos/${videoId}`, hasToken: !!token });
      
      const response = await axios.get(`${API_URL}/videos/${videoId}`, config);
      console.log('[DEBUG] Request successful', { 
        status: response.status,
        videoData: {
          video_id: response.data.video_id,
          title: response.data.title,
          url: response.data.url,
          hasUrl: !!response.data.url,
          urlLength: response.data.url?.length
        }
      });
      setVideo(response.data);
      
      // Validate video URL exists before setting video
      if (!response.data.url || response.data.url.trim() === '') {
        const errorMsg = 'วิดีโอนี้ยังไม่มีไฟล์วิดีโอ กรุณาติดต่อผู้ดูแลระบบ';
        console.error('[VideoPlayer] Video URL is empty or missing:', {
          video_id: response.data.video_id,
          title: response.data.title,
          url: response.data.url
        });
        setError(errorMsg);
        setLoading(false);
        showToast(errorMsg, 'error');
        return;
      }
      
      if (response.data.url) {
        const videoSrc = getVideoUrl(response.data.url);
        if (videoSrc) {
          // Pre-flight check: verify video URL is accessible
          const token = localStorage.getItem('token');
          try {
            console.log('[VideoPlayer] Pre-flight HEAD request to:', videoSrc);
            const headResponse = await fetch(videoSrc, {
              method: 'HEAD',
              headers: token ? { 
                'Authorization': `Bearer ${token}`,
                'Accept': 'video/*'
              } : {
                'Accept': 'video/*'
              }
            });
            
            console.log('[VideoPlayer] HEAD response:', {
              status: headResponse.status,
              statusText: headResponse.statusText,
              contentType: headResponse.headers.get('content-type'),
              contentLength: headResponse.headers.get('content-length'),
              url: headResponse.url,
              headers: Object.fromEntries(headResponse.headers.entries())
            });
            
            if (!headResponse.ok) {
              let errorText = '';
              try {
                errorText = await headResponse.text();
              } catch (e) {
                errorText = 'Could not read error response';
              }
              
              let errorMessage = 'ไม่สามารถโหลดวิดีโอได้';
              
              if (headResponse.status === 404) {
                // Try to parse error response for more details
                let errorDetails = '';
                try {
                  const errorJson = JSON.parse(errorText);
                  if (errorJson.troubleshooting) {
                    errorDetails = `\n\nสาเหตุที่เป็นไปได้:\n- ${errorJson.troubleshooting.checkGitLFS}\n- ${errorJson.troubleshooting.checkPath}\n- ${errorJson.troubleshooting.checkRailwayVolume}`;
                  }
                  if (errorJson.filename) {
                    errorDetails += `\n\nไฟล์ที่ต้องการ: ${errorJson.filename}`;
                  }
                } catch (e) {
                  // Not JSON, ignore
                }
                errorMessage = `ไม่พบไฟล์วิดีโอบนเซิร์ฟเวอร์${errorDetails}\n\nกรุณาตรวจสอบ:\n1. Railway build logs (Git LFS pull status)\n2. /api/health endpoint (videoFiles.hasFiles)\n3. ใช้ Railway Volumes หรือ external storage แทน Git LFS`;
              } else if (headResponse.status === 401 || headResponse.status === 403) {
                errorMessage = 'การยืนยันตัวตนล้มเหลว กรุณาเข้าสู่ระบบใหม่';
              } else {
                errorMessage = `ไม่สามารถโหลดวิดีโอได้ (HTTP ${headResponse.status})`;
              }
              
              const errorDetails = {
                status: headResponse.status,
                statusText: headResponse.statusText,
                errorText,
                videoSrc,
                contentType: headResponse.headers.get('content-type'),
                url: headResponse.url
              };
              
              console.error('[VideoPlayer] Pre-flight check failed:', errorDetails);
              
              setError(errorMessage);
              setLoading(false);
              showToast(errorMessage, 'error');
              return;
            }
            
            // Check content type
            const contentType = headResponse.headers.get('content-type');
            console.log('[VideoPlayer] HEAD response content-type:', contentType);
            
            // If status is OK but content-type is not video, it might be an error response
            if (headResponse.ok && contentType && !contentType.startsWith('video/')) {
              console.error('[VideoPlayer] Invalid content type:', contentType, {
                status: headResponse.status,
                url: headResponse.url,
                headers: Object.fromEntries(headResponse.headers.entries())
              });
              
              // If it's a JSON error response, try to parse it for better error message
              if (contentType.includes('application/json')) {
                try {
                  // For HEAD request, we can't read body, so we'll continue and let video element handle it
                  console.warn('[VideoPlayer] Got JSON response in HEAD request, will let video element handle error');
                } catch (e) {
                  // If can't parse, continue with generic error
                }
              }
              
              // Don't block here - let video element try to load and show its own error
              console.warn('[VideoPlayer] Content-type check failed but continuing to let video element handle');
            }
            
            // If no content-type header, log warning but continue (some servers don't send it in HEAD)
            if (!contentType) {
              console.warn('[VideoPlayer] No content-type header in HEAD response, continuing anyway');
            }
            
            // If HEAD request succeeds, continue to load video
            console.log('[VideoPlayer] Pre-flight check passed, video should load');
          } catch (err) {
            console.error('[VideoPlayer] Pre-flight check error:', err);
            
            // If it's a network error (CORS, connection refused, etc.), show specific error
            if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('CORS')) {
              setError('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์วิดีโอได้ กรุณาตรวจสอบการตั้งค่า API_URL');
              setLoading(false);
              showToast('ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์วิดีโอได้', 'error');
              return;
            }
            
            // For other errors, continue anyway - let video element handle the error
            console.warn('[VideoPlayer] Pre-flight check failed but continuing:', err.message);
          }
        }
      }
      
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
        data: error.response?.data, 
        errorMsg: error.response?.data?.error,
        errorMessage: error.message,
        requestMade: !!error.request 
      });
      
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-6xl mx-auto px-4">
          <CardSkeleton />
          <div className="mt-6">
            <div className="h-96 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 rounded-2xl animate-pulse shadow-xl"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !video) {
    const moduleId = errorData?.module_id;
    const requiresPretest = errorData?.requires_pretest;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center px-4" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm border-2 border-red-200 rounded-2xl shadow-2xl p-12 text-center">
            <div className="w-24 h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <FiAlertCircle className="text-white" size={48} />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-red-700 text-lg mb-6 font-medium">{error}</p>
            {requiresPretest && (
              <div className="bg-orange-100 border-2 border-orange-300 rounded-xl p-4 mb-6">
                <p className="text-orange-700 font-bold text-lg">
                  กรุณาทำแบบทดสอบก่อนเรียน (Pre-test) ให้เสร็จก่อนเข้าชมวิดีโอ
                </p>
              </div>
            )}
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-3">
              {moduleId ? (
                <Link
                  to={`/module/${moduleId}`}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าโมดูล
                </Link>
              ) : (
                <Link
                  to="/modules"
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl font-semibold hover:from-gray-700 hover:to-gray-800 transition-all shadow-lg hover:shadow-xl hover:scale-105"
                >
                  กลับไปหน้าหลักสูตร
                </Link>
              )}
              <button
                onClick={fetchVideo}
                className="px-8 py-3 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-semibold hover:from-red-700 hover:to-orange-700 transition-all shadow-lg hover:shadow-xl hover:scale-105"
              >
                ลองใหม่อีกครั้ง
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center px-4" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="max-w-2xl w-full">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-12 text-center border border-white/50">
            <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
              <FiAlertCircle className="text-gray-400" size={64} />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent mb-4">ไม่พบข้อมูลวิดีโอ</h2>
            <p className="text-gray-600 text-lg mb-8">
              วิดีโอที่คุณกำลังมองหาอาจถูกลบหรือไม่พร้อมใช้งานในขณะนี้
            </p>
            <div className="flex items-center justify-center space-x-4 flex-wrap gap-3">
              <Link
                to="/modules"
                className="px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-cyan-700 transition-all shadow-lg hover:shadow-xl inline-flex items-center space-x-2 hover:scale-105"
              >
                <FiArrowLeft size={20} />
                <span>กลับไปหน้าหลักสูตร</span>
              </Link>
              <button
                onClick={fetchVideo}
                className="px-8 py-3 bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 rounded-xl font-semibold hover:from-gray-300 hover:to-gray-400 transition-all shadow-md hover:shadow-lg hover:scale-105"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 pb-12" style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="max-w-6xl mx-auto px-4 space-y-6">
        <Link
          to={`/module/${video.module_id}`}
          className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-semibold transition-all hover:translate-x-1 group"
        >
          <FiArrowLeft size={20} className="transform group-hover:-translate-x-1 transition-transform" />
          <span>กลับไปหน้าหลักสูตร</span>
        </Link>

        {/* Video Player */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/50 hover:shadow-3xl transition-all duration-300">
          <div className="aspect-video bg-gradient-to-br from-gray-900 via-gray-800 to-black relative">
          {video.url ? (() => {
            const videoSrc = getVideoUrl(video.url);
            
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
                  API_URL: API_URL,
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
                
                // Set error state for UI
                if (error?.code === 4) {
                  setError('รูปแบบวิดีโอไม่รองรับ หรือ URL ไม่ถูกต้อง');
                } else if (error?.code === 2) {
                  setError('เกิดข้อผิดพลาดจากเครือข่าย กรุณาตรวจสอบการเชื่อมต่อ');
                } else {
                  setError('ไม่สามารถโหลดวิดีโอได้');
                }
                setLoading(false);
                
                // Try to fetch the video URL to check if it exists
                if (videoUrl) {
                  const token = localStorage.getItem('token');
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
                      
                      // If 401 or 403, token might be invalid
                      if (response.status === 401 || response.status === 403) {
                        console.error('[VideoPlayer] Authentication failed:', {
                          status: response.status,
                          statusText: response.statusText,
                          hasToken: !!token,
                          tokenLength: token?.length
                        });
                      }
                      
                      // If 404, video file might not exist
                      if (response.status === 404) {
                        console.error('[VideoPlayer] Video file not found:', {
                          url: videoUrl,
                          originalUrl: video.url,
                          filename: videoUrl.split('/').pop()
                        });
                      }
                    })
                    .catch(err => {
                      console.error('[VideoPlayer] Video URL fetch error:', {
                        url: videoUrl,
                        error: err.message,
                        stack: err.stack
                      });
                    });
                } else {
                  console.error('[VideoPlayer] No video URL generated!', {
                    originalUrl: video.url,
                    video: video
                  });
                }
                
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
        <div className="bg-gradient-to-br from-white to-blue-50/30 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-white/50 hover:shadow-2xl transition-all duration-300">
          <div className="flex items-start justify-between mb-6 flex-wrap gap-4">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-700 to-cyan-600 bg-clip-text text-transparent mb-4">{video.title}</h1>
              <div className="flex items-center flex-wrap gap-3 text-sm">
                <span className="flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105">
                  <FiClock size={16} />
                  <span className="font-semibold">ระยะเวลา: {Math.floor((video.duration || 0) / 60)} นาที</span>
                </span>
                {video.module_title && (
                  <span className="flex items-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-105">
                    <FiBook size={16} />
                    <span className="font-semibold">{video.module_title}</span>
                  </span>
                )}
              </div>
            </div>
            {isComplete && (
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all hover:scale-105">
                <FiCheckCircle size={24} />
                <span className="font-bold text-lg">ดูครบแล้ว</span>
              </div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-gray-700">ความคืบหน้าการดู</span>
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{Math.floor(progress)}%</span>
            </div>
            <div className="relative w-full bg-gradient-to-r from-gray-200 to-gray-100 rounded-full h-4 overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-blue-500 via-cyan-500 to-blue-500 h-4 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          {/* Description */}
          {video.description && (
            <div className="mt-8 pt-6 border-t border-gradient-to-r from-blue-200 to-cyan-200">
              <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">รายละเอียด</h3>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{video.description}</p>
            </div>
          )}
        </div>
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

