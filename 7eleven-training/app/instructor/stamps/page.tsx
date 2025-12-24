'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Search, Stamp, User } from 'lucide-react';

interface Station {
  station_id: string;
  station_name: string;
  description: string | null;
  course_id: string;
}

interface StationLog {
  log_id: string;
  station_id: string;
  stamp_status: string;
  timestamp: string;
  station: Station;
}

export default function StampsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [studentId, setStudentId] = useState('');
  const [student, setStudent] = useState<any>(null);
  const [stations, setStations] = useState<Station[]>([]);
  const [logs, setLogs] = useState<StationLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stamping, setStamping] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/instructor/dashboard');
    }
  }, [user, isAuthenticated, router]);

  const fetchStudent = async () => {
    if (!studentId.trim()) return;

    setLoading(true);
    try {
      const { data: studentData, error: studentError } = await supabase
        .from('users')
        .select('*')
        .eq('student_id', studentId)
        .single();

      if (studentError) throw studentError;
      setStudent(studentData);

      // Fetch stations for courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('course_id')
        .eq('student_id', studentId)
        .in('status', ['in-progress', 'completed']);

      if (!enrollmentsError && enrollments && enrollments.length > 0) {
        const courseIds = enrollments.map((e: any) => e.course_id);
        const { data: stationsData, error: stationsError } = await supabase
          .from('stations')
          .select('*')
          .in('course_id', courseIds)
          .eq('is_active', true)
          .order('order_index', { ascending: true });

        if (!stationsError) {
          setStations(stationsData || []);

          // Fetch existing logs
          const { data: logsData, error: logsError } = await supabase
            .from('station_logs')
            .select(`
              *,
              station:stations (*)
            `)
            .eq('student_id', studentId);

          if (!logsError) {
            setLogs(logsData || []);
          }
        }
      } else {
        setStations([]);
        setLogs([]);
      }
    } catch (error) {
      console.error('Error fetching student:', error);
      setStudent(null);
    } finally {
      setLoading(false);
    }
  };

  const handleStamp = async (stationId: string, status: 'passed' | 'failed') => {
    if (!student || !user) return;

    setStamping(stationId);
    try {
      // Check if already stamped
      const { data: existing } = await supabase
        .from('station_logs')
        .select('log_id')
        .eq('student_id', student.student_id)
        .eq('station_id', stationId)
        .maybeSingle();

      if (existing) {
        // Update existing log
        const { error } = await supabase
          .from('station_logs')
          .update({
            stamp_status: status,
            timestamp: new Date().toISOString(),
            approver_id: user.student_id,
          })
          .eq('log_id', existing.log_id);

        if (error) throw error;
      } else {
        // Create new log
        const { error } = await supabase.from('station_logs').insert({
          student_id: student.student_id,
          station_id: stationId,
          stamp_status: status,
          approver_id: user.student_id,
        });

        if (error) throw error;
      }

      // Refresh logs
      const { data: logsData } = await supabase
        .from('station_logs')
        .select(`
          *,
          station:stations (*)
        `)
        .eq('student_id', student.student_id);

      setLogs(logsData || []);
    } catch (error) {
      console.error('Error stamping:', error);
      alert('เกิดข้อผิดพลาดในการ Stamp');
    } finally {
      setStamping(null);
    }
  };

  const getLogStatus = (stationId: string) => {
    const log = logs.find((l) => l.station_id === stationId);
    return log ? log.stamp_status : null;
  };

  const allStationsPassed = stations.length > 0 && stations.every((s) => getLogStatus(s.station_id) === 'passed');

  if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Digital Stamp System</h1>
          <p className="text-gray-600 mt-1">ประทับตราการผ่านฐานฝึกปฏิบัติ</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ค้นหานักศึกษา</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input
                placeholder="กรอกรหัสนักศึกษา"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchStudent()}
              />
              <Button onClick={fetchStudent} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                ค้นหา
              </Button>
            </div>

            {student && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold">{student.name}</p>
                    <p className="text-sm text-gray-600">รหัสนักศึกษา: {student.student_id}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {student && stations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>ฐานฝึกปฏิบัติ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {stations.map((station) => {
                const status = getLogStatus(station.station_id);
                return (
                  <div
                    key={station.station_id}
                    className="p-4 border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{station.station_name}</h3>
                        {station.description && (
                          <p className="text-sm text-gray-600">{station.description}</p>
                        )}
                      </div>
                      {status && (
                        <Badge
                          className={
                            status === 'passed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {status === 'passed' ? 'ผ่าน' : 'ไม่ผ่าน'}
                        </Badge>
                      )}
                    </div>

                    <div className="flex space-x-2">
                      <Button
                        onClick={() => handleStamp(station.station_id, 'passed')}
                        disabled={stamping === station.station_id}
                        variant={status === 'passed' ? 'default' : 'outline'}
                        className="flex-1"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        ผ่าน
                      </Button>
                      <Button
                        onClick={() => handleStamp(station.station_id, 'failed')}
                        disabled={stamping === station.station_id}
                        variant={status === 'failed' ? 'destructive' : 'outline'}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        ไม่ผ่าน
                      </Button>
                    </div>
                  </div>
                );
              })}

              {allStationsPassed && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    ✅ นักศึกษาผ่านทุกฐานแล้ว สามารถทำ Post-test ได้
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
