import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  FiUsers,
  FiBook,
  FiVideo,
  FiClipboard,
  FiBarChart2,
  FiSettings,
  FiPlus,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiDownload
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [modules, setModules] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (user?.role !== 'admin' && user?.role !== 'instructor') {
      navigate('/');
      return;
    }
    fetchStats();
    fetchModules();
    fetchUsers();
  }, [user, navigate]);

  const handleExport = async () => {
    try {
      setExporting(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/admin/export/export-students`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Student_Report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Export failed:', error);
      alert('ไม่สามารถส่งออกไฟล์ Excel ได้');
    } finally {
      setExporting(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/analytics/dashboard`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchModules = async () => {
    try {
      const response = await axios.get(`${API_URL}/videos/modules`);
      setModules(response.data);
    } catch (error) {
      console.error('Failed to fetch modules:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      // This would need a new endpoint to get all users
      // For now, we'll use a placeholder
      setUsers([]);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'dashboard', label: 'ภาพรวม', icon: FiBarChart2 },
    { id: 'modules', label: 'จัดการหลักสูตร', icon: FiBook },
    { id: 'users', label: 'จัดการผู้ใช้', icon: FiUsers },
    { id: 'content', label: 'จัดการเนื้อหา', icon: FiVideo },
  ];

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">แผงควบคุมผู้ดูแลระบบ</h1>
        <p className="text-gray-600 mt-2">จัดการระบบ e-learning ทั้งหมด</p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b border-gray-200">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <Icon size={20} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 transition-colors shadow-lg font-bold text-xl disabled:bg-gray-400"
            >
              <FiDownload size={24} />
              <span>{exporting ? 'กำลังส่งออก...' : 'ส่งออกรายงาน Excel (นักศึกษาทั้งหมด)'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">ผู้ใช้ทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_users || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FiUsers className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">หลักสูตรทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800">{modules.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <FiBook className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">วิดีโอทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_videos || 0}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <FiVideo className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">แบบทดสอบทั้งหมด</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total_quizzes || 0}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                <FiClipboard className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Modules Tab */}
      {activeTab === 'modules' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">จัดการหลักสูตร</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <FiPlus size={18} />
              <span>เพิ่มหลักสูตร</span>
            </button>
          </div>

          <div className="space-y-4">
            {modules.map((module) => (
              <div key={module.module_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">{module.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{module.description}</p>
                    <p className="text-xs text-gray-500 mt-1">ชั้นปี: {module.year_level || 'ทั้งหมด'}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                      <FiEdit size={18} />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800">จัดการผู้ใช้</h2>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
              <FiPlus size={18} />
              <span>เพิ่มผู้ใช้</span>
            </button>
          </div>

          <div className="text-center py-8 text-gray-500">
            <p>ฟีเจอร์นี้กำลังพัฒนา</p>
            <p className="text-sm mt-2">สามารถจัดการผู้ใช้ผ่านฐานข้อมูลได้</p>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการวิดีโอ</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <FiPlus size={18} />
                <span>เพิ่มวิดีโอ</span>
              </button>
            </div>
            <p className="text-gray-600">ใช้ API endpoint: POST /api/admin/videos</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการแบบทดสอบ</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <FiPlus size={18} />
                <span>เพิ่มแบบทดสอบ</span>
              </button>
            </div>
            <p className="text-gray-600">ใช้ API endpoint: POST /api/admin/quizzes</p>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">จัดการการสอบปฏิบัติ</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                <FiPlus size={18} />
                <span>เพิ่มการสอบ</span>
              </button>
            </div>
            <p className="text-gray-600">ใช้ API endpoint: POST /api/admin/exams</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
