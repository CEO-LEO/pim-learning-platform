'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckSquare, Stamp, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    todayStamps: 0,
    totalCheckIns: 0,
    totalStamps: 0,
  });
  const [todayBookings, setTodayBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/instructor/dashboard');
      return;
    }

    fetchData();
  }, [user, isAuthenticated, router]);

  const fetchData = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Fetch today's check-ins
      const { data: checkIns, error: checkInsError } = await supabase
        .from('bookings')
        .select('*')
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`);

      if (!checkInsError) {
        setStats((prev) => ({ ...prev, todayCheckIns: checkIns?.length || 0 }));
      }

      // Fetch today's stamps
      const { data: stamps, error: stampsError } = await supabase
        .from('station_logs')
        .select('*')
        .gte('timestamp', `${today}T00:00:00`)
        .lt('timestamp', `${today}T23:59:59`);

      if (!stampsError) {
        setStats((prev) => ({ ...prev, todayStamps: stamps?.length || 0 }));
      }

      // Fetch total check-ins
      const { data: totalCheckIns } = await supabase
        .from('bookings')
        .select('booking_id', { count: 'exact' })
        .not('check_in_time', 'is', null);

      if (totalCheckIns !== null) {
        setStats((prev) => ({ ...prev, totalCheckIns: totalCheckIns.length || 0 }));
      }

      // Fetch total stamps
      const { data: totalStamps } = await supabase
        .from('station_logs')
        .select('log_id', { count: 'exact' });

      if (totalStamps !== null) {
        setStats((prev) => ({ ...prev, totalStamps: totalStamps.length || 0 }));
      }

      // Fetch today's bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          student:users!bookings_student_id_fkey (
            student_id,
            name
          )
        `)
        .gte('slot_datetime', `${today}T00:00:00`)
        .lt('slot_datetime', `${today}T23:59:59`)
        .eq('status', 'confirmed')
        .order('slot_datetime', { ascending: true });

      if (!bookingsError) {
        setTodayBookings(bookings || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instructor Dashboard</h1>
          <p className="text-gray-600 mt-1">ภาพรวมการทำงานของคุณ</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-in วันนี้</CardTitle>
              <CheckSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCheckIns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stamp วันนี้</CardTitle>
              <Stamp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayStamps}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Check-in ทั้งหมด</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCheckIns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stamp ทั้งหมด</CardTitle>
              <Stamp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStamps}</div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>การจองวันนี้</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-gray-600 text-center py-8">ไม่มีรายการจองวันนี้</p>
            ) : (
              <div className="space-y-2">
                {todayBookings.map((booking: any) => (
                  <div
                    key={booking.booking_id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{booking.student?.name}</p>
                      <p className="text-sm text-gray-600">
                        {booking.student?.student_id} •{' '}
                        {format(new Date(booking.slot_datetime), 'HH:mm น.', { locale: th })}
                      </p>
                    </div>
                    <div>
                      {booking.check_in_time ? (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          Check-in แล้ว
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                          รอ Check-in
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
