import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FiCalendar, FiClock, FiUsers, FiDownload, FiRefreshCw, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import Toast from '../components/Toast';
import { CardSkeleton } from '../components/LoadingSkeleton';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const PracticalRegistrations = () => {
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingRegistrations, setLoadingRegistrations] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSlots = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/practical/all-slots`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(response.data);
    } catch (error) {
      console.error('Failed to fetch slots:', error);
      if (error.response?.status === 403) {
        showToast('คุณไม่มีสิทธิ์เข้าถึงหน้านี้', 'error');
      } else {
        showToast('ไม่สามารถโหลดข้อมูลรอบสอบได้', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchRegistrations = async (examId) => {
    if (selectedSlot === examId) {
      setSelectedSlot(null);
      setRegistrations([]);
      return;
    }

    try {
      setLoadingRegistrations(true);
      setSelectedSlot(examId);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/practical/registrations/${examId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRegistrations(response.data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
      showToast('ไม่สามารถโหลดรายชื่อผู้จองได้', 'error');
      setSelectedSlot(null);
      setRegistrations([]);
    } finally {
      setLoadingRegistrations(false);
    }
  };

  const exportToCSV = (slot, registrations) => {
    const headers = ['ลำดับ', 'รหัสนักศึกษา', 'ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทร', 'ชั้นปี', 'วันที่จอง'];
    const rows = registrations.map((reg, index) => [
      index + 1,
      reg.student_id || '-',
      reg.name || '-',
      reg.email || '-',
      reg.phone || '-',
      reg.year_level || '-',
      reg.registered_at ? new Date(reg.registered_at).toLocaleString('th-TH') : '-'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `รายชื่อผู้จอง_${slot.date}_${slot.start_time.replace(':', '')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('th-TH', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '2rem', paddingBottom: '3rem' }}>
        <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-2xl p-8 md:p-10 text-white shadow-xl">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">รายชื่อผู้จองรอบฝึกปฏิบัติ</h1>
                <p className="text-lg md:text-xl lg:text-2xl text-blue-50">ดูรายชื่อผู้จองในแต่ละรอบสอบ</p>
              </div>
              <button
                onClick={fetchSlots}
                className="p-4 bg-white/20 hover:bg-white/30 rounded-xl transition-all transform hover:scale-110"
                title="รีเฟรชข้อมูล"
              >
                <FiRefreshCw size={28} />
              </button>
            </div>
          </div>
        </div>

        {/* Slots List */}
        <div className="space-y-4">
          {slots.map((slot) => {
            const isExpanded = selectedSlot === slot.exam_id;
            const slotRegistrations = isExpanded ? registrations : [];

            return (
              <div
                key={slot.exam_id}
                className="bg-white rounded-2xl shadow-lg border-2 border-gray-200 overflow-hidden"
              >
                {/* Slot Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => fetchRegistrations(slot.exam_id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-500 text-white rounded-xl">
                          <FiCalendar size={24} />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-gray-800">
                            {formatDate(slot.date)}
                          </h3>
                          <div className="flex items-center space-x-6 mt-2 text-lg text-gray-600">
                            <span className="flex items-center space-x-2">
                              <FiClock size={18} />
                              <span>{slot.start_time} - {slot.end_time} น.</span>
                            </span>
                            <span className="flex items-center space-x-2">
                              <FiUsers size={18} />
                              <span className="font-bold">
                                {slot.registered_count || 0} / {slot.limit_count} คน
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`px-4 py-2 rounded-full font-bold ${
                        slot.remaining_count > 0
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {slot.remaining_count > 0 ? `เหลือ ${slot.remaining_count} ที่นั่ง` : 'เต็มแล้ว'}
                      </div>
                      {isExpanded ? (
                        <FiChevronUp size={24} className="text-gray-400" />
                      ) : (
                        <FiChevronDown size={24} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Registrations List */}
                {isExpanded && (
                  <div className="border-t-2 border-gray-200 bg-gray-50">
                    {loadingRegistrations ? (
                      <div className="p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">กำลังโหลดรายชื่อ...</p>
                      </div>
                    ) : slotRegistrations.length > 0 ? (
                      <>
                        <div className="p-4 bg-white border-b-2 border-gray-200 flex items-center justify-between">
                          <h4 className="text-xl font-bold text-gray-800">
                            รายชื่อผู้จอง ({slotRegistrations.length} คน)
                          </h4>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToCSV(slot, slotRegistrations);
                            }}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-colors"
                          >
                            <FiDownload size={20} />
                            <span>ส่งออก CSV</span>
                          </button>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ลำดับ</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">รหัสนักศึกษา</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ชื่อ-นามสกุล</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">อีเมล</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">เบอร์โทร</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">ชั้นปี</th>
                                <th className="px-6 py-4 text-left text-sm font-bold text-gray-700">วันที่จอง</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {slotRegistrations.map((reg, index) => (
                                <tr key={reg.registration_id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-semibold">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                                    {reg.student_id || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-900">
                                    {reg.name || '-'}
                                  </td>
                                  <td className="px-6 py-4 text-sm text-gray-600">
                                    {reg.email || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.phone || '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.year_level ? `ปี ${reg.year_level}` : '-'}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                    {reg.registered_at
                                      ? new Date(reg.registered_at).toLocaleString('th-TH')
                                      : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="p-8 text-center text-gray-500">
                        <FiUsers size={48} className="mx-auto mb-4 text-gray-400" />
                        <p className="text-lg font-bold">ยังไม่มีผู้จองในรอบนี้</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {slots.length === 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-16 text-center border-2 border-dashed border-gray-300">
            <FiCalendar className="mx-auto text-gray-400 mb-6" size={80} />
            <h3 className="text-4xl font-bold text-gray-700 mb-4">ไม่มีรอบสอบ</h3>
            <p className="text-2xl text-gray-500">ยังไม่มีรอบสอบที่เปิดให้จอง</p>
          </div>
        )}

        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </div>
    </div>
  );
};

export default PracticalRegistrations;

