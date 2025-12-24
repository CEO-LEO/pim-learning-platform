'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Video, FileQuestion, Settings } from 'lucide-react';
import Link from 'next/link';

interface Course {
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration: number | null;
  is_active: boolean;
  order_index: number;
}

interface Quiz {
  quiz_id: string;
  type: string;
  title: string;
  passing_score: number;
  time_limit: number | null;
}

export default function CourseEditPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = params.courseId as string;
  const { user, isAuthenticated } = useAuthStore();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [preTest, setPreTest] = useState<Quiz | null>(null);
  const [postTest, setPostTest] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    video_url: '',
    duration: '',
    is_active: true,
    order_index: 0,
  });
  
  const [preTestData, setPreTestData] = useState({
    passing_score: 70,
    time_limit: '',
  });
  
  const [postTestData, setPostTestData] = useState({
    passing_score: 70,
    time_limit: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    if (courseId === 'new') {
      setLoading(false);
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
        .single();

      if (courseError) throw courseError;

      setCourse(courseData);
      setFormData({
        title: courseData.title || '',
        description: courseData.description || '',
        video_url: courseData.video_url || '',
        duration: courseData.duration?.toString() || '',
        is_active: courseData.is_active,
        order_index: courseData.order_index || 0,
      });

      // Fetch quizzes
      const { data: quizzes, error: quizzesError } = await supabase
        .from('quizzes')
        .select('*')
        .eq('course_id', courseId);

      if (!quizzesError && quizzes) {
        const pre = quizzes.find((q) => q.type === 'pre-test');
        const post = quizzes.find((q) => q.type === 'post-test');
        
        if (pre) {
          setPreTest(pre);
          setPreTestData({
            passing_score: pre.passing_score || 70,
            time_limit: pre.time_limit?.toString() || '',
          });
        }
        
        if (post) {
          setPostTest(post);
          setPostTestData({
            passing_score: post.passing_score || 70,
            time_limit: post.time_limit?.toString() || '',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setMessage({ type: 'error', text: 'กรุณากรอกชื่อหลักสูตร' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      if (courseId === 'new') {
        // Create new course
        const { data: newCourse, error: courseError } = await supabase
          .from('courses')
          .insert({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url || null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            is_active: formData.is_active,
            order_index: formData.order_index || 0,
          })
          .select()
          .single();

        if (courseError) throw courseError;

        // Create quizzes
        const newCourseId = newCourse.course_id;

        // Create pre-test
        await supabase.from('quizzes').insert({
          course_id: newCourseId,
          type: 'pre-test',
          title: `Pre-test: ${formData.title}`,
          passing_score: preTestData.passing_score,
          time_limit: preTestData.time_limit ? parseInt(preTestData.time_limit) : null,
          is_active: true,
        });

        // Create post-test
        await supabase.from('quizzes').insert({
          course_id: newCourseId,
          type: 'post-test',
          title: `Post-test: ${formData.title}`,
          passing_score: postTestData.passing_score,
          time_limit: postTestData.time_limit ? parseInt(postTestData.time_limit) : null,
          is_active: true,
        });

        setMessage({ type: 'success', text: 'สร้างหลักสูตรสำเร็จ' });
        setTimeout(() => {
          router.push('/admin/courses');
        }, 1500);
      } else {
        // Update existing course
        const { error: courseError } = await supabase
          .from('courses')
          .update({
            title: formData.title,
            description: formData.description || null,
            video_url: formData.video_url || null,
            duration: formData.duration ? parseInt(formData.duration) : null,
            is_active: formData.is_active,
            order_index: formData.order_index || 0,
          })
          .eq('course_id', courseId);

        if (courseError) throw courseError;

        // Update quizzes
        if (preTest) {
          await supabase
            .from('quizzes')
            .update({
              passing_score: preTestData.passing_score,
              time_limit: preTestData.time_limit ? parseInt(preTestData.time_limit) : null,
            })
            .eq('quiz_id', preTest.quiz_id);
        }

        if (postTest) {
          await supabase
            .from('quizzes')
            .update({
              passing_score: postTestData.passing_score,
              time_limit: postTestData.time_limit ? parseInt(postTestData.time_limit) : null,
            })
            .eq('quiz_id', postTest.quiz_id);
        }

        setMessage({ type: 'success', text: 'บันทึกข้อมูลสำเร็จ' });
      }
    } catch (error) {
      console.error('Error saving course:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center space-x-4">
          <Link href="/admin/courses">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              กลับ
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {courseId === 'new' ? 'สร้างหลักสูตรใหม่' : 'แก้ไขหลักสูตร'}
            </h1>
            <p className="text-gray-600 mt-1">จัดการข้อมูลหลักสูตรและตั้งค่าแบบทดสอบ</p>
          </div>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Course Information */}
        <Card>
          <CardHeader>
            <CardTitle>ข้อมูลหลักสูตร</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">ชื่อหลักสูตร *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="เช่น Store Model 102"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">คำอธิบาย</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="อธิบายรายละเอียดของหลักสูตร"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="duration">ระยะเวลา (นาที)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="60"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="order_index">ลำดับการแสดง</Label>
                <Input
                  id="order_index"
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="is_active">เปิดใช้งานหลักสูตร</Label>
            </div>
          </CardContent>
        </Card>

        {/* Video URL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Video className="h-5 w-5" />
              <span>วิดีโอการเรียน</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="video_url">URL วิดีโอ (YouTube, Vimeo, etc.)</Label>
              <Input
                id="video_url"
                type="url"
                value={formData.video_url}
                onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-sm text-gray-500">
                รองรับ YouTube, Vimeo, และ URL วิดีโออื่นๆ ที่ React Player รองรับ
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Quiz Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileQuestion className="h-5 w-5" />
              <span>ตั้งค่าแบบทดสอบ</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Pre-test Settings */}
            <div className="space-y-4 border-b pb-4">
              <h3 className="font-semibold text-lg">Pre-test (แบบทดสอบก่อนเรียน)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="pre_passing_score">เกณฑ์ผ่าน (%)</Label>
                  <Input
                    id="pre_passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={preTestData.passing_score}
                    onChange={(e) => setPreTestData({ ...preTestData, passing_score: parseInt(e.target.value) || 70 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pre_time_limit">เวลาจำกัด (นาที) - ไม่จำกัดเว้นว่าง</Label>
                  <Input
                    id="pre_time_limit"
                    type="number"
                    value={preTestData.time_limit}
                    onChange={(e) => setPreTestData({ ...preTestData, time_limit: e.target.value })}
                    placeholder="ไม่จำกัด"
                  />
                </div>
              </div>
            </div>

            {/* Post-test Settings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Post-test (แบบทดสอบหลังเรียน)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="post_passing_score">เกณฑ์ผ่าน (%)</Label>
                  <Input
                    id="post_passing_score"
                    type="number"
                    min="0"
                    max="100"
                    value={postTestData.passing_score}
                    onChange={(e) => setPostTestData({ ...postTestData, passing_score: parseInt(e.target.value) || 70 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="post_time_limit">เวลาจำกัด (นาที) - ไม่จำกัดเว้นว่าง</Label>
                  <Input
                    id="post_time_limit"
                    type="number"
                    value={postTestData.time_limit}
                    onChange={(e) => setPostTestData({ ...postTestData, time_limit: e.target.value })}
                    placeholder="ไม่จำกัด"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Link href="/admin/courses">
            <Button variant="outline">ยกเลิก</Button>
          </Link>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'กำลังบันทึก...' : 'บันทึก'}
          </Button>
        </div>
      </div>
    </div>
  );
}

