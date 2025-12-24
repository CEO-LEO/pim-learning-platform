'use client';

import { useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, Search, User, Camera } from 'lucide-react';
import { useNotificationStore } from '@/store/notification-store';

interface Booking {
  booking_id: string;
  student_id: string;
  slot_datetime: string;
  qr_code: string | null;
  check_in_time: string | null;
  student: {
    name: string;
    student_id: string;
  };
}

export default function CheckInPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [searchInput, setSearchInput] = useState('');
  const [booking, setBooking] = useState<Booking | null>(null);
  const [checkingIn, setCheckingIn] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'instructor' && user.role !== 'admin') {
      router.push('/instructor/dashboard');
    }
  }, [user, isAuthenticated, router]);

  const handleSearch = async () => {
    if (!searchInput.trim()) return;

    setMessage(null);
    setBooking(null);

    try {
      const searchValue = searchInput.trim();
      
      // Validate search input (alphanumeric and dash only for safety)
      if (!/^[a-zA-Z0-9\-_]+$/.test(searchValue)) {
        setMessage({ type: 'error', text: 'กรุณากรอกรหัสนักศึกษาหรือ QR Code ที่ถูกต้อง' });
        return;
      }
      
      // Search by QR code or student ID
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          student:users!bookings_student_id_fkey (
            student_id,
            name
          )
        `)
        .or(`qr_code.eq.${searchValue},student_id.eq.${searchValue}`)
        .eq('status', 'confirmed')
        .order('slot_datetime', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (data && data.booking_id) {
        // Properly type the response with nested student
        // Supabase returns student as an object (not array) when using maybeSingle()
        const studentData = Array.isArray(data.student) 
          ? data.student[0] 
          : (data.student as { student_id: string; name: string } | null);
        
        const bookingData: Booking = {
          booking_id: data.booking_id,
          student_id: data.student_id,
          slot_datetime: data.slot_datetime,
          qr_code: data.qr_code,
          check_in_time: data.check_in_time,
          student: studentData || {
            name: '',
            student_id: data.student_id,
          },
        };
        setBooking(bookingData);
      } else {
        setMessage({ type: 'error', text: 'ไม่พบการจอง' });
      }
    } catch (error) {
      console.error('Error searching:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง' });
    }
  };

  const handleCheckIn = async () => {
    if (!booking) return;

    setCheckingIn(true);
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          check_in_time: new Date().toISOString(),
        })
        .eq('booking_id', booking.booking_id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Check-in สำเร็จ!' });
      setBooking({ ...booking, check_in_time: new Date().toISOString() });
      
      // Show notification
      addNotification({
        type: 'success',
        title: 'Check-in สำเร็จ',
        message: `${booking.student?.name} (${booking.student?.student_id || booking.student_id}) ได้ Check-in แล้ว`,
      });
    } catch (error) {
      console.error('Error checking in:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการ Check-in' });
    } finally {
      setCheckingIn(false);
    }
  };

  if (!isAuthenticated || (user?.role !== 'instructor' && user?.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Check-in นักศึกษา</h1>
          <p className="text-gray-600 mt-1">สแกน QR Code หรือกรอกรหัสนักศึกษา</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ค้นหาการจอง</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">QR Code หรือรหัสนักศึกษา</Label>
              <div className="flex space-x-2">
                <Input
                  id="search"
                  placeholder="สแกน QR Code หรือกรอกรหัสนักศึกษา"
                  value={searchInput}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
                  onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  ค้นหา
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const newShowScanner = !showScanner;
                    setShowScanner(newShowScanner);
                    if (newShowScanner) {
                      // In production, use a QR scanner library like html5-qrcode
                      alert('ฟีเจอร์สแกน QR Code กำลังพัฒนา กรุณากรอก QR Code หรือรหัสนักศึกษา');
                    }
                  }}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  สแกน QR
                </Button>
              </div>
              {showScanner && (
                <div className="p-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 text-center">
                  <p className="text-sm text-gray-600 mb-2">ฟีเจอร์สแกน QR Code กำลังพัฒนา</p>
                  <p className="text-xs text-gray-500">
                    กรุณากรอก QR Code หรือรหัสนักศึกษาในช่องค้นหาด้านบน
                  </p>
              </div>
              )}
            </div>

            {message && (
              <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
                {message.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <XCircle className="h-4 w-4" />
                )}
                <AlertDescription>{message.text}</AlertDescription>
              </Alert>
            )}

            {booking && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg border space-y-4">
                <div className="flex items-center space-x-2">
                  <User className="h-5 w-5 text-gray-600" />
                  <div>
                    <p className="font-semibold">{booking.student?.name}</p>
                    <p className="text-sm text-gray-600">
                      รหัสนักศึกษา: {booking.student_id}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-gray-600">รอบฝึกปฏิบัติ:</span>{' '}
                    {new Date(booking.slot_datetime).toLocaleString('th-TH')}
                  </p>
                  {booking.qr_code && (
                    <p>
                      <span className="text-gray-600">QR Code:</span>{' '}
                      <span className="font-mono">{booking.qr_code}</span>
                    </p>
                  )}
                  {booking.check_in_time ? (
                    <div className="flex items-center space-x-2 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>
                        Check-in แล้ว: {new Date(booking.check_in_time).toLocaleString('th-TH')}
                      </span>
                    </div>
                  ) : (
                    <Button
                      onClick={handleCheckIn}
                      disabled={checkingIn}
                      className="w-full"
                    >
                      {checkingIn ? 'กำลัง Check-in...' : 'Check-in'}
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
