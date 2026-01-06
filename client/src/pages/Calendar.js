import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiCalendar, FiClock, FiPlus, FiRefreshCw, FiX } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Calendar = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    event_type: 'general',
    module_id: ''
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchEvents();
    
    const interval = setInterval(() => {
      fetchEvents(true);
    }, 15000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEvents = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const response = await axios.get(`${API_URL}/calendar`);
      
      setEvents(prevEvents => {
        const dataChanged = JSON.stringify(prevEvents) !== JSON.stringify(response.data);
        return dataChanged ? response.data : prevEvents;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch events:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดกิจกรรมได้';
        setError(errorMessage);
        showToast(errorMessage, 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.event_date) {
      showToast('กรุณากรอกข้อมูลให้ครบถ้วน', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/calendar`, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim()
      });
      showToast('สร้างกิจกรรมสำเร็จ', 'success');
      setShowModal(false);
      setFormData({
        title: '',
        description: '',
        event_date: '',
        end_date: '',
        event_type: 'general',
        module_id: ''
      });
      fetchEvents();
    } catch (error) {
      console.error('Failed to create event:', error);
      const errorMessage = error.response?.data?.error || 'สร้างกิจกรรมไม่สำเร็จ';
      showToast(errorMessage, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventDate = new Date(event.event_date).toISOString().split('T')[0];
      return eventDate === dateStr;
    });
  };

  // Group events by type
  const upcomingEvents = useMemo(() => {
    return events
      .filter(event => new Date(event.event_date) >= new Date())
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
      .slice(0, 5);
  }, [events]);

  const todayEvents = useMemo(() => {
    return getEventsForDate(selectedDate);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events, selectedDate]);

  const getEventTypeConfig = (type) => {
    const configs = {
      exam: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-500', label: 'สอบ' },
      assignment: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500', label: 'งาน' },
      lecture: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500', label: 'บรรยาย' },
      general: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-500', label: 'ทั่วไป' }
    };
    return configs[type] || configs.general;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-10 bg-gray-200 rounded-xl w-64 mb-3 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </div>
      </div>
    );
  }

  const isAdminOrInstructor = user?.role === 'admin' || user?.role === 'instructor';

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-pink-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                ปฏิทินกิจกรรม
              </h1>
              <p className="text-base text-gray-600">ดูและจัดการกิจกรรมทั้งหมด</p>
              {lastUpdate && (
                <p className="text-xs text-gray-500 mt-2 flex items-center space-x-2">
                  <FiRefreshCw size={14} className="animate-spin" />
                  <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                </p>
              )}
            </div>
            {isAdminOrInstructor && (
              <button
                onClick={() => setShowModal(true)}
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <FiPlus size={18} />
                <span>เพิ่มกิจกรรม</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-2 space-y-4">
            {/* Date Selector */}
            <div className="bg-white rounded-xl shadow-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedDate.toLocaleDateString('th-TH', { year: 'numeric', month: 'long' })}
                </h2>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Events for Selected Date */}
              <div className="space-y-4">
                {todayEvents.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                    <FiCalendar className="mx-auto text-gray-400 mb-3" size={32} />
                    <p className="text-gray-500 text-sm">ไม่มีกิจกรรมในวันนี้</p>
                  </div>
                ) : (
                  todayEvents.map((event) => {
                    const typeConfig = getEventTypeConfig(event.event_type);
                    return (
                      <EventCard key={event.event_id} event={event} typeConfig={typeConfig} />
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Upcoming Events Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-xl p-6">
              <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center space-x-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FiClock className="text-purple-600" size={20} />
                </div>
                <span>กิจกรรมที่กำลังจะมาถึง</span>
              </h2>
              
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-xl">
                  <p className="text-gray-500 text-sm">ไม่มีกิจกรรมที่กำลังจะมาถึง</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => {
                    const typeConfig = getEventTypeConfig(event.event_type);
                    return (
                      <div
                        key={event.event_id}
                        className={`border-l-4 ${typeConfig.border} bg-gradient-to-r ${typeConfig.bg} to-white rounded-xl p-4 hover:shadow-lg transition-all`}
                      >
                        <h3 className="font-bold text-gray-800 text-sm mb-2">{event.title}</h3>
                        {event.description && (
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">{event.description}</p>
                        )}
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          <FiClock size={14} />
                          <span className="font-semibold">
                            {new Date(event.event_date).toLocaleDateString('th-TH', { 
                              day: 'numeric', 
                              month: 'short', 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Event Modal */}
        {showModal && isAdminOrInstructor && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 transform transition-all animate-in fade-in zoom-in">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">เพิ่มกิจกรรม</h2>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setFormData({
                      title: '',
                      description: '',
                      event_date: '',
                      end_date: '',
                      event_type: 'general',
                      module_id: ''
                    });
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <FiX size={24} className="text-gray-500" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อ *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่และเวลาเริ่มต้น *</label>
                    <input
                      type="datetime-local"
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">วันที่และเวลาสิ้นสุด</label>
                    <input
                      type="datetime-local"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ประเภท</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 focus:outline-none transition-all bg-white"
                  >
                    <option value="general">ทั่วไป</option>
                    <option value="exam">สอบ</option>
                    <option value="assignment">งาน</option>
                    <option value="lecture">บรรยาย</option>
                  </select>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setFormData({
                        title: '',
                        description: '',
                        event_date: '',
                        end_date: '',
                        event_type: 'general',
                        module_id: ''
                      });
                    }}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white rounded-xl transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        <span>กำลังสร้าง...</span>
                      </>
                    ) : (
                      <>
                        <FiPlus size={18} />
                        <span>สร้างกิจกรรม</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
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

// Event Card Component
const EventCard = ({ event, typeConfig }) => {
  return (
    <div className={`border-l-4 ${typeConfig.border} bg-white rounded-xl p-6 hover:shadow-xl transition-all duration-300`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeConfig.bg} ${typeConfig.text}`}>
              {typeConfig.label}
            </span>
            <h3 className="text-lg font-bold text-gray-800">{event.title}</h3>
          </div>
          {event.description && (
            <p className="text-gray-600 mb-4 leading-relaxed text-sm">{event.description}</p>
          )}
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <FiClock size={16} />
            <span className="font-semibold">
              {new Date(event.event_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
              {event.end_date && ` - ${new Date(event.end_date).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
