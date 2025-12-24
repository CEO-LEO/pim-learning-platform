'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, BookOpen, CheckCircle2, Clock, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentProgress {
  student_id: string;
  name: string;
  email: string | null;
  enrollments: {
    course_id: string;
    status: string;
    progress_percent: number;
    course: {
      title: string;
    };
  }[];
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [students, setStudents] = useState<StudentProgress[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalCourses: 0,
    completedEnrollments: 0,
    inProgressEnrollments: 0,
  });
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

    fetchData();
  }, [user, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      // Fetch all students with enrollments
      const { data: studentsData, error } = await supabase
        .from('users')
        .select(`
          student_id,
          name,
          email,
          enrollments:enrollments!enrollments_student_id_fkey (
            enrollment_id,
            course_id,
            status,
            progress_percent,
            course:courses!enrollments_course_id_fkey (
              title
            )
          )
        `)
        .eq('role', 'student');

      if (error) throw error;

      const formattedStudents = (studentsData || []).map((s: any) => ({
        student_id: s.student_id,
        name: s.name,
        email: s.email,
        enrollments: s.enrollments || [],
      }));

      setStudents(formattedStudents);

      // Calculate stats
      const totalStudents = formattedStudents.length;
      const allEnrollments = formattedStudents.flatMap((s) => s.enrollments);
      const uniqueCourses = new Set(allEnrollments.map((e: any) => e.course_id));
      const completed = allEnrollments.filter((e: any) => e.status === 'completed').length;
      const inProgress = allEnrollments.filter((e: any) => e.status === 'in-progress').length;

      setStats({
        totalStudents,
        totalCourses: uniqueCourses.size,
        completedEnrollments: completed,
        inProgressEnrollments: inProgress,
      });
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = students.flatMap((student) =>
      student.enrollments.map((enrollment: any) => ({
        'รหัสนักศึกษา': student.student_id,
        'ชื่อ': student.name,
        'อีเมล': student.email || '',
        'หลักสูตร': enrollment.course?.title || '',
        'สถานะ': enrollment.status === 'completed' ? 'เสร็จสิ้น' : enrollment.status === 'in-progress' ? 'กำลังเรียน' : 'ลงทะเบียนแล้ว',
        'ความคืบหน้า (%)': enrollment.progress_percent,
      }))
    );

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Progress');
    XLSX.writeFile(wb, 'student-progress.xlsx');
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
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">จัดการและติดตามความคืบหน้าของนักศึกษา</p>
          </div>
          <Button onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export to Excel
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">นักศึกษาทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">หลักสูตรทั้งหมด</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCourses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เสร็จสิ้น</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completedEnrollments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">กำลังเรียน</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgressEnrollments}</div>
            </CardContent>
          </Card>
        </div>

        {/* Students Table */}
        <Card>
          <CardHeader>
            <CardTitle>รายชื่อนักศึกษาและความคืบหน้า</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>รหัสนักศึกษา</TableHead>
                    <TableHead>ชื่อ</TableHead>
                    <TableHead>อีเมล</TableHead>
                    <TableHead>หลักสูตร</TableHead>
                    <TableHead>สถานะ</TableHead>
                    <TableHead>ความคืบหน้า</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) =>
                    student.enrollments.length > 0 ? (
                      student.enrollments.map((enrollment: any, index: number) => (
                        <TableRow key={`${student.student_id}-${enrollment.course_id}`}>
                          {index === 0 && (
                            <>
                              <TableCell rowSpan={student.enrollments.length}>
                                {student.student_id}
                              </TableCell>
                              <TableCell rowSpan={student.enrollments.length}>
                                {student.name}
                              </TableCell>
                              <TableCell rowSpan={student.enrollments.length}>
                                {student.email || '-'}
                              </TableCell>
                            </>
                          )}
                          <TableCell>{enrollment.course?.title || '-'}</TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                enrollment.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : enrollment.status === 'in-progress'
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {enrollment.status === 'completed'
                                ? 'เสร็จสิ้น'
                                : enrollment.status === 'in-progress'
                                ? 'กำลังเรียน'
                                : 'ลงทะเบียนแล้ว'}
                            </span>
                          </TableCell>
                          <TableCell>{enrollment.progress_percent}%</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow key={student.student_id}>
                        <TableCell>{student.student_id}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.email || '-'}</TableCell>
                        <TableCell colSpan={3} className="text-center text-gray-500">
                          ยังไม่ได้ลงทะเบียนหลักสูตร
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
