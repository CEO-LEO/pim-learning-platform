'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, QrCode, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { QRCodeSVG } from 'qrcode.react';

interface Booking {
  booking_id: string;
  slot_datetime: string;
  status: string;
  qr_code: string | null;
  check_in_time: string | null;
  created_at: string;
}

export default function MyBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    fetchBookings();
  }, [user, isAuthenticated, router]);

  const fetchBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('student_id', user?.student_id)
        .order('slot_datetime', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-700">ยืนยันแล้ว</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-100 text-red-700">ยกเลิก</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-700">เสร็จสิ้น</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">การจองของฉัน</h1>
          <p className="text-gray-600 mt-1">ดูสถานะการจองรอบฝึกปฏิบัติ</p>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">คุณยังไม่ได้จองรอบฝึกปฏิบัติ</p>
              <Button onClick={() => router.push('/student/bookings')}>จองรอบฝึกปฏิบัติ</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const slotDate = new Date(booking.slot_datetime);
              const isPast = slotDate < new Date();
              const isToday = format(slotDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <Card key={booking.booking_id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center space-x-2">
                        <CalendarIcon className="h-5 w-5" />
                        <span>
                          {format(slotDate, 'd MMMM yyyy', { locale: th })} เวลา{' '}
                          {format(slotDate, 'HH:mm')}
                        </span>
                      </CardTitle>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-600" />
                        <span className="text-gray-600">เวลา:</span>
                        <span className="font-medium">
                          {format(slotDate, 'HH:mm')} น.
                        </span>
                      </div>
                      {booking.check_in_time && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <span className="text-gray-600">Check-in:</span>
                          <span className="font-medium">
                            {format(new Date(booking.check_in_time), 'HH:mm')} น.
                          </span>
                        </div>
                      )}
                    </div>

                    {booking.qr_code && booking.status === 'confirmed' && (
                      <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <QrCode className="h-5 w-5 text-gray-600" />
                            <span className="font-semibold">QR Code สำหรับ Check-in</span>
                          </div>
                        </div>
                        <div className="flex flex-col items-center space-y-3">
                          <div className="p-4 bg-white rounded-lg border-2 border-gray-200">
                            <QRCodeSVG
                              value={booking.qr_code}
                              size={200}
                              level="H"
                              includeMargin={true}
                            />
                          </div>
                          <div className="text-center">
                            <p className="font-mono text-sm font-bold text-gray-700 mb-1">
                              {booking.qr_code}
                            </p>
                            <p className="text-xs text-gray-600">
                              แสดง QR Code นี้ที่ร้านเพื่อ Check-in
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {isToday && booking.status === 'confirmed' && !booking.check_in_time && (
                      <div className="mt-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            วันนี้เป็นวันฝึกปฏิบัติของคุณ กรุณาไปที่ร้านและแสดง QR Code เพื่อ
                            Check-in
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
