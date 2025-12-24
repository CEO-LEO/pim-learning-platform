'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Plus, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface Course {
  course_id: string;
  title: string;
  description: string | null;
  duration: number | null;
  is_active: boolean;
  order_index: number;
}

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    fetchCourses();
  }, [user, isAuthenticated, router]);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
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
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">จัดการหลักสูตร</h1>
            <p className="text-gray-600 mt-1">สร้าง แก้ไข และลบหลักสูตร</p>
          </div>
          <Link href="/admin/courses/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              สร้างหลักสูตรใหม่
            </Button>
          </Link>
        </div>

        {courses.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">ยังไม่มีหลักสูตร</p>
              <Link href="/admin/courses/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  สร้างหลักสูตรแรก
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.course_id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="flex-1">{course.title}</CardTitle>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        course.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {course.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {course.description || 'ไม่มีคำอธิบาย'}
                  </p>
                  {course.duration && (
                    <p className="text-sm text-gray-500">
                      ระยะเวลา: {course.duration} นาที
                    </p>
                  )}
                  <div className="flex space-x-2">
                    <Link href={`/admin/courses/${course.course_id}`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-4 w-4 mr-2" />
                        แก้ไข
                      </Button>
                    </Link>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        if (confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้?')) {
                          try {
                            const { error } = await supabase
                              .from('courses')
                              .delete()
                              .eq('course_id', course.course_id);
                            if (error) throw error;
                            fetchCourses();
                          } catch (error) {
                            console.error('Error deleting course:', error);
                            alert('เกิดข้อผิดพลาดในการลบหลักสูตร');
                          }
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
