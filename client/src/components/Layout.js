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
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-700 p-1"
              aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xs">N</span>
              </div>
              <h1 className="text-sm font-bold text-gray-800">PIM Learning</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r-2 border-gray-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none h-screen flex flex-col`}
        aria-label="เมนูนำทางหลัก"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-4 border-b-2 border-gray-200">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-gray-700 p-1"
                aria-label="ปิดเมนู"
              >
                <FiMenu size={20} />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">PIM Learning</h1>
              </div>
            </div>
          </div>

          {/* Search Bar in Sidebar */}
          <div className="p-4 border-b-2 border-gray-200">
            <label htmlFor="sidebar-search" className="sr-only">
              ค้นหาหลักสูตร
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
              <input
                id="sidebar-search"
                type="search"
                placeholder="ค้นหาหลักสูตร"
                className="w-full pl-9 pr-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                aria-label="ค้นหาหลักสูตร"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto">
            <div className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={isActive ? 'text-white' : 'text-gray-600'} 
                    />
                    <span className="ml-3 font-semibold text-sm">{item.label}</span>
                  </Link>
                );
              })}

              {/* Courses Dropdown */}
              <div>
                <button
                  onClick={() => setCoursesOpen(!coursesOpen)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg transition-colors ${
                    coursesOpen ? 'bg-gray-100 text-gray-700' : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center">
                    <FiBook size={18} className="text-gray-600" />
                    <span className="ml-3 font-semibold text-sm">หลักสูตร</span>
                  </div>
                  <FiChevronDown 
                    size={16} 
                    className={`transform transition-transform ${coursesOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {coursesOpen && (
                  <div className="ml-8 mt-2 space-y-1">
                    {courseCategories.map((category) => (
                      <Link
                        key={category.path}
                        to={category.path}
                        onClick={() => setSidebarOpen(false)}
                        className="block px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 rounded-lg font-medium border-l-2 border-transparent hover:border-blue-500"
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
                className="flex items-center px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiHelpCircle size={18} className="text-gray-600" />
                <span className="ml-3 font-semibold text-sm">เกี่ยวกับเรา</span>
              </Link>

              {/* FAQ */}
              <Link
                to="/faq"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiHelpCircle size={18} className="text-gray-600" />
                <span className="ml-3 font-semibold text-sm">คำถามที่พบบ่อย</span>
              </Link>

              {/* Certificate Check */}
              <Link
                to="/certificate"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center px-3 py-2 rounded-lg transition-colors text-gray-700 hover:bg-gray-100"
              >
                <FiFileText size={18} className="text-gray-600" />
                <span className="ml-3 font-semibold text-sm">ตรวจสอบใบวุฒิบัตร</span>
              </Link>
            </div>
          </nav>

          {/* Footer Links */}
          <div className="p-3 border-t-2 border-gray-200 space-y-2">
            <div className="text-xs text-gray-500 space-y-2">
              <button 
                type="button"
                onClick={() => alert('หน้าข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์')}
                className="block hover:text-gray-700 text-left w-full py-1.5 font-semibold"
              >ข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์</button>
              <button 
                type="button"
                onClick={() => alert('หน้าการคุ้มครองข้อมูลส่วนบุคคล')}
                className="block hover:text-gray-700 text-left w-full py-1.5 font-semibold"
              >การคุ้มครองข้อมูลส่วนบุคคล</button>
              <button 
                type="button"
                onClick={() => alert('หน้านโยบายการใช้คุกกี้')}
                className="block hover:text-gray-700 text-left w-full py-1.5 font-semibold"
              >นโยบายการใช้คุกกี้</button>
            </div>
            <div className="pt-3 border-t-2 border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm font-semibold"
                aria-label="ออกจากระบบ"
              >
                <FiLogOut size={16} aria-hidden="true" />
                <span className="ml-2">ออกจากระบบ</span>
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-3">
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
          <div className="flex items-center justify-between px-4 py-3 min-h-[60px]">
            {/* Left: Hamburger Menu and Logo */}
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-700 p-2"
                aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
                aria-expanded={sidebarOpen}
              >
                <FiMenu size={20} />
              </button>
              <div className="flex items-center space-x-2 hidden md:flex">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-lg">N</span>
                </div>
                <h1 className="text-lg font-bold text-gray-800 tracking-tight">PIM Learning</h1>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-4xl mx-4">
              <label htmlFor="header-search" className="sr-only">
                ค้นหาหลักสูตร
              </label>
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                <input
                  id="header-search"
                  type="search"
                  placeholder="ค้นหาหลักสูตรที่คุณต้องการ..."
                  className="w-full px-4 py-2 pl-10 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                  aria-label="ค้นหาหลักสูตร"
                />
              </div>
            </div>

            {/* Right: User and Login Button */}
            <div className="flex items-center space-x-3">
              {user && user !== null && typeof user === 'object' ? (
                <>
                  <div className="text-sm text-gray-700 font-semibold hidden md:block px-3">
                    {user.name || user.student_id || 'ผู้ใช้'}
                  </div>
                  <Link
                    to="/notifications"
                    className="relative p-2 text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    <FiBell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-md">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {(user.role === 'admin' || user.role === 'instructor') && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-semibold shadow-md"
                    >
                      แผงควบคุม
                    </Link>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-semibold shadow-md cursor-pointer"
                  aria-label="เข้าสู่ระบบ"
                >
                  <FiUser size={18} aria-hidden="true" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gray-50 overflow-auto" style={{ paddingTop: '1rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
