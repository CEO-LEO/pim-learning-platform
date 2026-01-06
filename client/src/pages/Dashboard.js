import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiBook, FiClock, FiCheckCircle, FiTrendingUp, FiPlay, FiAlertCircle, FiArrowRight, FiUsers, FiRefreshCw } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    fetchDashboardData();
    fetchModules();
    
    const interval = setInterval(() => {
      fetchDashboardData(true);
      fetchModules(true);
    }, 20000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async (silent = false) => {
    try {
      if (!silent) {
        setError(null);
        setLoading(true);
      }
      const response = await axios.get(`${API_URL}/analytics/dashboard`);
      
      setDashboardData(prevData => {
        const dataChanged = JSON.stringify(prevData) !== JSON.stringify(response.data);
        return dataChanged ? response.data : prevData;
      });
      
      if (!silent) setLastUpdate(new Date());
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch dashboard data:', error);
        const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่อีกครั้ง';
        setError(errorMessage);
        setToast({ message: errorMessage, type: 'error', id: Date.now() });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const fetchModules = async (silent = false) => {
    try {
      const response = await axios.get(`${API_URL}/videos/modules`);
      
      setModules(prevModules => {
        const dataChanged = JSON.stringify(prevModules) !== JSON.stringify(response.data || []);
        return dataChanged ? (response.data || []) : prevModules;
      });
    } catch (error) {
      if (!silent) {
        console.error('Failed to fetch modules:', error);
      }
    }
  };


  // Calculate total watch time - use total_seconds if available, otherwise fallback to total_hours
  const totalSeconds = dashboardData?.total_seconds || (dashboardData?.total_hours || 0) * 3600;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = totalSeconds / 3600;
  
  // Format display: show minutes if less than 1 hour, otherwise show hours with 2 decimal places
  const formatWatchTime = () => {
    if (totalSeconds === 0) return { value: 0, unit: 'นาที' };
    if (totalHours < 1) {
      return { value: totalMinutes, unit: 'นาที' };
    } else {
      return { value: parseFloat(totalHours.toFixed(2)), unit: 'ชั่วโมง' };
    }
  };
  
  const watchTimeDisplay = formatWatchTime();
  
  const completedModules = dashboardData?.modules?.filter(m => m.completion_rate === 100).length || 0;
  const totalModules = dashboardData?.modules?.length || 0;
  const pendingModules = totalModules - completedModules;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      label: 'เวลาเรียนสะสม',
      value: watchTimeDisplay.value,
      unit: watchTimeDisplay.unit,
      icon: FiClock,
      gradient: 'from-blue-500 to-cyan-500',
      bgGradient: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      textColor: 'text-blue-700',
      valueColor: 'text-blue-900'
    },
    {
      label: 'ผ่านแล้ว',
      value: completedModules,
      unit: 'Module',
      icon: FiCheckCircle,
      gradient: 'from-green-500 to-emerald-500',
      bgGradient: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      textColor: 'text-green-700',
      valueColor: 'text-green-900'
    },
    {
      label: 'ค้างอยู่',
      value: pendingModules,
      unit: 'Module',
      icon: FiBook,
      gradient: 'from-yellow-500 to-orange-500',
      bgGradient: 'from-yellow-50 to-yellow-100',
      borderColor: 'border-yellow-200',
      textColor: 'text-yellow-700',
      valueColor: 'text-yellow-900'
    },
    {
      label: 'ความคืบหน้า',
      value: progressPercent,
      unit: '%',
      icon: FiTrendingUp,
      gradient: 'from-purple-500 to-pink-500',
      bgGradient: 'from-purple-50 to-purple-100',
      borderColor: 'border-purple-200',
      textColor: 'text-purple-700',
      valueColor: 'text-purple-900'
    }
  ], [watchTimeDisplay, completedModules, pendingModules, progressPercent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="mb-4">
            <div className="h-8 bg-gray-200 rounded-lg w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
        <div className="max-w-[1600px] mx-auto px-4 lg:px-6">
          <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6 text-center">
            <FiAlertCircle className="mx-auto text-red-500 mb-3" size={32} />
            <h2 className="text-lg font-bold text-red-800 mb-2">เกิดข้อผิดพลาด</h2>
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <button
              onClick={() => fetchDashboardData(false)}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold text-sm"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '1rem', paddingBottom: '2rem' }}>
      <div className="w-full max-w-full mx-auto px-4 lg:px-6">
        {/* Welcome Hero Section */}
        <div className="mb-6">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-lg p-4 sm:p-6 text-white shadow-md overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-48 h-48 bg-white rounded-full blur-2xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-48 h-48 bg-cyan-300 rounded-full blur-2xl animate-pulse delay-1000"></div>
            </div>
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 leading-tight drop-shadow-lg">
                  สวัสดี, {user?.name || 'นักศึกษา'}
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-blue-50 mb-3 drop-shadow-md">
                  ยินดีต้อนรับสู่ PIM Learning Platform
                </p>
                {lastUpdate && (
                  <p className="text-xs text-blue-200 mt-3 flex items-center space-x-2 backdrop-blur-sm bg-white/10 rounded-full px-3 py-1.5 w-fit">
                    <FiRefreshCw size={14} className="animate-spin" />
                    <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-lg shadow-md p-4 border-2 ${stat.borderColor} hover:shadow-lg transition-all overflow-hidden group`}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col">
                  <div className="flex items-center justify-between mb-3">
                    <p className={`text-xs sm:text-sm font-semibold ${stat.textColor}`}>{stat.label}</p>
                    <div className={`w-10 h-10 bg-gradient-to-br ${stat.gradient} rounded-lg flex items-center justify-center shadow-md transform group-hover:rotate-12 transition-transform duration-300`}>
                      <Icon className="text-white" size={20} />
                    </div>
                  </div>
                  <p className={`text-2xl sm:text-3xl md:text-4xl font-bold ${stat.valueColor} leading-none mb-2`}>
                    {stat.value}
                  </p>
                  <p className={`text-xs sm:text-sm ${stat.textColor} font-semibold`}>{stat.unit}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            onClick={() => navigate('/modules')}
            className="relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-300/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-all duration-300 shadow-md border border-white/30">
                <FiPlay size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">เรียนวิดีโอ</h3>
                <p className="text-blue-100 text-sm mb-2">เริ่มเรียนตอนนี้</p>
                <p className="text-blue-200 text-xs backdrop-blur-sm bg-white/10 rounded-full px-3 py-1 w-fit">{totalModules} หลักสูตร | {totalModules} Module</p>
              </div>
              <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          <div
            onClick={() => navigate('/announcements')}
            className="relative bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all cursor-pointer group overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-amber-300/30 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur-md group-hover:scale-110 transition-all duration-300 shadow-md border border-white/30">
                <FiCheckCircle size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-1">ประกาศ</h3>
                <p className="text-orange-100 text-sm mb-2 drop-shadow-md">
                  {dashboardData?.modules && dashboardData.modules.length > 0 
                    ? dashboardData.modules[0].title 
                    : 'ไม่มีหลักสูตร'}
                </p>
                <p className="text-orange-200 text-xs backdrop-blur-sm bg-white/10 rounded-full px-3 py-1 w-fit">ความคืบหน้า {progressPercent}%</p>
              </div>
              <FiArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>

        {/* Featured Courses */}
        {modules.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1">หลักสูตรแนะนำ</h2>
                <p className="text-sm sm:text-base text-gray-600">หลักสูตรที่เหมาะสำหรับคุณ</p>
              </div>
              <Link
                to="/modules"
                className="text-blue-600 hover:text-blue-700 text-sm font-semibold flex items-center space-x-2 transition-colors"
              >
                <span>ดูทั้งหมด</span>
                <FiArrowRight size={18} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6">
              {modules.slice(0, 10).map((module) => (
                <Link
                  key={module.module_id}
                  to={`/module/${module.module_id}`}
                  className="relative bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 group border border-gray-200 hover:border-blue-300 transform hover:-translate-y-1"
                >
                  {/* Shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-20"></div>
                  
                  <div className="relative h-40 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-500 flex items-center justify-center overflow-hidden">
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/50 via-purple-500/50 to-cyan-500/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-xl border border-white/30 group-hover:scale-110 transition-transform duration-300">
                        <FiPlay className="text-white opacity-90 group-hover:opacity-100 transition-all transform group-hover:scale-110 duration-300" size={28} />
                      </div>
                    </div>
                    {module.category && (
                      <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-md text-blue-600 px-3 py-1 rounded-full text-xs font-bold shadow-lg border border-blue-200 z-10">
                        {module.category}
                      </span>
                    )}
                  </div>
                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{module.title}</h3>
                    {module.description && (
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2 leading-relaxed">{module.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
                      <span className="flex items-center space-x-2 font-bold group-hover:text-blue-600 transition-colors">
                        <FiClock size={14} />
                        <span>{module.video_count || 0} วิดีโอ</span>
                      </span>
                      {module.total_minutes > 0 && (
                        <span className="font-bold group-hover:text-blue-600 transition-colors">{module.total_minutes} นาที</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Category Navigation */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">หมวดหมู่หลักสูตร</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'การบริการ', path: '/modules?category=service', icon: FiUsers, color: 'blue', gradient: 'from-blue-500 to-blue-600' },
              { name: 'การเตรียมสินค้าอุ่นร้อน', path: '/modules?category=hot', icon: FiTrendingUp, color: 'orange', gradient: 'from-orange-500 to-orange-600' },
              { name: 'การจัดการอุปกรณ์และความสะอาด', path: '/modules?category=clean', icon: FiCheckCircle, color: 'green', gradient: 'from-green-500 to-green-600' },
              { name: 'การจัดการและบริหารสินค้า', path: '/modules?category=inventory', icon: FiBook, color: 'purple', gradient: 'from-purple-500 to-purple-600' },
            ].map((category, index) => {
              const Icon = category.icon;
              const colorClasses = {
                blue: 'bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 hover:from-blue-100 hover:to-blue-200',
                orange: 'bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 hover:from-orange-100 hover:to-orange-200',
                green: 'bg-gradient-to-br from-green-50 to-green-100 text-green-600 hover:from-green-100 hover:to-green-200',
                purple: 'bg-gradient-to-br from-purple-50 to-purple-100 text-purple-600 hover:from-purple-100 hover:to-purple-200',
              };
              return (
                <Link
                  key={index}
                  to={category.path}
                  className="flex flex-col items-center p-5 rounded-xl border-2 border-gray-200 hover:border-blue-400 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 group"
                >
                  <div className={`w-16 h-16 ${colorClasses[category.color]} rounded-xl flex items-center justify-center mb-4 transition-all duration-300 shadow-lg group-hover:scale-110`}>
                    <Icon size={28} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-800 text-center leading-tight group-hover:text-blue-600 transition-colors">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending Modules */}
        {dashboardData?.modules && dashboardData.modules.filter(m => m.completion_rate < 100).length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">หมวดที่ค้างอยู่</h2>
            <div className="space-y-3">
              {dashboardData.modules
                .filter(m => m.completion_rate < 100)
                .slice(0, 5)
                .map((module) => (
                  <Link
                    key={module.module_id}
                    to={`/module/${module.module_id}`}
                    className="block border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:border-blue-500 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 truncate">{module.title}</h3>
                        <div className="flex items-center space-x-3">
                          <p className="text-sm text-gray-600">
                            ความคืบหน้า: <span className="font-bold text-blue-600 text-base">{module.completion_rate}%</span>
                          </p>
                        </div>
                      </div>
                      <div className="w-32 sm:w-40 bg-gray-200 rounded-full h-3 flex-shrink-0">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${module.completion_rate}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        )}

        {/* Recent Exam Results */}
        {dashboardData?.recent_exams && dashboardData.recent_exams.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">ผลสอบล่าสุด</h2>
            <div className="space-y-3">
              {dashboardData.recent_exams.map((exam) => (
                <div
                  key={exam.exam_id}
                  className="flex items-center justify-between border-2 border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-all"
                >
                  <div>
                    <p className="text-base sm:text-lg font-semibold text-gray-800 mb-1">
                      {exam.exam_name || 'การสอบปฏิบัติ'}
                    </p>
                    <p className="text-sm text-gray-600">
                      วันที่ {new Date(exam.date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-full text-sm font-semibold ${
                      exam.status === 'passed'
                        ? 'bg-green-100 text-green-700'
                        : exam.status === 'failed'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {exam.status === 'passed' ? 'ผ่าน' : exam.status === 'failed' ? 'ไม่ผ่าน' : 'รอผล'}
                  </span>
                </div>
              ))}
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

export default Dashboard;
