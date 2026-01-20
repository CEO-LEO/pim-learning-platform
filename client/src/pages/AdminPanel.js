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
  FiPlus,
  FiEdit,
  FiTrash2,
  FiDownload
} from 'react-icons/fi';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const AdminPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [modules, setModules] = useState([]);
  const [, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  // Module management states
  const [showModuleModal, setShowModuleModal] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [moduleForm, setModuleForm] = useState({
    title: '',
    description: '',
    objectives: '',
    year_level: '',
    order_index: ''
  });
  
  // Video management states
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videos, setVideos] = useState([]);
  const [videoForm, setVideoForm] = useState({
    module_id: '',
    title: '',
    url: '',
    duration: '',
    order_index: ''
  });
  
  // Quiz management states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [quizForm, setQuizForm] = useState({
    module_id: '',
    title: '',
    time_limit: 30,
    passing_score: 70,
    order_index: '',
    questions: []
  });

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
  
  const fetchVideos = async () => {
    try {
      // Fetch all videos across all modules
      const modulesWithVideos = await Promise.all(
        modules.map(async (module) => {
          const response = await axios.get(`${API_URL}/videos/module/${module.module_id}`);
          return response.data || [];
        })
      );
      setVideos(modulesWithVideos.flat());
    } catch (error) {
      console.error('Failed to fetch videos:', error);
    }
  };
  
  useEffect(() => {
    if (modules.length > 0) {
      fetchVideos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);
  
  // Module management handlers
  const handleAddModule = () => {
    setEditingModule(null);
    setModuleForm({ title: '', description: '', objectives: '', year_level: '', order_index: '' });
    setShowModuleModal(true);
  };
  
  const handleEditModule = (module) => {
    setEditingModule(module);
    setModuleForm({
      title: module.title || '',
      description: module.description || '',
      objectives: module.objectives || '',
      year_level: module.year_level || '',
      order_index: module.order_index || ''
    });
    setShowModuleModal(true);
  };
  
  const handleDeleteModule = async (moduleId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบหลักสูตรนี้?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/modules/${moduleId}`);
      alert('ลบหลักสูตรสำเร็จ');
      fetchModules();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'ลบหลักสูตรไม่สำเร็จ');
    }
  };
  
  const handleSaveModule = async (e) => {
    e.preventDefault();
    
    try {
      if (editingModule) {
        // Update existing module
        await axios.put(`${API_URL}/admin/modules/${editingModule.module_id}`, moduleForm);
        alert('แก้ไขหลักสูตรสำเร็จ');
      } else {
        // Create new module
        await axios.post(`${API_URL}/admin/modules`, moduleForm);
        alert('เพิ่มหลักสูตรสำเร็จ');
      }
      setShowModuleModal(false);
      fetchModules();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };
  
  // Video management handlers
  const handleAddVideo = () => {
    setEditingVideo(null);
    setVideoForm({ module_id: modules[0]?.module_id || '', title: '', url: '', duration: '', order_index: '' });
    setShowVideoModal(true);
  };
  
  const handleEditVideo = (video) => {
    setEditingVideo(video);
    setVideoForm({
      module_id: video.module_id || '',
      title: video.title || '',
      url: video.url || '',
      duration: video.duration || '',
      order_index: video.order_index || ''
    });
    setShowVideoModal(true);
  };
  
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบวิดีโอนี้?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/videos/${videoId}`);
      alert('ลบวิดีโอสำเร็จ');
      fetchVideos();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'ลบวิดีโอไม่สำเร็จ');
    }
  };
  
  const handleSaveVideo = async (e) => {
    e.preventDefault();
    
    try {
      if (editingVideo) {
        await axios.put(`${API_URL}/admin/videos/${editingVideo.video_id}`, videoForm);
        alert('แก้ไขวิดีโอสำเร็จ');
      } else {
        await axios.post(`${API_URL}/admin/videos`, videoForm);
        alert('เพิ่มวิดีโอสำเร็จ');
      }
      setShowVideoModal(false);
      fetchVideos();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };
  
  // Quiz management handlers
  const fetchQuizzes = async () => {
    try {
      const allQuizzes = await Promise.all(
        modules.map(async (module) => {
          const response = await axios.get(`${API_URL}/quizzes/module/${module.module_id}/all`);
          return (response.data || []).map(q => ({ ...q, module_title: module.title }));
        })
      );
      setQuizzes(allQuizzes.flat());
    } catch (error) {
      console.error('Failed to fetch quizzes:', error);
    }
  };
  
  const handleAddQuiz = () => {
    setEditingQuiz(null);
    setQuizForm({ module_id: modules[0]?.module_id || '', title: '', time_limit: 30, passing_score: 70, order_index: '', questions: [] });
    setShowQuizModal(true);
  };
  
  const handleEditQuiz = (quiz) => {
    setEditingQuiz(quiz);
    setQuizForm({
      module_id: quiz.module_id || '',
      title: quiz.title || '',
      time_limit: quiz.time_limit || 30,
      passing_score: quiz.passing_score || 70,
      order_index: quiz.order_index || '',
      questions: []
    });
    setShowQuizModal(true);
  };
  
  const handleDeleteQuiz = async (quizId) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบแบบทดสอบนี้?')) return;
    
    try {
      await axios.delete(`${API_URL}/admin/quizzes/${quizId}`);
      alert('ลบแบบทดสอบสำเร็จ');
      fetchQuizzes();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error.response?.data?.error || 'ลบแบบทดสอบไม่สำเร็จ');
    }
  };
  
  const handleSaveQuiz = async (e) => {
    e.preventDefault();
    
    try {
      const data = {
        ...quizForm,
        time_limit: parseInt(quizForm.time_limit) || 30,
        passing_score: parseInt(quizForm.passing_score) || 70,
        order_index: parseInt(quizForm.order_index) || 0
      };
      
      if (editingQuiz) {
        await axios.put(`${API_URL}/admin/quizzes/${editingQuiz.quiz_id}`, data);
        alert('แก้ไขแบบทดสอบสำเร็จ');
      } else {
        await axios.post(`${API_URL}/admin/quizzes`, data);
        alert('เพิ่มแบบทดสอบสำเร็จ');
      }
      setShowQuizModal(false);
      fetchQuizzes();
    } catch (error) {
      console.error('Save error:', error);
      alert(error.response?.data?.error || 'บันทึกข้อมูลไม่สำเร็จ');
    }
  };
  
  useEffect(() => {
    if (modules.length > 0) {
      fetchQuizzes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modules]);

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
            <button 
              onClick={handleAddModule}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-all"
            >
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
                    <button 
                      onClick={() => handleEditModule(module)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                      title="แก้ไข"
                    >
                      <FiEdit size={18} />
                    </button>
                    <button 
                      onClick={() => handleDeleteModule(module.module_id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      title="ลบ"
                    >
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

      {/* Module Modal */}
      {showModuleModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingModule ? 'แก้ไขหลักสูตร' : 'เพิ่มหลักสูตรใหม่'}
            </h2>
            
            <form onSubmit={handleSaveModule} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อหลักสูตร *</label>
                <input
                  type="text"
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  placeholder="เช่น: การบริการ"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
                <textarea
                  value={moduleForm.description}
                  onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={3}
                  placeholder="คำอธิบายหลักสูตร..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">วัตถุประสงค์</label>
                <textarea
                  value={moduleForm.objectives || ''}
                  onChange={(e) => setModuleForm({ ...moduleForm, objectives: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  rows={4}
                  placeholder="เช่น: 
- เพื่อให้นักศึกษาเข้าใจหลักการบริการลูกค้า
- เพื่อสามารถใช้เครื่อง POS ได้อย่างถูกต้อง
- เพื่อพัฒนาทักษะการสื่อสารที่มีประสิทธิภาพ"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ชั้นปี</label>
                  <input
                    type="number"
                    value={moduleForm.year_level}
                    onChange={(e) => setModuleForm({ ...moduleForm, year_level: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="1-4"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ลำดับ</label>
                  <input
                    type="number"
                    value={moduleForm.order_index}
                    onChange={(e) => setModuleForm({ ...moduleForm, order_index: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModuleModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all font-semibold shadow-lg"
                >
                  {editingModule ? 'บันทึกการแก้ไข' : 'เพิ่มหลักสูตร'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingVideo ? 'แก้ไขวิดีโอ' : 'เพิ่มวิดีโอใหม่'}
            </h2>
            
            <form onSubmit={handleSaveVideo} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หลักสูตร *</label>
                <select
                  value={videoForm.module_id}
                  onChange={(e) => setVideoForm({ ...videoForm, module_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">เลือกหลักสูตร</option>
                  {modules.map(m => (
                    <option key={m.module_id} value={m.module_id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อวิดีโอ *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  placeholder="เช่น: การบริการ - วิดีโอที่ 1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL วิดีโอ</label>
                <input
                  type="text"
                  value={videoForm.url}
                  onChange={(e) => setVideoForm({ ...videoForm, url: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  placeholder="/uploads/videos/video-name.mp4"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ระยะเวลา (วินาที)</label>
                  <input
                    type="number"
                    value={videoForm.duration}
                    onChange={(e) => setVideoForm({ ...videoForm, duration: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="1800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ลำดับ</label>
                  <input
                    type="number"
                    value={videoForm.order_index}
                    onChange={(e) => setVideoForm({ ...videoForm, order_index: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="1, 2, 3..."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowVideoModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl transition-all font-semibold shadow-lg"
                >
                  {editingVideo ? 'บันทึกการแก้ไข' : 'เพิ่มวิดีโอ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingQuiz ? 'แก้ไขแบบทดสอบ' : 'เพิ่มแบบทดสอบใหม่'}
            </h2>
            
            <form onSubmit={handleSaveQuiz} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">หลักสูตร *</label>
                <select
                  value={quizForm.module_id}
                  onChange={(e) => setQuizForm({ ...quizForm, module_id: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                >
                  <option value="">เลือกหลักสูตร</option>
                  {modules.map(m => (
                    <option key={m.module_id} value={m.module_id}>{m.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">ชื่อแบบทดสอบ *</label>
                <input
                  type="text"
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  required
                  placeholder="เช่น: แบบทดสอบท้ายบท - การบริการ"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">เวลา (นาที)</label>
                  <input
                    type="number"
                    value={quizForm.time_limit}
                    onChange={(e) => setQuizForm({ ...quizForm, time_limit: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">คะแนนผ่าน (%)</label>
                  <input
                    type="number"
                    value={quizForm.passing_score}
                    onChange={(e) => setQuizForm({ ...quizForm, passing_score: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="70"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ลำดับ</label>
                  <input
                    type="number"
                    value={quizForm.order_index}
                    onChange={(e) => setQuizForm({ ...quizForm, order_index: e.target.value })}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuizModal(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all font-semibold shadow-lg"
                >
                  {editingQuiz ? 'บันทึกการแก้ไข' : 'เพิ่มแบบทดสอบ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Content Tab */}
      {activeTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">จัดการวิดีโอ</h2>
              <button 
                onClick={handleAddVideo}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-all"
              >
                <FiPlus size={18} />
                <span>เพิ่มวิดีโอ</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {videos.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีวิดีโอ</p>
              ) : (
                videos.map((video) => (
                  <div key={video.video_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{video.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Module: {video.module_title || video.module_id}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>ลำดับ: {video.order_index}</span>
                          <span>ระยะเวลา: {Math.floor((video.duration || 0) / 60)} นาที</span>
                          {video.url && <span className="text-green-600">✓ มี URL</span>}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditVideo(video)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="แก้ไข"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteVideo(video.video_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="ลบ"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">จัดการแบบทดสอบ</h2>
              <button 
                onClick={handleAddQuiz}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-all"
              >
                <FiPlus size={18} />
                <span>เพิ่มแบบทดสอบ</span>
              </button>
            </div>
            
            <div className="space-y-3">
              {quizzes.length === 0 ? (
                <p className="text-gray-500 text-center py-8">ยังไม่มีแบบทดสอบ</p>
              ) : (
                quizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{quiz.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">Module: {quiz.module_title || quiz.module_id}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>ลำดับ: {quiz.order_index}</span>
                          <span>เวลา: {quiz.time_limit} นาที</span>
                          <span>คะแนนผ่าน: {quiz.passing_score}%</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleEditQuiz(quiz)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                          title="แก้ไข"
                        >
                          <FiEdit size={18} />
                        </button>
                        <button 
                          onClick={() => handleDeleteQuiz(quiz.quiz_id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                          title="ลบ"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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
