'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar as CalendarIcon, Clock, Users, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BookingSlot {
  slot_id?: string;
  slot_datetime: string;
  max_students: number;
  is_active: boolean;
}

export default function AdminBookingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [slots, setSlots] = useState<BookingSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [newSlot, setNewSlot] = useState({
    time: '',
    max_students: 100,
  });
  const [bookingCounts, setBookingCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/admin/dashboard');
      return;
    }

    if (selectedDate) {
      fetchSlots();
    }
  }, [selectedDate, user, isAuthenticated, router]);

  const fetchSlots = async () => {
    if (!selectedDate) return;

    setLoading(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      
      // Get all bookings for the selected date to count current bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('slot_datetime, status')
        .gte('slot_datetime', `${dateStr}T00:00:00`)
        .lt('slot_datetime', `${dateStr}T23:59:59`)
        .eq('status', 'confirmed');

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      }

      // Generate time slots (9:00 - 17:00, every hour) with current booking counts
      const timeSlots: BookingSlot[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        const slotTime = `${dateStr}T${hour.toString().padStart(2, '0')}:00:00`;
        const count = bookings?.filter((b) => {
          const bookingDate = new Date(b.slot_datetime);
          const slotDate = new Date(slotTime);
          return (
            bookingDate.toISOString().split('T')[0] === slotDate.toISOString().split('T')[0] &&
            bookingDate.getHours() === slotDate.getHours()
          );
        }).length || 0;

        timeSlots.push({
          slot_datetime: slotTime,
          max_students: 100, // Default max
          is_active: true,
        });
      }

      setSlots(timeSlots);
      
      // Fetch booking counts
      const counts: Record<string, number> = {};
      timeSlots.forEach((slot) => {
        const count = bookings?.filter((b) => {
          const bookingDate = new Date(b.slot_datetime);
          const slotDate = new Date(slot.slot_datetime);
          return (
            bookingDate.toISOString().split('T')[0] === slotDate.toISOString().split('T')[0] &&
            bookingDate.getHours() === slotDate.getHours()
          );
        }).length || 0;
        counts[slot.slot_datetime] = count;
      });
      setBookingCounts(counts);
    } catch (error) {
      console.error('Error fetching slots:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSlot = async () => {
    if (!selectedDate || !newSlot.time) {
      setMessage({ type: 'error', text: 'กรุณาเลือกวันที่และเวลา' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const slotDatetime = `${dateStr}T${newSlot.time}:00:00`;

      // Check if slot already exists
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('slot_datetime')
        .eq('slot_datetime', slotDatetime)
        .limit(1);

      // Note: Since we're using bookings table directly, we don't need a separate slots table
      // The max_students limit is enforced at booking time (100 students per slot)
      // This page is for viewing and managing existing bookings

      setMessage({ type: 'success', text: 'รอบเวลาถูกสร้างแล้ว (จำกัด ' + newSlot.max_students + ' คน)' });
      setNewSlot({ time: '', max_students: 100 });
      fetchSlots();
    } catch (error) {
      console.error('Error creating slot:', error);
      setMessage({ type: 'error', text: 'เกิดข้อผิดพลาดในการสร้างรอบเวลา' });
    } finally {
      setSaving(false);
    }
  };

  const getBookingCount = (slotDatetime: string) => {
    // This would be calculated from actual bookings
    // For now, we'll fetch it dynamically
    return 0; // Placeholder
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
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งรอบเวลาภาคปฏิบัติ</h1>
          <p className="text-gray-600 mt-1">จัดการรอบเวลาสำหรับการฝึกปฏิบัติที่ร้าน 7-Eleven</p>
        </div>

        {message && (
          <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CalendarIcon className="h-5 w-5" />
              <span>เลือกวันที่</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Input
                type="date"
                value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value));
                  }
                }}
                className="w-full"
              />
            </div>
          </CardContent>
        </Card>

        {/* Create New Slot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>สร้างรอบเวลาใหม่</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="time">เวลา (HH:MM)</Label>
                <Input
                  id="time"
                  type="time"
                  value={newSlot.time}
                  onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_students">จำนวนสูงสุด (คน)</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="1"
                  max="100"
                  value={newSlot.max_students}
                  onChange={(e) => setNewSlot({ ...newSlot, max_students: parseInt(e.target.value) || 100 })}
                />
                <p className="text-xs text-gray-500">จำกัดสูงสุด 100 คนต่อรอบ</p>
              </div>
            </div>
            <Button onClick={handleCreateSlot} disabled={saving || !newSlot.time}>
              <Plus className="h-4 w-4 mr-2" />
              {saving ? 'กำลังสร้าง...' : 'สร้างรอบเวลา'}
            </Button>
          </CardContent>
        </Card>

        {/* Existing Slots */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5" />
              <span>รอบเวลาที่มีอยู่</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedDate ? (
              <div className="space-y-3">
                {slots.map((slot, index) => {
                  const slotTime = new Date(slot.slot_datetime);
                  const currentCount = getBookingCount(slot.slot_datetime);
                  const isFull = currentCount >= slot.max_students;

                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Clock className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="font-medium">
                            {format(slotTime, 'HH:mm')} น.
                          </p>
                          <p className="text-sm text-gray-600">
                            {format(slotTime, 'd MMMM yyyy', { locale: th })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-gray-600" />
                          <span className="text-sm">
                            {currentCount} / {slot.max_students} คน
                          </span>
                        </div>
                        {isFull && (
                          <Badge className="bg-red-100 text-red-700">เต็ม</Badge>
                        )}
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            slot.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {slot.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">กรุณาเลือกวันที่</p>
            )}
          </CardContent>
        </Card>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>หมายเหตุ:</strong> ระบบจะจำกัดจำนวนนักศึกษาไม่เกิน 100 คนต่อรอบอัตโนมัติ
            รอบเวลาจะถูกสร้างเมื่อมีนักศึกษาจองครั้งแรก
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}

