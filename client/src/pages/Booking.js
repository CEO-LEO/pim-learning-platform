import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { FiCalendar, FiClock, FiUsers, FiCheckCircle, FiAlertCircle, FiTrash2, FiMapPin, FiRefreshCw, FiX, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import Toast from '../components/Toast';
import { CardSkeleton } from '../components/LoadingSkeleton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Booking = () => {
  const [slots, setSlots] = useState([]);
  const [registration, setRegistration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [booking, setBooking] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchSlots();
    
    const interval = setInterval(() => {
      fetchSlots(true);
    }, 5000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchSlots(true);
      }
    };
    
    const handleFocus = () => {
      fetchSlots(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchSlots = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const response = await axios.get(`${API_URL}/practical/slots`);
      
      setSlots(prevSlots => {
        if (!prevSlots || prevSlots.length !== response.data.slots.length) {
          return response.data.slots;
        }
        const hasChanges = prevSlots.some((prevSlot, idx) => {
          const newSlot = response.data.slots[idx];
          if (!newSlot) return true;
          return prevSlot.exam_id !== newSlot.exam_id ||
                 prevSlot.remaining_count !== newSlot.remaining_count ||
                 prevSlot.status !== newSlot.status;
        });
        return hasChanges ? response.data.slots : prevSlots;
      });
      
      setRegistration(prevReg => {
        const newReg = response.data.userRegistration;
        if (!prevReg && !newReg) return null;
        if (!prevReg || !newReg) return newReg;
        return prevReg.registration_id !== newReg.registration_id ||
               prevReg.status !== newReg.status ? newReg : prevReg;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
      console.error('Failed to fetch slots:', error);
      showToast('ไม่สามารถโหลดข้อมูลรอบการจองได้', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleBook = async (examId, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log('🚀 handleBook called with:', { examId, hasRegistration: !!registration });
    
    if (!examId) {
      console.error('❌ No exam ID provided');
      showToast('ไม่พบข้อมูลรอบการจอง', 'error');
      return;
    }

    // Check if already registered
    if (registration) {
      console.log('⚠️ Already registered:', registration);
      showToast('คุณมีการจองรอบฝึกปฏิบัติอยู่แล้ว', 'warning');
      return;
    }

    // Confirmation dialog
    const confirmed = window.confirm('ยืนยันการจองรอบฝึกปฏิบัตินี้? (จองได้เพียงรอบเดียว)');
    console.log('📋 Confirmation:', confirmed);
    
    if (!confirmed) {
      return;
    }

    setBooking(examId);
    try {
      console.log('📤 Sending booking request:', { exam_id: examId, API_URL });
      const response = await axios.post(`${API_URL}/practical/book`, { exam_id: examId });
      console.log('✅ Booking response:', response.data);
      showToast('จองรอบฝึกปฏิบัติสำเร็จ!', 'success');
      
      setTimeout(async () => {
        console.log('🔄 Refreshing slots...');
        await fetchSlots(false);
      }, 300);
    } catch (error) {
      console.error('❌ Booking error:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
      const errorMessage = error.response?.data?.error || error.message || 'การจองล้มเหลว';
      showToast(errorMessage, 'error');
    } finally {
      setBooking(null);
    }
  };

  const handleCancelClick = () => {
    setShowCancelConfirm(true);
  };

  const confirmCancel = async () => {
    if (!registration) return;

    setCancelling(true);
    try {
      await axios.post(`${API_URL}/practical/cancel`, { registration_id: registration.registration_id });
      showToast('ยกเลิกการจองเรียบร้อยแล้ว', 'success');
      setShowCancelConfirm(false);
      
      setTimeout(async () => {
        await fetchSlots(false);
      }, 300);
    } catch (error) {
      console.error('Cancel error:', error);
      showToast(error.response?.data?.error || 'การยกเลิกล้มเหลว', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const bookedSlot = useMemo(() => {
    if (!registration) return null;
    return slots.find(s => s.exam_id === registration.exam_id);
  }, [registration, slots]);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // Group slots by date
  const slotsByDate = useMemo(() => {
    const grouped = {};
    slots.forEach(slot => {
      const dateKey = slot.date;
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(slot);
    });
    return grouped;
  }, [slots]);

  // Calendar functions
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const formatDateKey = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const calendarDays = getDaysInMonth(currentMonth);
  const monthName = currentMonth.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' });

  if (loading) {
  return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-80 mb-3 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Hero Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 rounded-2xl p-8 md:p-10 text-white shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">จองรอบฝึกปฏิบัติ (Practical Training)</h1>
                <p className="text-lg md:text-xl lg:text-2xl text-purple-50 mb-4">เลือกวันและเวลาที่สะดวกเพื่อเข้าฝึกปฏิบัติที่ร้าน 7-Eleven Demonstration Store (จำกัด 100 ท่าน/รอบ)</p>
                {lastUpdate && (
                  <p className="text-sm text-purple-200 mt-4 flex items-center space-x-2">
                    <FiRefreshCw size={16} className="animate-spin" />
                    <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                  </p>
                )}
            </div>
            </div>
          </div>
        </div>

        {/* Booked Slot Display */}
        {registration && bookedSlot ? (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 rounded-2xl shadow-xl border-2 border-green-400 p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 text-white rounded-2xl shadow-lg">
                    <FiCheckCircle size={32} />
            </div>
            <div>
                    <h2 className="text-2xl font-bold text-green-800 mb-2">คุณได้จองรอบฝึกปฏิบัติแล้ว</h2>
                    <p className="text-lg text-green-600">กรุณาเตรียมบัตรนักศึกษาและมาให้ตรงเวลา</p>
                  </div>
            </div>
          </div>
          
              <div className="bg-white rounded-xl p-6 border-2 border-green-200 shadow-md mb-6">
                <div className="space-y-4">
                  <div className="flex items-center text-lg space-x-3">
                    <FiCalendar className="text-green-600 flex-shrink-0" size={20} />
                    <span className="font-bold text-gray-800">วันที่: {bookedSlot.date}</span>
                  </div>
                  <div className="flex items-center text-lg space-x-3">
                    <FiClock className="text-green-600 flex-shrink-0" size={20} />
                    <span className="font-bold text-gray-800">เวลา: {bookedSlot.start_time} - {bookedSlot.end_time} น.</span>
            </div>
                  <div className="flex items-center text-lg space-x-3">
                    <FiMapPin className="text-green-600 flex-shrink-0" size={20} />
                    <span className="font-bold text-gray-800">สถานที่: 7-Eleven Demonstration Store ชั้น 2</span>
            </div>
            </div>
          </div>

          <button
                onClick={handleCancelClick}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-bold text-lg transition-colors"
          >
                <FiTrash2 size={20} />
            <span>ยกเลิกการจอง</span>
          </button>
            </div>
        </div>
        ) : (
          <div className="mb-8">
            {/* Calendar Header */}
            <div className="bg-white rounded-3xl shadow-xl p-8 mb-8 border border-gray-100">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl md:text-5xl font-bold text-gray-800 flex items-center space-x-4">
                  <div className="p-4 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-2xl shadow-lg">
                    <FiCalendar size={32} />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                    {monthName}
                  </span>
                </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => navigateMonth(-1)}
                    className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl transition-all transform hover:scale-110 shadow-md"
                  >
                    <FiChevronLeft size={24} className="text-purple-600" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(new Date())}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl font-bold text-base transition-all transform hover:scale-105 shadow-lg"
                  >
                    วันนี้
                  </button>
                  <button
                    onClick={() => navigateMonth(1)}
                    className="p-3 bg-gradient-to-br from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 rounded-xl transition-all transform hover:scale-110 shadow-md"
                  >
                    <FiChevronRight size={24} className="text-purple-600" />
                  </button>
                </div>
                </div>
                
              {/* Instructions */}
              {!selectedDate && slots.length > 0 && (
                <div className="bg-gradient-to-r from-purple-100 via-indigo-100 to-pink-100 rounded-2xl p-5 mb-6 border-2 border-purple-200 shadow-md">
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <FiAlertCircle className="text-purple-600 flex-shrink-0" size={24} />
                    </div>
                    <p className="text-base md:text-lg text-purple-800 font-bold">
                      💡 คลิกที่วันที่ที่มีรอบการจอง (สีเขียว) เพื่อดูรายละเอียดและจองรอบ
                    </p>
                  </div>
                </div>
              )}

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-3 md:gap-4">
                {/* Day headers */}
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, idx) => (
                  <div key={idx} className="text-center py-3">
                    <span className="text-base md:text-lg font-bold text-gray-700 bg-gray-50 px-3 py-2 rounded-xl inline-block">{day}</span>
                  </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="aspect-square"></div>;
                  }

                  const dateKey = formatDateKey(day);
                  const daySlots = slotsByDate[dateKey] || [];
                  const hasSlots = daySlots.length > 0;
                  const dayIsPast = isPast(day);
                  const dayIsToday = isToday(day);
                  const isSelected = selectedDate && formatDateKey(selectedDate) === dateKey;

                  return (
                    <div
                      key={dateKey}
                      className={`aspect-square border-2 rounded-xl p-3 md:p-4 transition-all duration-300 ${
                        dayIsPast
                          ? 'bg-gray-50 border-gray-200 opacity-40 cursor-not-allowed'
                          : dayIsToday
                          ? 'bg-gradient-to-br from-purple-100 to-indigo-100 border-purple-400 ring-4 ring-purple-200 shadow-lg'
                          : isSelected
                          ? 'bg-gradient-to-br from-indigo-100 to-purple-100 border-indigo-400 ring-4 ring-indigo-200 shadow-xl'
                          : hasSlots
                          ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400 hover:border-green-500 hover:shadow-xl cursor-pointer transform hover:scale-110 hover:-translate-y-1'
                          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-md'
                      }`}
                      onClick={() => {
                        if (!dayIsPast && hasSlots) {
                          setSelectedDate(day);
                        }
                      }}
                      title={hasSlots && !dayIsPast ? `คลิกเพื่อดูรอบการจองในวันที่ ${day.getDate()}` : ''}
                    >
                      <div className="flex flex-col h-full">
                        <div className={`text-xl md:text-2xl font-bold mb-2 ${
                          dayIsToday ? 'text-purple-700' : 'text-gray-800'
                        }`}>
                          {day.getDate()}
                        </div>
                        {hasSlots && (
                          <div className="flex-1 flex flex-col gap-1.5 justify-end">
                            {daySlots.slice(0, 2).map((slot) => {
                              const isFull = slot.remaining_count <= 0;
                              const endHour = slot.end_time ? slot.end_time.split(':')[0] : '';
                              return (
                                <div
                                  key={slot.exam_id}
                                  className={`text-[10px] md:text-xs px-2 py-1 rounded-lg font-bold leading-tight shadow-sm ${
                                    isFull
                                      ? 'bg-red-300 text-red-800 border border-red-400'
                                      : slot.remaining_count < 10
                                      ? 'bg-orange-300 text-orange-800 border border-orange-400'
                                      : 'bg-green-300 text-green-800 border border-green-400'
                  }`}
                                  title={`${slot.start_time} - ${slot.end_time} น. (${slot.remaining_count}/${slot.limit_count} ที่นั่ง)`}
                                >
                                  {slot.start_time}{endHour ? `-${endHour}` : ''}
                                </div>
                              );
                            })}
                            {daySlots.length > 2 && (
                              <div className="text-[10px] md:text-xs text-purple-600 font-bold bg-purple-100 px-2 py-1 rounded-lg">
                                +{daySlots.length - 2} รอบ
                              </div>
                            )}
                            {!dayIsPast && hasSlots && (
                              <div className="text-[10px] md:text-xs text-purple-700 font-bold mt-1 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
                                👆 คลิก
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Slots */}
            {selectedDate && slotsByDate[formatDateKey(selectedDate)] && (
              <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-10 border-2 border-purple-300 relative overflow-hidden">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-3xl md:text-4xl font-bold text-gray-800 flex items-center space-x-3 mb-2">
                        <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl shadow-lg">
                          <FiCalendar size={28} />
                        </div>
                        <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                          {selectedDate.toLocaleDateString('th-TH', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </h3>
                      <p className="text-base md:text-lg text-gray-600 ml-14 font-semibold">เลือกรอบที่ต้องการจอง</p>
                    </div>
                    <button
                      onClick={() => setSelectedDate(null)}
                      className="p-3 hover:bg-gray-100 rounded-xl transition-all transform hover:scale-110 shadow-md"
                      title="ปิด"
                    >
                      <FiX size={24} className="text-gray-500" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {slotsByDate[formatDateKey(selectedDate)].map((slot) => {
                    if (!slot || !slot.exam_id) {
                      console.error('Invalid slot:', slot);
                      return null;
                    }
                    
                    const isFull = slot.remaining_count <= 0;
                    const isBooking = booking === slot.exam_id;
                    
                    return (
                      <div
                        key={slot.exam_id}
                        className={`group relative bg-gradient-to-br ${
                          isFull
                            ? 'from-gray-50 to-gray-100'
                            : 'from-purple-50 via-indigo-50 to-pink-50'
                        } rounded-2xl shadow-lg border-2 ${
                          isFull
                            ? 'border-gray-300 opacity-60'
                            : 'border-purple-300 hover:border-purple-500'
                        } p-6 md:p-7 transition-all transform hover:scale-105 hover:shadow-2xl overflow-hidden`}
                        style={{ pointerEvents: 'auto' }}
                      >
                        {/* Shine effect */}
                        {!isFull && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        )}
                        
                        <div className="space-y-5 relative z-10" style={{ pointerEvents: 'none' }}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-500 text-white rounded-xl shadow-lg">
                                <FiClock size={24} />
                              </div>
                <div>
                                <span className="text-xl md:text-2xl font-bold text-gray-800 block">
                                  {slot.start_time} - {slot.end_time} น.
                                </span>
                                <span className="text-sm text-gray-600 font-semibold">รอบฝึกปฏิบัติ</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between bg-white rounded-xl p-4 border-2 border-gray-200 shadow-sm">
                            <span className="text-base md:text-lg font-bold text-gray-700">ที่นั่งว่าง</span>
                            <span className={`px-4 py-2 rounded-full font-bold text-base md:text-lg shadow-md ${
                              isFull
                                ? 'bg-red-200 text-red-700 border-2 border-red-300'
                                : slot.remaining_count < 10
                                ? 'bg-orange-200 text-orange-700 border-2 border-orange-300'
                                : 'bg-green-200 text-green-700 border-2 border-green-300'
                            }`}>
                              {slot.remaining_count} / {slot.limit_count}
                            </span>
                          </div>

                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              
                              console.log('🔵 Button clicked!', {
                                exam_id: slot.exam_id,
                                isFull,
                                isBooking,
                                hasRegistration: !!registration,
                                slot: slot,
                                disabled: isFull || isBooking || !!registration
                              });
                              
                              if (!slot.exam_id) {
                                console.error('❌ No exam_id in slot:', slot);
                                showToast('ไม่พบข้อมูลรอบการจอง', 'error');
                                return;
                              }

                              if (isFull) {
                                showToast('รอบนี้เต็มแล้ว', 'warning');
                                return;
                              }

                              if (registration) {
                                showToast('คุณมีการจองรอบฝึกปฏิบัติอยู่แล้ว', 'warning');
                                return;
                              }

                              if (isBooking) {
                                console.log('⏳ Already booking...');
                                return;
                              }

                              console.log('✅ Calling handleBook with exam_id:', slot.exam_id);
                              handleBook(slot.exam_id, e);
                            }}
                            disabled={isFull || isBooking || !!registration}
                            className={`w-full py-4 md:py-5 rounded-xl font-bold text-lg md:text-xl shadow-lg transition-all relative z-50 transform hover:scale-105 active:scale-95 ${
                              isFull || registration
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                                : isBooking
                                ? 'bg-purple-400 text-white cursor-wait'
                                : 'bg-gradient-to-r from-purple-600 via-indigo-600 to-pink-600 text-white hover:from-purple-700 hover:via-indigo-700 hover:to-pink-700 cursor-pointer shadow-xl'
                            }`}
                            type="button"
                            style={{ 
                              pointerEvents: 'auto',
                              position: 'relative',
                              zIndex: 100
                            }}
                          >
                            {isBooking ? (
                              <span className="flex items-center justify-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-3 border-white border-t-transparent"></div>
                                <span>กำลังจอง...</span>
                              </span>
                            ) : isFull ? (
                              <span className="flex items-center justify-center space-x-3">
                                <FiAlertCircle size={24} />
                                <span>รอบเต็มแล้ว</span>
                              </span>
                            ) : registration ? (
                              <span className="flex items-center justify-center space-x-3">
                                <FiCheckCircle size={24} />
                                <span>จองแล้ว</span>
                              </span>
                            ) : (
                              <span className="flex items-center justify-center space-x-3">
                                <FiCheckCircle size={24} />
                                <span>จองรอบนี้</span>
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              </div>
            )}

            {/* No date selected hint */}
            {!selectedDate && slots.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-dashed border-purple-300 text-center">
                <FiCalendar className="mx-auto text-purple-400 mb-3" size={40} />
                <p className="text-lg text-gray-600 font-bold">คลิกที่วันที่ในปฏิทินเพื่อดูรอบการจอง</p>
              </div>
            )}

            {slots.length === 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-16 text-center border-2 border-dashed border-gray-300">
                <FiCalendar className="mx-auto text-gray-400 mb-6" size={80} />
                <h3 className="text-4xl font-bold text-gray-700 mb-4">ไม่มีรอบการจองที่เปิดให้บริการ</h3>
                <p className="text-2xl text-gray-500">กรุณาตรวจสอบอีกครั้งในภายหลัง</p>
              </div>
            )}
          </div>
        )}

        {/* Requirements Section */}
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-md mb-8">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl flex-shrink-0">
              <FiAlertCircle size={24} className="text-blue-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-blue-800 mb-3">ข้อกำหนดการฝึกปฏิบัติ</h3>
              <ul className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>กรุณาแต่งกายชุดนักศึกษาให้เรียบร้อย</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>นำสมุดจดบันทึกและอุปกรณ์การเขียนมาให้พร้อม</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>สามารถยกเลิกและเปลี่ยนรอบได้ไม่เกิน 24 ชม. ก่อนเริ่ม</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {showCancelConfirm && (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full p-12 border-4 border-red-200">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-4xl font-bold text-gray-800 flex items-center space-x-4">
              <div className="p-4 bg-red-100 rounded-2xl">
                <FiAlertCircle className="text-red-600" size={40} />
              </div>
              <span>ยืนยันการยกเลิก</span>
            </h3>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <FiX size={32} className="text-gray-500" />
            </button>
          </div>
        
          <p className="text-2xl text-gray-700 mb-10">
            คุณต้องการยกเลิกการจองรอบฝึกปฏิบัตินี้ใช่หรือไม่?
          </p>
        
          {bookedSlot && (
            <div className="bg-gray-50 rounded-2xl p-8 mb-10 border-2 border-gray-200">
              <div className="space-y-4 text-xl">
                <div className="flex items-center space-x-4">
                  <FiCalendar className="text-gray-600" size={28} />
                  <span className="font-bold">วันที่: {bookedSlot.date}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <FiClock className="text-gray-600" size={28} />
                  <span className="font-bold">เวลา: {bookedSlot.start_time} - {bookedSlot.end_time} น.</span>
                </div>
              </div>
            </div>
          )}
        
          <div className="flex items-center justify-end space-x-4">
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="px-8 py-4 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl font-bold text-xl transition-colors"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmCancel}
              disabled={cancelling}
              className="px-8 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-3"
            >
              {cancelling ? (
                <>
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
                  <span>กำลังยกเลิก...</span>
                </>
              ) : (
                <>
                  <FiTrash2 size={24} />
                  <span>ยืนยันยกเลิก</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Booking;
