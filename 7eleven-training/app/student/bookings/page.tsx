'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, Clock, Users, CheckCircle2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { useNotificationStore } from '@/store/notification-store';

interface BookingSlot {
  slot_datetime: string;
  count: number;
  max_count: number;
  isFull: boolean;
}

export default function BookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (selectedDate) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, user, isAuthenticated, router]);

  const fetchSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get all bookings for the selected date
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('slot_datetime, status')
        .gte('slot_datetime', `${dateStr}T00:00:00`)
        .lt('slot_datetime', `${dateStr}T23:59:59`)
        .eq('status', 'confirmed');

      if (error) {
        console.error('Error fetching slots:', error);
        setSlots([]);
        setLoading(false);
        return;
      }

      // Generate time slots (9:00 - 17:00, every hour)
      const timeSlots: BookingSlot[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        const slotTime = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00`;
        // Count bookings for this exact slot time (match date and hour)
        const count = bookings?.filter((b) => {
          const bookingDate = new Date(b.slot_datetime);
          const slotDate = new Date(slotTime);
          return (
            bookingDate.toISOString().split('T')[0] === slotDate.toISOString().split('T')[0] &&
            bookingDate.getHours() === slotDate.getHours()
          );
        }).length || 0;
        const maxCount = 100; // Hard limit

        timeSlots.push({
          slot_datetime: slotTime,
          count,
          max_count: maxCount,
          isFull: count >= maxCount,
        });
      }

      setSlots(timeSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = async (slotDatetime: string) => {
    if (!user || !selectedDate) return;

    setBooking(true);
    try {
      // Check if already booked
      const { data: existing } = await supabase
        .from('bookings')
        .select('booking_id')
        .eq('student_id', user.student_id)
        .eq('slot_datetime', slotDatetime)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (existing) {
        alert('คุณได้จองรอบนี้แล้ว');
        setBooking(false);
        return;
      }

      // Check slot availability
      const slot = slots.find((s) => s.slot_datetime === slotDatetime);
      if (slot?.isFull) {
        alert('รอบนี้เต็มแล้ว');
        setBooking(false);
        return;
      }

      // Generate QR code (simple implementation)
      const qrCode = `${user.student_id}-${Date.now()}`;

      // Create booking
      const { error } = await supabase.from('bookings').insert({
        student_id: user.student_id,
        slot_datetime: slotDatetime,
        status: 'confirmed',
        qr_code: qrCode,
      });

      if (error) throw error;

      // Show notification
      addNotification({
        type: 'success',
        title: 'จองสำเร็จ!',
        message: `คุณได้จองรอบฝึกปฏิบัติแล้ว คุณจะได้รับ QR Code สำหรับ Check-in`,
        actionUrl: '/my-bookings',
      });

      fetchSlots();
      router.push('/my-bookings');
    } catch (error) {
      console.error('Error booking:', error);
      alert('เกิดข้อผิดพลาดในการจอง');
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">จองรอบฝึกปฏิบัติ</h1>
          <p className="text-gray-600 mt-1">เลือกวันที่และเวลาที่ต้องการ</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CalendarIcon className="h-5 w-5" />
                <span>เลือกวันที่</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Time Slots */}
          <div className="lg:col-span-2">
            {selectedDate ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    เวลาที่ว่าง - {format(selectedDate, 'd MMMM yyyy', { locale: th })}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {slots.map((slot) => {
                        const time = format(new Date(slot.slot_datetime), 'HH:mm');
                        return (
                          <div
                            key={slot.slot_datetime}
                            className={`p-4 rounded-lg border ${
                              slot.isFull
                                ? 'bg-gray-100 border-gray-300'
                                : 'bg-white border-gray-200 hover:border-green-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-600" />
                                <span className="font-semibold">{time}</span>
                              </div>
                              {slot.isFull && (
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                                  เต็ม
                                </span>
                              )}
                            </div>
                            <div className="flex items-center space-x-2 text-sm text-gray-600 mb-3">
                              <Users className="h-4 w-4" />
                              <span>
                                {slot.count} / {slot.max_count} คน
                              </span>
                            </div>
                            <Button
                              onClick={() => handleBook(slot.slot_datetime)}
                              disabled={slot.isFull || booking}
                              className="w-full"
                              size="sm"
                            >
                              {slot.isFull ? 'เต็ม' : 'จอง'}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>กรุณาเลือกวันที่</AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ⚠️ จำกัด 100 คนต่อรอบ - เมื่อจองแล้วจะได้รับ QR Code สำหรับ Check-in ที่ร้าน
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}
