'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Calendar, CheckCircle2, Clock, PlayCircle, TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Enrollment {
  enrollment_id: string;
  status: string;
  progress_percent: number;
  course: {
    course_id: string;
    title: string;
    description: string | null;
    duration: number | null;
  };
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    inProgress: 0,
    completed: 0,
    averageProgress: 0,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchEnrollments();
  }, [user, isAuthenticated, router]);

  const fetchEnrollments = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          enrollment_id,
          status,
          progress_percent,
          course:courses!enrollments_course_id_fkey (
            course_id,
            title,
            description,
            duration
          )
        `)
        .eq('student_id', user?.student_id)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
        setEnrollments([]);
        return;
      }

      const enrollmentsData = (data || []).map((item: any) => ({
        ...item,
        course: Array.isArray(item.course) ? item.course[0] : item.course
      })) as Enrollment[];
      setEnrollments(enrollmentsData);

      // Calculate stats
      const total = enrollmentsData.length;
      const inProgress = enrollmentsData.filter((e) => e.status === 'in-progress').length;
      const completed = enrollmentsData.filter((e) => e.status === 'completed').length;
      const averageProgress =
        total > 0
          ? Math.round(
              enrollmentsData.reduce((sum, e) => sum + e.progress_percent, 0) / total
            )
          : 0;

      setStats({ total, inProgress, completed, averageProgress });
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'เสร็จสิ้น';
      case 'in-progress':
        return 'กำลังเรียน';
      default:
        return 'ลงทะเบียนแล้ว';
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
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 via-green-700 to-green-800 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
                           radial-gradient(circle at 80% 80%, rgba(255,255,255,0.1) 0%, transparent 50%)`
        }}></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3">
            สวัสดี, {user?.name}
          </h1>
          <p className="text-green-100 text-lg md:text-xl">รหัสนักศึกษา: {user?.student_id}</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">หลักสูตรทั้งหมด</CardTitle>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
              <p className="text-xs text-gray-500 mt-1">หลักสูตร</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังเรียน</CardTitle>
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.inProgress}</div>
              <p className="text-xs text-gray-500 mt-1">หลักสูตร</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.completed}</div>
              <p className="text-xs text-gray-500 mt-1">หลักสูตร</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500 hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ความคืบหน้าเฉลี่ย</CardTitle>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stats.averageProgress}%</div>
              <p className="text-xs text-gray-500 mt-1">ของทั้งหมด</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/student/courses">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-green-200 bg-gradient-to-br from-white to-green-50/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-md">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">หลักสูตรทั้งหมด</CardTitle>
                </div>
                <CardDescription className="text-sm">ดูและลงทะเบียนหลักสูตร</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/student/bookings">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200 bg-gradient-to-br from-white to-blue-50/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-md">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">จองรอบฝึกปฏิบัติ</CardTitle>
                </div>
                <CardDescription className="text-sm">จองรอบฝึกปฏิบัติที่ร้าน</CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/student/my-bookings">
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 bg-gradient-to-br from-white to-purple-50/50">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                    <CheckCircle2 className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">การจองของฉัน</CardTitle>
                </div>
                <CardDescription className="text-sm">ดูสถานะการจอง</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Enrollments List */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">หลักสูตรของฉัน</h2>
              <p className="text-gray-600 mt-1">หลักสูตรที่คุณลงทะเบียนแล้ว</p>
            </div>
            <Link href="/student/courses">
              <Button variant="outline" className="hidden md:flex">
                <BookOpen className="h-4 w-4 mr-2" />
                ดูหลักสูตรทั้งหมด
              </Button>
            </Link>
          </div>
          {enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">คุณยังไม่ได้ลงทะเบียนหลักสูตรใดๆ</p>
                <Link href="/student/courses">
                  <Button>ดูหลักสูตรทั้งหมด</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment, index) => (
                <Card 
                  key={enrollment.enrollment_id} 
                  className="hover:shadow-2xl transition-all duration-300 border border-gray-200 overflow-hidden group bg-white"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="relative h-36 bg-gradient-to-br from-green-500 via-green-600 to-green-700 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-black/5"></div>
                    <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                      <BookOpen className="h-8 w-8 text-white" />
                    </div>
                    <span
                      className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-semibold border shadow-lg ${getStatusColor(
                        enrollment.status
                      )}`}
                    >
                      {getStatusText(enrollment.status)}
                    </span>
                  </div>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-bold text-gray-900 line-clamp-2 leading-tight mb-2">
                      {enrollment.course.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-gray-600 text-sm leading-relaxed">
                      {enrollment.course.description || 'เรียนรู้เนื้อหาที่น่าสนใจ'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600 font-medium">ความคืบหน้า</span>
                        <span className="font-bold text-green-600">{enrollment.progress_percent}%</span>
                      </div>
                      <Progress value={enrollment.progress_percent} className="h-2.5" />
                    </div>
                    {enrollment.course.duration && (
                      <div className="flex items-center text-sm text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg">
                        <Clock className="h-4 w-4 mr-1.5 text-green-600" />
                        <span className="font-medium">{enrollment.course.duration} นาที</span>
                      </div>
                    )}
                    <Link href={`/learn/${enrollment.course.course_id}`}>
                      <Button 
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-200 h-11" 
                        variant="default"
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        {enrollment.status === 'completed' ? 'ดูซ้ำ' : 'เริ่มเรียน'}
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
