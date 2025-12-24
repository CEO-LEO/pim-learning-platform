'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookOpen, Clock, PlayCircle, CheckCircle2, Search, Filter, Tag, Star, User, Plus, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Course {
  course_id: string;
  title: string;
  description: string | null;
  duration: number | null;
  order_index: number;
  is_active: boolean;
  course_code?: string;
  instructor?: string;
  category?: string;
  thumbnail_url?: string;
  is_new?: boolean;
  created_at?: string;
}

interface CourseWithEnrollment extends Course {
  isEnrolled: boolean;
}

export default function CoursesPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState<CourseWithEnrollment[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<CourseWithEnrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<CourseWithEnrollment | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'enrolled' | 'not-enrolled'>('all');

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isAuthenticated, router]);

  const fetchCourses = async () => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('is_active', true)
        .order('order_index', { ascending: true });

      if (coursesError) throw coursesError;

      if (!coursesData || coursesData.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Fetch enrollments for current user
      const { data: enrollmentsData, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', user?.student_id);

      if (enrollmentsError) throw enrollmentsError;

      const enrolledCourseIds = new Set(
        (enrollmentsData || []).map((e: { course_id: string }) => e.course_id)
      );

      // Combine courses with enrollment status
      const coursesWithEnrollment: CourseWithEnrollment[] = coursesData.map(
        (course: Course) => ({
          ...course,
          isEnrolled: enrolledCourseIds.has(course.course_id),
        })
      );

      setCourses(coursesWithEnrollment);
      setFilteredCourses(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = [...courses];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (course) =>
          course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by enrollment status
    if (filterStatus === 'enrolled') {
      filtered = filtered.filter((course) => course.isEnrolled);
    } else if (filterStatus === 'not-enrolled') {
      filtered = filtered.filter((course) => !course.isEnrolled);
    }

    setFilteredCourses(filtered);
  }, [searchTerm, filterStatus, courses]);

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours} ชั่วโมง ${mins} นาที`;
    }
    return `${mins} นาที`;
  };

  const getCourseCode = (courseId: string) => {
    // Generate course code from course_id or use first 8 chars
    return courseId.substring(0, 8).toUpperCase();
  };

  const getCategoryName = (course: CourseWithEnrollment) => {
    // Default category or extract from title
    return course.category || 'หลักสูตรการอบรม';
  };

  const getInstructorName = (course: CourseWithEnrollment) => {
    // Default instructor or extract from course
    return course.instructor || 'วิทยากรผู้ทรงคุณวุฒิ';
  };

  const handleRegister = async () => {
    if (!selectedCourse || !user) {
      return;
    }

    // Check if already enrolled
    const existingCourse = courses.find(c => c.course_id === selectedCourse.course_id);
    if (existingCourse?.isEnrolled) {
      setShowConfirmDialog(false);
      router.push(`/student/learn/${selectedCourse.course_id}`);
      return;
    }

    setRegistering(true);
    try {
      // Create enrollment
      const { data, error } = await supabase.from('enrollments').insert({
        student_id: user.student_id,
        course_id: selectedCourse.course_id,
        status: 'registered',
        progress_percent: 0,
      }).select();

      if (error) {
        // Handle duplicate enrollment error specifically
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          // Update state to reflect enrollment even if insert failed due to duplicate
          setCourses((prev: CourseWithEnrollment[]) =>
            prev.map((course: CourseWithEnrollment) =>
              course.course_id === selectedCourse.course_id
                ? { ...course, isEnrolled: true }
                : course
            )
          );
          setFilteredCourses((prev: CourseWithEnrollment[]) =>
            prev.map((course: CourseWithEnrollment) =>
              course.course_id === selectedCourse.course_id
                ? { ...course, isEnrolled: true }
                : course
            )
          );
          setShowConfirmDialog(false);
          router.push(`/student/learn/${selectedCourse.course_id}`);
          return;
        }
        throw error;
      }

      // Update local state
      setCourses((prev: CourseWithEnrollment[]) =>
        prev.map((course: CourseWithEnrollment) =>
          course.course_id === selectedCourse.course_id
            ? { ...course, isEnrolled: true }
            : course
        )
      );

      // Update filteredCourses to reflect the enrollment change
      setFilteredCourses((prev: CourseWithEnrollment[]) =>
        prev.map((course: CourseWithEnrollment) =>
          course.course_id === selectedCourse.course_id
            ? { ...course, isEnrolled: true }
            : course
        )
      );

      // Close dialog first
      setShowConfirmDialog(false);
      
      // Show success message
      alert('ลงทะเบียนสำเร็จ!');
      
      // Redirect to the course learning page
      setTimeout(() => {
        router.push(`/student/learn/${selectedCourse.course_id}`);
      }, 100);
    } catch (error) {
      console.error('Error registering:', error);
      alert('เกิดข้อผิดพลาดในการลงทะเบียน');
    } finally {
      setRegistering(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Removed for cleaner look */}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">หลักสูตรทั้งหมด</h2>
        </div>

        {/* Search Section */}
        <div className="mb-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 z-10" />
              <Input
                placeholder="ค้นหาหลักสูตร (อย่างน้อย 3 ตัวอักษร)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-11 text-base border-gray-300 focus:border-blue-500 focus:ring-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center space-x-3">
              <Filter className="h-5 w-5 text-gray-500" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'enrolled' | 'not-enrolled')}
                className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                <option value="all">ทั้งหมด</option>
                <option value="enrolled">ที่ลงทะเบียนแล้ว</option>
                <option value="not-enrolled">ยังไม่ได้ลงทะเบียน</option>
              </select>
            </div>
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-600 mt-3">
              พบ <span className="font-semibold text-blue-600">{filteredCourses.length}</span> หลักสูตร
            </p>
          )}
        </div>

        {courses.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ยังไม่มีหลักสูตร</h3>
              <p className="text-gray-600">กรุณาติดต่อผู้ดูแลระบบ</p>
            </CardContent>
          </Card>
        ) : filteredCourses.length === 0 ? (
          <Card className="border-2 border-dashed border-gray-300">
            <CardContent className="py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-10 w-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบหลักสูตรที่ค้นหา</h3>
              <p className="text-gray-600 mb-4">ลองค้นหาด้วยคำอื่น หรือล้างตัวกรอง</p>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterStatus('all');
                }}
              >
                ล้างตัวกรอง
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCourses.map((course, index) => {
              const courseCode = course.course_code || getCourseCode(course.course_id);
              const isNew = course.is_new || (course.created_at && new Date(course.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
              
              // Blue theme gradients - varying shades of blue
              const gradients = [
                'from-blue-500 via-blue-600 to-blue-700',
                'from-blue-400 via-blue-500 to-blue-600',
                'from-sky-500 via-sky-600 to-sky-700',
                'from-cyan-500 via-cyan-600 to-cyan-700',
                'from-blue-600 via-blue-700 to-blue-800',
                'from-sky-400 via-sky-500 to-sky-600',
              ];
              const gradient = gradients[index % gradients.length];
              
              return (
                <div
                  key={course.course_id}
                  className="group bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={() => {
                    if (course.isEnrolled) {
                      router.push(`/student/learn/${course.course_id}`);
                    } else {
                      setSelectedCourse(course);
                      setShowConfirmDialog(true);
                    }
                  }}
                >
                  {/* Course Image Header - Like SET e-learning with real image feel */}
                  <div className={`relative h-48 bg-gradient-to-br ${gradient} overflow-hidden`}>
                    {/* Image-like Pattern Overlay */}
                    <div className="absolute inset-0 opacity-30">
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mt-32"></div>
                      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/20 rounded-full -ml-24 -mb-24"></div>
                      <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-white/10 rounded-full"></div>
                    </div>
                    
                    {/* Main Content Area */}
                    <div className="relative h-full flex items-center justify-center p-6">
                      <div className="w-24 h-24 bg-white/30 backdrop-blur-md rounded-xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 border-2 border-white/40">
                        <BookOpen className="h-12 w-12 text-white drop-shadow-2xl" />
                      </div>
                    </div>

                    {/* Course Code & NEW Badge - Top Left */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                      <span className="bg-white/95 backdrop-blur-sm text-gray-800 font-bold text-xs px-2.5 py-1 rounded shadow-lg">
                        {courseCode}
                      </span>
                      {isNew && (
                        <span className="bg-red-500 text-white font-bold text-xs px-2.5 py-1 rounded shadow-lg flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          NEW
                        </span>
                      )}
                    </div>

                    {/* Free Button - Top Right - Blue theme */}
                    <div className="absolute top-3 right-3 z-10">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!course.isEnrolled) {
                            setSelectedCourse(course);
                            setShowConfirmDialog(true);
                          }
                        }}
                        className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-bold px-3.5 py-1.5 rounded-md shadow-lg flex items-center gap-1.5 text-xs transition-all duration-200"
                      >
                        <span>ฟรี</span>
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Course Content */}
                  <div className="p-4">
                    {/* Duration */}
                    {course.duration && (
                      <div className="mb-3">
                        <div className="inline-flex items-center text-xs text-gray-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
                          <Clock className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
                          <span className="font-medium">{formatDuration(course.duration)}</span>
                        </div>
                      </div>
                    )}

                    {/* Title */}
                    <h3 className="text-base font-bold text-gray-900 line-clamp-2 leading-snug mb-2 min-h-[2.5rem] group-hover:text-blue-700 transition-colors">
                      {course.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-gray-600 line-clamp-3 leading-relaxed mb-3 min-h-[3.5rem]">
                      {course.description || 'เรียนรู้เนื้อหาที่น่าสนใจ พร้อมเทคนิคและเคล็ดลับจากผู้เชี่ยวชาญ'}
                    </p>

                    {/* Instructor */}
                    <div className="flex items-center text-xs text-gray-600 mb-2">
                      <User className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{getInstructorName(course)}</span>
                    </div>

                    {/* Category */}
                    <div className="flex items-center text-xs text-gray-500 mb-4">
                      <Tag className="h-3.5 w-3.5 mr-1.5 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{getCategoryName(course)}</span>
                    </div>

                    {/* Action Button */}
                    {course.isEnrolled ? (
                      <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 h-10 text-sm rounded-md flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/student/learn/${course.course_id}`);
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        เริ่มเรียน
                      </button>
                    ) : (
                      <button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md hover:shadow-lg transition-all duration-200 h-10 text-sm rounded-md flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCourse(course);
                          setShowConfirmDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        ลงทะเบียน
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && selectedCourse && (
          <Dialog 
            key={selectedCourse.course_id}
            open={showConfirmDialog} 
            onOpenChange={(open) => {
              setShowConfirmDialog(open);
              if (!open) {
                setSelectedCourse(null);
              }
            }}
          >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>ยืนยันการลงทะเบียน</DialogTitle>
              <DialogDescription>
                คุณต้องการลงทะเบียนหลักสูตร "{selectedCourse?.title}" หรือไม่?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowConfirmDialog(false)}
                disabled={registering}
              >
                ยกเลิก
              </Button>
              <Button 
                onClick={handleRegister} 
                disabled={registering}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {registering ? 'กำลังลงทะเบียน...' : 'ยืนยัน'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        )}
      </div>
    </div>
  );
}
