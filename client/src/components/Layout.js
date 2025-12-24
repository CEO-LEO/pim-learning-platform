import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import {
  FiHome,
  FiBook,
  FiClipboard,
  FiBarChart2,
  FiLogOut,
  FiMenu,
  FiX,
  FiUser,
  FiSearch,
  FiChevronDown,
  FiHelpCircle,
  FiFileText,
  FiBell,
  FiMessageSquare,
  FiCalendar,
  FiFile,
  FiAward,
  FiUsers,
  FiMail,
  FiSettings,
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [coursesOpen, setCoursesOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/notifications/unread-count`);
      setUnreadCount(response.data.count);
    } catch (error) {
      // Silently fail if not authenticated
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 10000); // Refresh every 10 seconds for real-time updates
      return () => clearInterval(interval);
    }
  }, [user, fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const menuItems = [
    { path: '/', icon: FiHome, label: 'หน้าแรก' },
    { path: '/modules', icon: FiBook, label: 'หลักสูตร' },
    { path: '/assignments', icon: FiFileText, label: 'งานที่ได้รับมอบหมาย' },
    { path: '/announcements', icon: FiBell, label: 'ประกาศ' },
    { path: '/calendar', icon: FiCalendar, label: 'ปฏิทิน' },
    { path: '/exams', icon: FiClipboard, label: 'ลงทะเบียนสอบ' },
    { path: '/my-exams', icon: FiClipboard, label: 'การสอบของฉัน' },
    { path: '/grades', icon: FiBarChart2, label: 'คะแนน' },
    { path: '/certificates', icon: FiAward, label: 'ใบประกาศนียบัตร' },
    { path: '/booking', icon: FiCalendar, label: 'จองรอบฝึกปฏิบัติ' },
    { path: '/room-booking', icon: FiHome, label: 'จองห้องเข้าใช้งาน' },
    { path: '/messages', icon: FiMail, label: 'ข้อความ' },
    { path: '/analytics', icon: FiBarChart2, label: 'สถิติ' },
    ...(user?.role === 'admin' || user?.role === 'instructor' 
      ? [{ path: '/admin', icon: FiSettings, label: 'แผงควบคุม', adminOnly: true }]
      : []
    ),
  ];

  const courseCategories = [
    { path: '/modules', label: 'หลักสูตรทั้งหมด' },
    { path: '/modules?category=service', label: 'การบริการ' },
    { path: '/modules?category=hot', label: 'การเตรียมสินค้าอุ่นร้อน' },
    { path: '/modules?category=clean', label: 'การจัดการอุปกรณ์และความสะอาด' },
    { path: '/modules?category=inventory', label: 'การจัดการและบริหารสินค้า' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm sticky top-0 z-50 border-b border-gray-200 w-full">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 p-2"
              aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">N</span>
              </div>
              <h1 className="text-lg font-bold text-gray-800">PIM Learning</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-[480px] bg-white border-r-2 border-gray-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none h-screen flex flex-col`}
        aria-label="เมนูนำทางหลัก"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-8 border-b-2 border-gray-200">
            <div className="flex items-center space-x-6">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-700 p-2"
                aria-label="ปิดเมนู"
              >
                <FiMenu size={32} />
              </button>
              <div className="flex items-center space-x-5">
                <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-5xl">N</span>
                </div>
                <h1 className="text-5xl font-bold text-gray-800 tracking-tight">PIM Learning</h1>
              </div>
            </div>
          </div>

          {/* Search Bar in Sidebar */}
          <div className="p-8 border-b-2 border-gray-200">
            <label htmlFor="sidebar-search" className="sr-only">
              ค้นหาหลักสูตร
            </label>
            <div className="relative">
              <FiSearch className="absolute left-6 top-1/2 transform -translate-y-1/2 text-gray-400" size={30} aria-hidden="true" />
              <input
                id="sidebar-search"
                type="search"
                placeholder="ค้นหาหลักสูตร"
                className="w-full pl-16 pr-6 py-6 border-2 border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-2xl"
                aria-label="ค้นหาหลักสูตร"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-8 overflow-y-auto">
            <div className="space-y-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-10 py-8 rounded-3xl transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xl scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:scale-102'
                    }`}
                  >
                    <Icon 
                      size={42} 
                      className={isActive ? 'text-white' : 'text-gray-600'} 
                    />
                    <span className="ml-8 font-extrabold text-3xl">{item.label}</span>
                  </Link>
                );
              })}

              {/* Courses Dropdown */}
              <div>
                <button
                  onClick={() => setCoursesOpen(!coursesOpen)}
                  className={`w-full flex items-center justify-between px-8 py-6 rounded-2xl transition-colors ${
                    coursesOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <FiBook size={36} className="text-gray-600" />
                    <span className="ml-6 font-bold text-2xl">หลักสูตร</span>
                  </div>
                  <FiChevronDown 
                    size={32} 
                    className={`transform transition-transform ${coursesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {coursesOpen && (
                  <div className="ml-14 mt-3 space-y-2">
                    {courseCategories.map((category) => (
                      <Link
                        key={category.path}
                        to={category.path}
                        onClick={() => setSidebarOpen(false)}
                        className="block px-8 py-5 text-xl text-gray-600 hover:bg-gray-50 rounded-2xl font-semibold border-l-4 border-transparent hover:border-blue-500"
                      >
                        {category.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* About Us */}
              <Link
                to="/about"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-8 py-6 rounded-2xl transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiHelpCircle size={36} className="text-gray-600" />
                <span className="ml-6 font-bold text-2xl">เกี่ยวกับเรา</span>
              </Link>

              {/* FAQ */}
              <Link
                to="/faq"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-8 py-6 rounded-2xl transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiHelpCircle size={36} className="text-gray-600" />
                <span className="ml-6 font-bold text-2xl">คำถามที่พบบ่อย</span>
              </Link>

              {/* Certificate Check */}
              <Link
                to="/certificate"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-8 py-6 rounded-2xl transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiFileText size={36} className="text-gray-600" />
                <span className="ml-6 font-bold text-2xl">ตรวจสอบใบวุฒิบัตร</span>
              </Link>
            </div>
          </nav>

          {/* Footer Links */}
          <div className="p-8 border-t-2 border-gray-200 space-y-5">
            <div className="text-xl text-gray-500 space-y-4">
              <button 
                type="button"
                onClick={() => alert('หน้าข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์')}
                className="block hover:text-gray-700 text-left w-full py-4 font-bold"
              >ข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์</button>
              <button 
                type="button"
                onClick={() => alert('หน้าการคุ้มครองข้อมูลส่วนบุคคล')}
                className="block hover:text-gray-700 text-left w-full py-4 font-bold"
              >การคุ้มครองข้อมูลส่วนบุคคล</button>
              <button 
                type="button"
                onClick={() => alert('หน้านโยบายการใช้คุกกี้')}
                className="block hover:text-gray-700 text-left w-full py-4 font-bold"
              >นโยบายการใช้คุกกี้</button>
            </div>
            <div className="pt-6 border-t-2 border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-8 py-6 text-red-600 hover:bg-red-50 rounded-2xl transition-colors text-2xl font-bold shadow-sm"
                aria-label="ออกจากระบบ"
              >
                <FiLogOut size={32} aria-hidden="true" />
                <span className="ml-6">ออกจากระบบ</span>
              </button>
            </div>
            <p className="text-xl text-gray-400 mt-6">
              © {new Date().getFullYear() + 543} PIM Learning
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header Bar */}
        <div className="bg-white border-b-2 border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between px-10 py-8 min-h-[140px]">
            {/* Left: Hamburger Menu and Logo */}
            <div className="flex items-center space-x-8">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-700 p-4"
                aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
                aria-expanded={sidebarOpen}
              >
                <FiMenu size={48} />
              </button>
              <div className="flex items-center space-x-5 hidden md:flex">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-3xl">N</span>
                </div>
                <h1 className="text-4xl font-black text-gray-800 tracking-tighter">PIM Learning</h1>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-4xl mx-12">
              <label htmlFor="header-search" className="sr-only">
                ค้นหาหลักสูตร
              </label>
              <div className="relative">
                <FiSearch className="absolute left-8 top-1/2 transform -translate-y-1/2 text-gray-400" size={32} aria-hidden="true" />
                <input
                  id="header-search"
                  type="search"
                  placeholder="ค้นหาหลักสูตรที่คุณต้องการ..."
                  className="w-full px-10 py-6 pl-20 border-4 border-gray-300 rounded-[2rem] focus:outline-none focus:ring-4 focus:ring-blue-500 focus:border-transparent text-3xl font-bold"
                  aria-label="ค้นหาหลักสูตร"
                />
              </div>
            </div>

            {/* Right: User and Login Button */}
            <div className="flex items-center space-x-8">
              {user && user !== null && typeof user === 'object' ? (
                <>
                  <div className="text-3xl text-gray-700 font-black hidden md:block px-6">
                    {user.name || user.student_id || 'ผู้ใช้'}
                  </div>
                  <Link
                    to="/notifications"
                    className="relative p-4 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <FiBell size={42} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-10 h-10 bg-red-500 text-white text-xl rounded-full flex items-center justify-center font-black shadow-lg">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {(user.role === 'admin' || user.role === 'instructor') && (
                    <Link
                      to="/admin"
                      className="px-10 py-6 bg-purple-600 text-white rounded-[2rem] hover:bg-purple-700 transition-colors text-3xl font-black shadow-2xl"
                    >
                      แผงควบคุม
                    </Link>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center space-x-5 px-12 py-6 bg-orange-500 text-white rounded-[2rem] hover:bg-orange-600 transition-colors text-3xl font-black shadow-2xl h-[88px] cursor-pointer"
                  aria-label="เข้าสู่ระบบ"
                >
                  <FiUser size={36} aria-hidden="true" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gray-50 overflow-auto" style={{ paddingTop: '3rem', paddingLeft: '4rem', paddingRight: '4rem', paddingBottom: '4rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
