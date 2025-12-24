'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ReactPlayer from 'react-player';
import { PlayCircle, CheckCircle2, Lock, AlertCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Quiz {
  quiz_id: string;
  type: string;
  title: string;
  time_limit: number | null;
  passing_score: number;
}

interface Enrollment {
  enrollment_id: string;
  status: string;
  progress_percent: number;
}

export default function LearnPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, isAuthenticated } = useAuthStore();
  
  const [course, setCourse] = useState<any>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [preTest, setPreTest] = useState<Quiz | null>(null);
  const [postTest, setPostTest] = useState<Quiz | null>(null);
  const [preTestAttempt, setPreTestAttempt] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'pretest' | 'video' | 'posttest'>('pretest');
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoWatched, setVideoWatched] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const playerRef = useRef<ReactPlayer>(null);
  const lastProgressRef = useRef(0);
  const hasSkippedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [courseId, user, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      // Fetch course
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('*')
        .eq('course_id', courseId)
        .maybeSingle();

      if (courseError) {
        console.error('Error fetching course:', courseError);
        setLoading(false);
        return;
      }

      if (!courseData) {
        setLoading(false);
        return;
      }

      setCourse(courseData);

      // Fetch enrollment
      const { data: enrollmentData, error: enrollmentError } = await supabase
        .from('enrollments')
        .select('*')
        .eq('student_id', user?.student_id)
        .eq('course_id', courseId)
        .maybeSingle();

      if (enrollmentData && !enrollmentError) {
        setEnrollment(enrollmentData);
        if (enrollmentData.status === 'completed') {
          setCurrentStep('posttest');
          setVideoWatched(true);
        } else {
          setCurrentStep('pretest');
        }
      } else {
        // If not enrolled, show message but don't redirect immediately
        // Allow user to see course info
      }

      // Use courseId directly (it's already the course_id from URL)
      const courseIdForQuiz = courseId;

      const { data: quizzes } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseIdForQuiz)
        .eq('is_active', true);

      if (quizzes) {
        const pre = quizzes.find((q) => q.type === 'pre-test');
        const post = quizzes.find((q) => q.type === 'post-test');
        setPreTest(pre || null);
        setPostTest(post || null);

        // Check pre-test attempt
        if (pre) {
          const { data: attempt, error: attemptError } = await supabase
            .from('quiz_attempts')
            .select('*')
            .eq('student_id', user?.student_id)
            .eq('quiz_id', pre.quiz_id)
            .maybeSingle();

          if (attempt && !attemptError) {
            setPreTestAttempt(attempt);
            if (attempt.status === 'pass') {
              setCurrentStep('video');
              setVideoWatched(false); // Reset video watched state
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoProgress = (state: { played: number; playedSeconds: number }) => {
    const currentProgress = state.played * 100;
    
    // Prevent skipping forward - only allow progress forward, not backward
    // Allow small backward movement (user might pause and resume)
    if (currentProgress < lastProgressRef.current - 3) {
      // User tried to skip backward significantly or forward
      if (playerRef.current) {
        const lastTime = lastProgressRef.current / 100;
        playerRef.current.seekTo(lastTime);
        hasSkippedRef.current = true;
        alert('ไม่สามารถข้ามวิดีโอได้ กรุณาดูให้ครบ');
      }
      return;
    }

    // Only update if progressing forward (or small backward due to buffering)
    if (currentProgress >= lastProgressRef.current - 1) {
      lastProgressRef.current = Math.max(lastProgressRef.current, currentProgress);
      setVideoProgress(lastProgressRef.current);
    }
  };

  const handleVideoEnd = async () => {
    setVideoWatched(true);
    
    // Update enrollment progress
    if (enrollment && user) {
      await supabase
        .from('enrollments')
        .update({
          status: 'in-progress',
          progress_percent: 100,
        })
        .eq('enrollment_id', enrollment.enrollment_id);

      // Unlock post-test
      setCurrentStep('posttest');
    }
  };

  const handleSeek = (seconds: number) => {
    // Prevent manual seeking forward
    if (playerRef.current) {
      const currentTime = playerRef.current.getCurrentTime();
      const videoDuration = playerRef.current.getDuration();
      const lastTimePercent = lastProgressRef.current / 100;
      const lastTime = lastTimePercent * videoDuration;
      
      // Only allow seeking backward or within 3 seconds of current position
      if (seconds > lastTime + 3) {
        playerRef.current.seekTo(currentTime);
        hasSkippedRef.current = true;
        alert('ไม่สามารถข้ามวิดีโอได้ กรุณาดูให้ครบ');
      } else if (seconds < lastTime) {
        // Allow backward seeking (review) - update progress
        const newProgress = (seconds / videoDuration) * 100;
        if (newProgress < lastProgressRef.current) {
          lastProgressRef.current = newProgress;
          setVideoProgress(newProgress);
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="py-12">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                ไม่พบหลักสูตร หรือคุณยังไม่ได้ลงทะเบียนหลักสูตรนี้
                <br />
                <Link href="/student/courses">
                  <Button className="mt-4">ไปที่หน้าหลักสูตร</Button>
                </Link>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if enrolled
  if (!enrollment) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                คุณยังไม่ได้ลงทะเบียนหลักสูตรนี้
                <br />
                <Link href="/student/courses">
                  <Button className="mt-4">ไปที่หน้าหลักสูตร</Button>
                </Link>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/student/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                กลับ
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">{course.title}</h1>
            <p className="text-gray-600 mt-1">{course.description}</p>
          </div>
        </div>

        {/* Progress Steps */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className={`flex items-center space-x-2 ${currentStep === 'pretest' ? 'text-green-600' : preTestAttempt ? 'text-green-600' : 'text-gray-400'}`}>
                {preTestAttempt ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Lock className="h-6 w-6" />
                )}
                <span className="font-medium">Pre-test</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full ${preTestAttempt ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: preTestAttempt ? '100%' : '0%' }}></div>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'video' ? 'text-green-600' : videoWatched ? 'text-green-600' : 'text-gray-400'}`}>
                {videoWatched ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <PlayCircle className="h-6 w-6" />
                )}
                <span className="font-medium">วิดีโอ</span>
              </div>
              <div className="flex-1 h-1 bg-gray-200 mx-4">
                <div className={`h-full ${videoWatched ? 'bg-green-600' : 'bg-gray-200'}`} style={{ width: videoWatched ? '100%' : '0%' }}></div>
              </div>
              <div className={`flex items-center space-x-2 ${currentStep === 'posttest' ? 'text-green-600' : 'text-gray-400'}`}>
                <Lock className="h-6 w-6" />
                <span className="font-medium">Post-test</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pre-test Section */}
        {(currentStep === 'pretest' || !preTestAttempt) && preTest && (
          <Card>
            <CardHeader>
              <CardTitle>Pre-test</CardTitle>
            </CardHeader>
            <CardContent>
              {preTestAttempt ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    คุณได้ทำ Pre-test แล้ว (คะแนน: {preTestAttempt.score}%)
                    {preTestAttempt.status === 'pass' ? ' - ผ่าน' : ' - ไม่ผ่าน'}
                  </AlertDescription>
                </Alert>
              ) : (
                <div>
                  <p className="mb-4">{preTest.title}</p>
                  <Button onClick={() => router.push(`/student/quiz/${preTest.quiz_id}`)}>
                    เริ่มทำ Pre-test
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Video Section */}
        {((currentStep === 'video' || (preTestAttempt && preTestAttempt.status === 'pass')) && !videoWatched) && course.video_url && enrollment && (
          <Card>
            <CardHeader>
              <CardTitle>วิดีโอการเรียน</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasSkippedRef.current && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    คุณพยายามข้ามวิดีโอ กรุณาดูให้ครบทุกส่วน
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                <ReactPlayer
                  ref={playerRef}
                  url={course.video_url}
                  width="100%"
                  height="100%"
                  style={{ position: 'absolute', top: 0, left: 0 }}
                  controls
                  onProgress={handleVideoProgress}
                  onEnded={handleVideoEnd}
                  onSeek={handleSeek}
                  config={{
                    youtube: {
                      playerVars: {
                        controls: 1,
                        disablekb: 0,
                        modestbranding: 1,
                      },
                    },
                  }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>ความคืบหน้า</span>
                  <span>{Math.round(videoProgress)}%</span>
                </div>
                <Progress value={videoProgress} />
              </div>

              {videoWatched && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    คุณดูวิดีโอครบแล้ว สามารถทำ Post-test ได้
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}

        {/* Post-test Section */}
        {videoWatched && postTest && enrollment && (
          <Card>
            <CardHeader>
              <CardTitle>Post-test</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">{postTest.title}</p>
              <Button onClick={() => router.push(`/student/quiz/${postTest.quiz_id}`)}>
                เริ่มทำ Post-test
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
