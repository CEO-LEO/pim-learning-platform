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

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  const totalHours = dashboardData?.total_hours || 0;
  const completedModules = dashboardData?.modules?.filter(m => m.completion_rate === 100).length || 0;
  const totalModules = dashboardData?.modules?.length || 0;
  const pendingModules = totalModules - completedModules;
  const progressPercent = totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0;

  // Memoized stats cards
  const statsCards = useMemo(() => [
    {
      label: 'ชั่วโมงเรียนสะสม',
      value: totalHours,
      unit: 'ชั่วโมง',
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
  ], [totalHours, completedModules, pendingModules, progressPercent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 xl:px-16">
          <div className="mb-12">
            <div className="h-16 bg-gray-200 rounded-2xl w-96 mb-4 animate-pulse"></div>
            <div className="h-8 bg-gray-200 rounded-xl w-[600px] animate-pulse"></div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
        <div className="max-w-[1600px] mx-auto px-8 lg:px-12 xl:px-16">
          <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-12 text-center">
            <FiAlertCircle className="mx-auto text-red-500 mb-6" size={64} />
            <h2 className="text-3xl font-bold text-red-800 mb-4">เกิดข้อผิดพลาด</h2>
            <p className="text-xl text-red-600 mb-6">{error}</p>
            <button
              onClick={() => fetchDashboardData(false)}
              className="px-8 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-semibold text-lg"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50" style={{ marginTop: 0, paddingTop: '3rem', paddingBottom: '4rem' }}>
      <div className="w-full max-w-full mx-auto px-8 lg:px-12 xl:px-16">
        {/* Welcome Hero Section */}
        <div className="mb-20">
          <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 rounded-3xl p-20 md:p-24 text-white shadow-2xl transform transition-all hover:scale-[1.01] overflow-hidden group">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-300 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>
            <div className="relative z-10 flex items-center justify-between flex-wrap gap-8">
              <div className="flex-1">
                <h1 className="text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold mb-10 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-cyan-100 drop-shadow-2xl">
                  สวัสดี, {user?.name || 'นักศึกษา'}
                </h1>
                <p className="text-4xl md:text-5xl lg:text-6xl text-blue-50 mb-8 drop-shadow-lg">
                  ยินดีต้อนรับสู่ PIM Learning Platform
                </p>
                {lastUpdate && (
                  <p className="text-xl text-blue-200 mt-8 flex items-center space-x-3 backdrop-blur-sm bg-white/10 rounded-full px-6 py-3 w-fit">
                    <FiRefreshCw size={24} className="animate-spin" />
                    <span>อัพเดทล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className={`relative bg-gradient-to-br ${stat.bgGradient} rounded-3xl shadow-xl p-12 border-2 ${stat.borderColor} hover:shadow-2xl transition-all transform hover:-translate-y-2 overflow-hidden group`}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                <div className="relative z-10 flex flex-col">
                  <div className="flex items-center justify-between mb-10">
                    <p className={`text-2xl font-bold ${stat.textColor} drop-shadow-sm`}>{stat.label}</p>
                    <div className={`w-24 h-24 bg-gradient-to-br ${stat.gradient} rounded-3xl flex items-center justify-center shadow-xl transform group-hover:rotate-12 transition-transform duration-300`}>
                      <Icon className="text-white drop-shadow-lg" size={48} />
                    </div>
                  </div>
                  <p className={`text-7xl md:text-8xl lg:text-9xl font-bold ${stat.valueColor} leading-none mb-4 drop-shadow-lg`}>
                    {stat.value}
                  </p>
                  <p className={`text-xl ${stat.textColor} font-bold`}>{stat.unit}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
          <div
            onClick={() => navigate('/modules')}
            className="relative bg-gradient-to-r from-blue-600 to-cyan-500 text-white rounded-3xl shadow-2xl p-16 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-105 group overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-cyan-300/30 to-blue-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center space-x-12">
              <div className="w-44 h-44 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border-2 border-white/30">
                <FiPlay size={88} className="drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-6xl font-bold mb-5 drop-shadow-lg">เรียนวิดีโอ</h3>
                <p className="text-blue-100 text-3xl mb-4 drop-shadow-md">เริ่มเรียนตอนนี้</p>
                <p className="text-blue-200 text-2xl backdrop-blur-sm bg-white/10 rounded-full px-6 py-2 w-fit">{totalModules} หลักสูตร | {totalModules} Module</p>
              </div>
              <FiArrowRight size={56} className="group-hover:translate-x-2 transition-transform drop-shadow-lg" />
            </div>
          </div>

          <div
            onClick={() => navigate('/announcements')}
            className="relative bg-gradient-to-r from-orange-600 to-amber-500 text-white rounded-3xl shadow-2xl p-16 hover:shadow-3xl transition-all cursor-pointer transform hover:scale-105 group overflow-hidden"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400/0 via-amber-300/30 to-orange-400/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center space-x-12">
              <div className="w-44 h-44 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shadow-xl border-2 border-white/30">
                <FiCheckCircle size={88} className="drop-shadow-lg" />
              </div>
              <div className="flex-1">
                <h3 className="text-6xl font-bold mb-5 drop-shadow-lg">ประกาศ</h3>
                <p className="text-orange-100 text-3xl mb-4 drop-shadow-md">
                  {dashboardData?.modules && dashboardData.modules.length > 0 
                    ? dashboardData.modules[0].title 
                    : 'ไม่มีหลักสูตร'}
                </p>
                <p className="text-orange-200 text-2xl backdrop-blur-sm bg-white/10 rounded-full px-6 py-2 w-fit">ความคืบหน้า {progressPercent}%</p>
              </div>
              <FiArrowRight size={56} className="group-hover:translate-x-2 transition-transform drop-shadow-lg" />
            </div>
          </div>
        </div>

        {/* Featured Courses */}
        {modules.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center justify-between mb-16">
              <div>
                <h2 className="text-7xl font-bold text-gray-800 mb-5">หลักสูตรแนะนำ</h2>
                <p className="text-4xl text-gray-600">หลักสูตรที่เหมาะสำหรับคุณ</p>
              </div>
              <Link
                to="/modules"
                className="text-blue-600 hover:text-blue-700 text-3xl font-bold flex items-center space-x-4 transition-colors"
              >
                <span>ดูทั้งหมด</span>
                <FiArrowRight size={40} />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 2xl:grid-cols-6 gap-12">
              {modules.slice(0, 10).map((module) => (
                <Link
                  key={module.module_id}
                  to={`/module/${module.module_id}`}
                  className="bg-white rounded-3xl shadow-xl overflow-hidden hover:shadow-2xl transition-all transform hover:scale-105 group border-2 border-transparent hover:border-blue-200"
                >
                  <div className="relative h-80 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center overflow-hidden">
                    {/* Animated background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-400/50 to-cyan-400/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute top-0 left-0 w-full h-full opacity-20" style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
                    }}></div>
                    <FiPlay className="relative z-10 text-white opacity-80 group-hover:opacity-100 transition-all transform group-hover:scale-125 group-hover:rotate-12 duration-300 drop-shadow-2xl" size={112} />
                    {module.category && (
                      <span className="absolute top-8 right-8 bg-white/95 backdrop-blur-md text-blue-600 px-6 py-3 rounded-full text-lg font-bold shadow-xl border-2 border-blue-200 transform group-hover:scale-110 transition-transform z-10">
                        {module.category}
                      </span>
                    )}
                  </div>
                  <div className="p-12">
                    <h3 className="text-4xl font-bold text-gray-800 mb-6 line-clamp-2 leading-tight group-hover:text-blue-600 transition-colors">{module.title}</h3>
                    {module.description && (
                      <p className="text-xl text-gray-600 mb-10 line-clamp-2 leading-relaxed">{module.description}</p>
                    )}
                    <div className="flex items-center justify-between text-2xl text-gray-500 pt-6 border-t-2 border-gray-200">
                      <span className="flex items-center space-x-4 font-bold group-hover:text-blue-600 transition-colors">
                        <FiClock size={32} />
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
        <div className="bg-white rounded-3xl shadow-xl p-20 mb-20">
          <h2 className="text-6xl font-bold text-gray-800 mb-20">หมวดหมู่หลักสูตร</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16">
            {[
              { name: 'การบริการ', path: '/modules?category=service', icon: FiUsers, color: 'blue' },
              { name: 'การเตรียมสินค้าอุ่นร้อน', path: '/modules?category=hot', icon: FiTrendingUp, color: 'orange' },
              { name: 'การจัดการอุปกรณ์และความสะอาด', path: '/modules?category=clean', icon: FiCheckCircle, color: 'green' },
              { name: 'การจัดการและบริหารสินค้า', path: '/modules?category=inventory', icon: FiBook, color: 'purple' },
            ].map((category, index) => {
              const Icon = category.icon;
              const colorClasses = {
                blue: 'bg-blue-100 text-blue-600 hover:bg-blue-200',
                orange: 'bg-orange-100 text-orange-600 hover:bg-orange-200',
                green: 'bg-green-100 text-green-600 hover:bg-green-200',
                purple: 'bg-purple-100 text-purple-600 hover:bg-purple-200',
              };
              return (
                <Link
                  key={index}
                  to={category.path}
                  className="flex flex-col items-center p-16 rounded-3xl border-2 border-gray-200 hover:border-blue-500 hover:shadow-xl transition-all transform hover:scale-105"
                >
                  <div className={`w-40 h-40 ${colorClasses[category.color]} rounded-full flex items-center justify-center mb-10 transition-colors shadow-xl`}>
                    <Icon size={80} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800 text-center leading-tight">{category.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Pending Modules */}
        {dashboardData?.modules && dashboardData.modules.filter(m => m.completion_rate < 100).length > 0 && (
          <div className="bg-white rounded-3xl shadow-xl p-20 mb-20">
            <h2 className="text-6xl font-bold text-gray-800 mb-20">หมวดที่ค้างอยู่</h2>
            <div className="space-y-12">
              {dashboardData.modules
                .filter(m => m.completion_rate < 100)
                .slice(0, 5)
                .map((module) => (
                  <Link
                    key={module.module_id}
                    to={`/module/${module.module_id}`}
                    className="block border-2 border-gray-200 rounded-3xl p-16 hover:border-blue-500 hover:shadow-xl transition-all transform hover:scale-[1.01]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-5xl font-semibold text-gray-800 mb-10">{module.title}</h3>
                        <div className="flex items-center space-x-10">
                          <p className="text-3xl text-gray-600">
                            ความคืบหน้า: <span className="font-bold text-blue-600 text-4xl">{module.completion_rate}%</span>
                          </p>
                        </div>
                      </div>
                      <div className="w-[500px] bg-gray-200 rounded-full h-12 ml-24">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-500 h-12 rounded-full transition-all duration-300"
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
          <div className="bg-white rounded-3xl shadow-xl p-20">
            <h2 className="text-6xl font-bold text-gray-800 mb-20">ผลสอบล่าสุด</h2>
            <div className="space-y-12">
              {dashboardData.recent_exams.map((exam) => (
                <div
                  key={exam.exam_id}
                  className="flex items-center justify-between border-2 border-gray-200 rounded-3xl p-16 hover:shadow-lg transition-all"
                >
                  <div>
                    <p className="text-5xl font-semibold text-gray-800 mb-6">
                      {exam.exam_name || 'การสอบปฏิบัติ'}
                    </p>
                    <p className="text-3xl text-gray-600">
                      วันที่ {new Date(exam.date).toLocaleDateString('th-TH')}
                    </p>
                  </div>
                  <span
                    className={`px-20 py-10 rounded-full text-3xl font-bold ${
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
