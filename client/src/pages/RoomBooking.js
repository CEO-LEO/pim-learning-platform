import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { 
  FiHome, 
  FiClock, 
  FiCalendar, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiTrash2, 
  FiInfo,
  FiRefreshCw,
  FiX,
  FiUsers
} from 'react-icons/fi';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const RoomBooking = () => {
  const [rooms, setRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchInitialData();
    
    const interval = setInterval(() => {
      fetchInitialData(true);
    }, 5000);
    
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchInitialData(true);
      }
    };
    
    const handleFocus = () => {
      fetchInitialData(true);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchInitialData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [roomsRes, myBookingsRes] = await Promise.all([
        axios.get(`${API_URL}/rooms/list`),
        axios.get(`${API_URL}/rooms/my-bookings`)
      ]);
      
      setRooms(prevRooms => {
        if (!prevRooms || prevRooms.length !== roomsRes.data.length) {
          return roomsRes.data;
        }
        const hasChanges = prevRooms.some((prevRoom, idx) => {
          const newRoom = roomsRes.data[idx];
          if (!newRoom) return true;
          return prevRoom.room_id !== newRoom.room_id ||
                 prevRoom.status !== newRoom.status;
        });
        return hasChanges ? roomsRes.data : prevRooms;
      });
      
      setMyBookings(prevBookings => {
        if (!prevBookings || prevBookings.length !== myBookingsRes.data.length) {
          return myBookingsRes.data;
        }
        const hasChanges = prevBookings.some((prevBooking, idx) => {
          const newBooking = myBookingsRes.data[idx];
          if (!newBooking) return true;
          return prevBooking.booking_id !== newBooking.booking_id ||
                 prevBooking.status !== newBooking.status ||
                 prevBooking.booking_date !== newBooking.booking_date;
        });
        return hasChanges ? myBookingsRes.data : prevBookings;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch data:', error);
        showToast('ไม่สามารถโหลดข้อมูลได้', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleBook = async () => {
    if (!selectedRoom) {
      showToast('กรุณาเลือกห้อง', 'warning');
      return;
    }
    
    if (startTime >= endTime) {
      showToast('เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด', 'warning');
      return;
    }
    
    setBooking(true);
    try {
      await axios.post(`${API_URL}/rooms/book`, {
        room_id: selectedRoom.room_id,
        booking_date: bookingDate,
        start_time: startTime,
        end_time: endTime
      });
      showToast('จองห้องสำเร็จ!', 'success');
      
      setTimeout(async () => {
        await fetchInitialData(false);
      }, 300);
      
      setSelectedRoom(null);
      setBookingDate(new Date().toISOString().split('T')[0]);
      setStartTime('09:00');
      setEndTime('10:00');
    } catch (error) {
      console.error('Book error:', error);
      showToast(error.response?.data?.error || 'การจองล้มเหลว', 'error');
    } finally {
      setBooking(false);
    }
  };

  const handleCancelClick = (bookingId) => {
    setShowCancelConfirm(bookingId);
  };

  const confirmCancel = async () => {
    if (!showCancelConfirm) return;
    
    setCancelling(true);
    try {
      await axios.post(`${API_URL}/rooms/cancel`, { booking_id: showCancelConfirm });
      showToast('ยกเลิกการจองสำเร็จ', 'success');
      setShowCancelConfirm(null);
      
      setTimeout(async () => {
        await fetchInitialData(false);
      }, 300);
    } catch (error) {
      console.error('Cancel error:', error);
      showToast(error.response?.data?.error || 'ยกเลิกล้มเหลว', 'error');
    } finally {
      setCancelling(false);
    }
  };

  // Filter bookings
  const activeBookings = useMemo(() => 
    myBookings.filter(b => b.status !== 'cancelled'),
    [myBookings]
  );

  const cancelledBookings = useMemo(() => 
    myBookings.filter(b => b.status === 'cancelled'),
    [myBookings]
  );

  // Generate time options
  const timeOptions = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => i + 8).map(h => ({
      value: `${h.toString().padStart(2, '0')}:00`,
      label: `${h.toString().padStart(2, '0')}:00 น.`
    }));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-32 bg-gray-200 rounded-2xl mb-8 animate-pulse"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-gray-200 rounded w-64 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-48 bg-gray-200 rounded-2xl animate-pulse"></div>
                ))}
              </div>
            </div>
            <div className="h-96 bg-gray-200 rounded-2xl animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Hero Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-3xl p-20 md:p-24 text-white shadow-2xl mb-20 transform transition-all hover:scale-[1.01]">
          <div className="flex items-center justify-between flex-wrap gap-8">
            <div className="flex-1">
              <h1 className="text-7xl sm:text-8xl md:text-9xl font-bold mb-10">
                จองห้องเข้าใช้งาน
              </h1>
              <p className="text-3xl md:text-4xl lg:text-5xl text-indigo-100 mb-8">
                จองห้องปฏิบัติการสำหรับฝึกซ้อมด้วยตัวเอง หรือใช้งานสิ่งอำนวยความสะดวกในศูนย์ Demo Store
              </p>
              {lastUpdate && (
                <p className="text-xl text-indigo-200 mt-6 flex items-center space-x-3">
                  <FiRefreshCw size={24} className="animate-spin" />
                  <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                </p>
              )}
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-10 border-2 border-white/30 shadow-xl">
              <div className="text-6xl font-bold mb-3">{activeBookings.length}</div>
              <div className="text-xl text-indigo-100 font-semibold">การจองที่ใช้งานอยู่</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Room Selection Section */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-6xl font-bold text-gray-800 flex items-center space-x-6">
                <div className="p-6 bg-indigo-100 rounded-3xl">
                  <FiHome className="text-indigo-600" size={48} />
                </div>
                <span>เลือกห้องที่ต้องการจอง</span>
              </h2>
            </div>

            {/* Room Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {rooms.map((room) => (
                <div
                  key={room.room_id}
                  onClick={() => setSelectedRoom(room)}
                  className={`group relative cursor-pointer rounded-3xl p-14 border-4 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 overflow-hidden ${
                    selectedRoom?.room_id === room.room_id
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 via-white to-purple-50 ring-4 ring-indigo-200'
                      : 'border-white bg-white hover:border-indigo-300 bg-gradient-to-br from-indigo-50/30 via-white to-purple-50/30'
                  }`}
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <div className="relative z-10 flex items-start space-x-8 mb-8">
                    <div className={`p-6 rounded-3xl transition-all duration-300 shadow-lg border-2 ${
                      selectedRoom?.room_id === room.room_id
                        ? 'bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-xl scale-110 border-indigo-300 transform group-hover:rotate-12'
                        : 'bg-gradient-to-br from-indigo-100 to-purple-100 text-indigo-600 group-hover:scale-110 border-indigo-200'
                    }`}>
                      <FiHome size={48} className="drop-shadow-lg" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-4xl font-bold text-gray-800 mb-3">{room.name}</h3>
                      <div className="flex items-center space-x-4 text-gray-600">
                        <FiUsers size={28} />
                        <span className="font-bold text-2xl">รองรับ {room.capacity} ท่าน</span>
                      </div>
                    </div>
                    {selectedRoom?.room_id === room.room_id && (
                      <div className="bg-indigo-500 text-white rounded-full p-4">
                        <FiCheckCircle size={36} />
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 leading-relaxed text-2xl">{room.description}</p>
                </div>
              ))}
            </div>

            {/* Booking Form */}
            {selectedRoom && (
              <div className="bg-white rounded-3xl p-12 shadow-2xl border-2 border-indigo-500 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-3xl font-bold text-gray-800 flex items-center space-x-4">
                    <div className="p-3 bg-indigo-100 rounded-xl">
                      <FiInfo className="text-indigo-600" size={32} />
                    </div>
                    <span>ระบุวันและเวลาที่จอง</span>
                  </h3>
                  <button
                    onClick={() => setSelectedRoom(null)}
                    className="p-3 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    <FiX size={32} className="text-gray-500" />
                  </button>
                </div>

                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-3xl p-8 mb-8">
                  <div className="flex items-center space-x-4 mb-5">
                    <FiHome className="text-indigo-600" size={32} />
                    <h4 className="text-2xl font-bold text-gray-800">{selectedRoom.name}</h4>
                  </div>
                  <p className="text-gray-600 text-lg">{selectedRoom.description}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <FiCalendar className="text-indigo-600" size={26} />
                      <span>วันที่จอง</span>
                    </label>
                    <input
                      type="date"
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-5 border-2 border-gray-200 rounded-xl text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <FiClock className="text-indigo-600" size={26} />
                      <span>เวลาเริ่ม</span>
                    </label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full p-5 border-2 border-gray-200 rounded-xl text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all bg-white"
                    >
                      {timeOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xl font-bold text-gray-700 mb-4 flex items-center space-x-3">
                      <FiClock className="text-indigo-600" size={26} />
                      <span>เวลาสิ้นสุด</span>
                    </label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full p-5 border-2 border-gray-200 rounded-xl text-xl focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 focus:outline-none transition-all bg-white"
                    >
                      {timeOptions.filter(opt => opt.value > startTime).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mt-10 flex space-x-5">
                  <button
                    onClick={handleBook}
                    disabled={booking}
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white py-6 rounded-xl text-2xl font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-3"
                  >
                    {booking ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
                        <span>กำลังจอง...</span>
                      </>
                    ) : (
                      <>
                        <FiCheckCircle size={32} />
                        <span>ยืนยันการจองห้อง</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedRoom(null);
                      setBookingDate(new Date().toISOString().split('T')[0]);
                      setStartTime('09:00');
                      setEndTime('10:00');
                    }}
                    className="px-10 py-6 border-2 border-gray-300 rounded-xl text-xl font-bold hover:bg-gray-50 text-gray-700 transition-all duration-200"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* My Bookings Sidebar */}
          <div className="space-y-10">
            <h2 className="text-4xl font-bold text-gray-800 flex items-center space-x-5">
              <div className="p-4 bg-green-100 rounded-2xl">
                <FiCheckCircle className="text-green-600" size={36} />
              </div>
              <span>การจองของฉัน</span>
            </h2>

            {myBookings.length === 0 ? (
              <div className="bg-white rounded-2xl p-10 text-center border-2 border-dashed border-gray-300 shadow-lg">
                <FiCalendar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-lg text-gray-600 font-medium">ยังไม่มีประวัติการจอง</p>
                <p className="text-sm text-gray-500 mt-2">เริ่มต้นด้วยการเลือกห้องด้านซ้าย</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Active Bookings */}
                {activeBookings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      การจองที่ใช้งานอยู่ ({activeBookings.length})
                    </h3>
                    {activeBookings.map((booking) => (
                      <BookingCard
                        key={booking.booking_id}
                        booking={booking}
                        onCancel={handleCancelClick}
                      />
                    ))}
                  </div>
                )}

                {/* Cancelled Bookings */}
                {cancelledBookings.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
                      การจองที่ยกเลิกแล้ว ({cancelledBookings.length})
                    </h3>
                    {cancelledBookings.map((booking) => (
                      <BookingCard
                        key={booking.booking_id}
                        booking={booking}
                        onCancel={null}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Cancel Confirmation Modal */}
        {showCancelConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 transform transition-all animate-in fade-in zoom-in">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                  <FiTrash2 className="text-red-600" size={32} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">ยืนยันการยกเลิก</h3>
                <p className="text-gray-600">คุณต้องการยกเลิกการจองห้องนี้หรือไม่?</p>
                <p className="text-sm text-gray-500 mt-2">การกระทำนี้ไม่สามารถยกเลิกได้</p>
              </div>
              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCancelConfirm(null)}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={confirmCancel}
                  disabled={cancelling}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
                >
                  {cancelling ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                      <span>กำลังยกเลิก...</span>
                    </>
                  ) : (
                    <>
                      <FiTrash2 size={18} />
                      <span>ยืนยันยกเลิก</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            duration={4000}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </div>
  );
};

// Booking Card Component
const BookingCard = ({ booking, onCancel }) => {
  const isCancelled = booking.status === 'cancelled';
  const bookingDate = new Date(booking.booking_date);
  const isPast = bookingDate < new Date();

  return (
    <div className={`bg-white rounded-3xl p-10 shadow-xl border-l-4 transition-all duration-300 hover:shadow-2xl ${
      isCancelled 
        ? 'border-gray-400 opacity-75' 
        : isPast
        ? 'border-green-500'
        : 'border-indigo-500'
    }`}>
      <div className="flex justify-between items-start mb-8">
        <div className="flex-1">
          <h4 className={`text-3xl font-bold mb-3 ${
            isCancelled ? 'text-gray-400 line-through' : 'text-gray-800'
          }`}>
            {booking.room_name}
          </h4>
          {isCancelled && (
            <span className="inline-flex items-center space-x-3 px-4 py-2 bg-red-100 text-red-700 rounded-full text-base font-bold">
              <FiAlertCircle size={20} />
              <span>ยกเลิกแล้ว</span>
            </span>
          )}
        </div>
        {onCancel && !isCancelled && (
          <button
            onClick={() => onCancel(booking.booking_id)}
            className="p-4 text-red-500 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
            title="ยกเลิกการจอง"
          >
            <FiTrash2 size={28} />
          </button>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-5 text-gray-700">
          <FiCalendar className="text-indigo-600 flex-shrink-0" size={28} />
          <span className="font-bold text-xl">
            {bookingDate.toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="flex items-center space-x-5 text-gray-700">
          <FiClock className="text-indigo-600 flex-shrink-0" size={28} />
          <span className="font-bold text-xl">{booking.start_time} - {booking.end_time} น.</span>
        </div>
      </div>
    </div>
  );
};

export default RoomBooking;
