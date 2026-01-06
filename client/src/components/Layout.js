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
  FiCalendar,
  FiAward,
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
  }, []);

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 flex">
      {/* Mobile Header */}
      <div className="lg:hidden bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
              aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
              aria-expanded={sidebarOpen}
            >
              {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
            </button>
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-blue-600 font-bold text-sm">N</span>
              </div>
              <h1 className="text-sm font-bold text-white">PIM Learning</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } transition-transform duration-300 ease-in-out shadow-xl lg:shadow-lg h-screen flex flex-col`}
        aria-label="เมนูนำทางหลัก"
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700 border-b border-blue-500">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden text-white p-1 hover:bg-white/20 rounded-lg transition-colors"
                aria-label="ปิดเมนู"
              >
                <FiMenu size={20} />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-blue-600 font-bold text-xl">N</span>
                </div>
                <h1 className="text-xl font-bold text-white tracking-tight">PIM Learning</h1>
              </div>
            </div>
          </div>

          {/* Search Bar in Sidebar */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <label htmlFor="sidebar-search" className="sr-only">
              ค้นหาหลักสูตร
            </label>
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} aria-hidden="true" />
              <input
                id="sidebar-search"
                type="search"
                placeholder="ค้นหาหลักสูตร"
                className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm transition-all"
                aria-label="ค้นหาหลักสูตร"
              />
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto bg-white">
            <div className="space-y-1">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center px-4 py-2.5 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transform scale-[1.02]'
                        : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700'
                    }`}
                  >
                    <Icon 
                      size={18} 
                      className={isActive ? 'text-white' : 'text-gray-600'} 
                    />
                    <span className={`ml-3 font-medium text-sm ${isActive ? 'text-white' : 'text-gray-700'}`}>{item.label}</span>
                  </Link>
                );
              })}

              {/* Courses Dropdown */}
              <div className="mt-2">
                <button
                  onClick={() => setCoursesOpen(!coursesOpen)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    coursesOpen 
                      ? 'bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm' 
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-700'
                  }`}
                >
                  <div className="flex items-center">
                    <FiBook size={18} className={coursesOpen ? 'text-blue-600' : 'text-gray-600'} />
                    <span className={`ml-3 font-medium text-sm ${coursesOpen ? 'text-blue-700' : 'text-gray-700'}`}>หลักสูตร</span>
                  </div>
                  <FiChevronDown 
                    size={16} 
                    className={`transform transition-transform duration-200 ${coursesOpen ? 'rotate-180 text-blue-600' : 'text-gray-600'}`}
                  />
                </button>
                {coursesOpen && (
                  <div className="ml-4 mt-2 space-y-1 pl-4 border-l-2 border-blue-200">
                    {courseCategories.map((category) => {
                      const isCategoryActive = location.pathname === category.path || 
                        (category.path.includes('category') && location.search.includes(category.path.split('?')[1]));
                      return (
                        <Link
                          key={category.path}
                          to={category.path}
                          onClick={() => setSidebarOpen(false)}
                          className={`block px-3 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                            isCategoryActive
                              ? 'bg-blue-100 text-blue-700 border-l-2 border-blue-500 pl-2'
                              : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          {category.label}
                        </Link>
                      );
                    })}
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
          <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-2">
            <div className="text-xs text-gray-600 space-y-1.5">
              <button 
                type="button"
                onClick={() => alert('หน้าข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์')}
                className="block hover:text-blue-600 text-left w-full py-1.5 font-medium transition-colors"
              >ข้อตกลงและเงื่อนไขการใช้งานเว็บไซต์</button>
              <button 
                type="button"
                onClick={() => alert('หน้าการคุ้มครองข้อมูลส่วนบุคคล')}
                className="block hover:text-blue-600 text-left w-full py-1.5 font-medium transition-colors"
              >การคุ้มครองข้อมูลส่วนบุคคล</button>
              <button 
                type="button"
                onClick={() => alert('หน้านโยบายการใช้คุกกี้')}
                className="block hover:text-blue-600 text-left w-full py-1.5 font-medium transition-colors"
              >นโยบายการใช้คุกกี้</button>
            </div>
            <div className="pt-3 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200 text-sm font-medium hover:shadow-sm"
                aria-label="ออกจากระบบ"
              >
                <FiLogOut size={16} aria-hidden="true" />
                <span className="ml-2">ออกจากระบบ</span>
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
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
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-md">
          <div className="flex items-center justify-between px-6 py-4 min-h-[70px]">
            {/* Left: Hamburger Menu and Logo */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label={sidebarOpen ? 'ปิดเมนู' : 'เปิดเมนู'}
                aria-expanded={sidebarOpen}
              >
                <FiMenu size={20} />
              </button>
              <div className="flex items-center space-x-3 hidden md:flex">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">N</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tight">PIM Learning</h1>
              </div>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-4xl mx-6">
              <label htmlFor="header-search" className="sr-only">
                ค้นหาหลักสูตร
              </label>
              <div className="relative">
                <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} aria-hidden="true" />
                <input
                  id="header-search"
                  type="search"
                  placeholder="ค้นหาหลักสูตรที่คุณต้องการ..."
                  className="w-full px-4 py-2.5 pl-11 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-medium bg-white shadow-sm transition-all"
                  aria-label="ค้นหาหลักสูตร"
                />
              </div>
            </div>

            {/* Right: User and Login Button */}
            <div className="flex items-center space-x-3">
              {user && user !== null && typeof user === 'object' ? (
                <>
                  <div className="text-sm text-gray-700 font-semibold hidden md:block px-4 py-2 bg-gray-50 rounded-lg">
                    {user.name || user.student_id || 'ผู้ใช้'}
                  </div>
                  <Link
                    to="/notifications"
                    className="relative p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                  >
                    <FiBell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-0 right-0 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Link>
                  {(user.role === 'admin' || user.role === 'instructor') && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      แผงควบคุม
                    </Link>
                  )}
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg hover:from-orange-600 hover:to-orange-700 transition-all duration-200 text-sm font-semibold shadow-lg hover:shadow-xl transform hover:scale-105"
                  aria-label="เข้าสู่ระบบ"
                >
                  <FiUser size={18} aria-hidden="true" />
                  <span>เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 overflow-auto" style={{ paddingTop: '1.5rem', paddingLeft: '1.5rem', paddingRight: '1.5rem', paddingBottom: '1.5rem' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
