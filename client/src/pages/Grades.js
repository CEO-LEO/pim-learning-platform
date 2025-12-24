import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiBarChart2, FiFileText, FiClipboard, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { CardSkeleton, TableSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Grades = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedModule, setSelectedModule] = useState('all');
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchGrades();
    fetchSummary();
  }, []);

  const fetchGrades = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/grades/my`);
      setGrades(response.data);
    } catch (error) {
      console.error('Failed to fetch grades:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดคะแนนได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/grades/summary/${user?.userId}`);
      setSummary(response.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      // Silently fail for summary
    }
  };

  const getGradeColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 80) return 'text-blue-600 bg-blue-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    if (percentage >= 60) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const filteredGrades = selectedModule === 'all' 
    ? grades 
    : grades.filter(g => g.module_id === selectedModule);

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <TableSkeleton rows={5} cols={4} />
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">คะแนนของฉัน</h1>

      {/* Summary Cards */}
      {summary.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {summary.map((item) => {
            const percentage = Math.round(item.average_score || 0);
            return (
              <div key={item.module_id} className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Module {item.module_id}</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-3xl font-bold text-gray-800">{percentage}%</p>
                    <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
                  </div>
                  <div className={`px-4 py-2 rounded-lg ${getGradeColor(percentage)}`}>
                    <p className="font-semibold">
                      {item.average_score >= 90 ? 'A' :
                       item.average_score >= 80 ? 'B' :
                       item.average_score >= 70 ? 'C' :
                       item.average_score >= 60 ? 'D' : 'F'}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2">จำนวนงาน: {item.total_grades}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Filter */}
      <div className="mb-6">
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">ทั้งหมด</option>
          {Array.from(new Set(grades.map(g => g.module_id))).map(moduleId => (
            <option key={moduleId} value={moduleId}>Module {moduleId}</option>
          ))}
        </select>
      </div>

      {/* Grades List */}
      {filteredGrades.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FiBarChart2 size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">คุณยังไม่มีคะแนน</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รายการ</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">คะแนน</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">เกรด</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGrades.map((grade) => {
                const percentage = (grade.score / grade.max_score) * 100;
                const gradeType = grade.assignment_id ? 'งาน' : grade.quiz_id ? 'แบบทดสอบ' : 'สอบ';
                const gradeTitle = grade.assignment_title || grade.quiz_title || 'การสอบ';
                
                return (
                  <tr key={grade.grade_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {grade.assignment_id && <FiFileText className="text-blue-600 mr-2" size={18} />}
                        {grade.quiz_id && <FiClipboard className="text-purple-600 mr-2" size={18} />}
                        {grade.exam_id && <FiCheckCircle className="text-green-600 mr-2" size={18} />}
                        <span className="text-sm text-gray-900">{gradeType}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{gradeTitle}</div>
                      {grade.module_title && (
                        <div className="text-sm text-gray-500">{grade.module_title}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {grade.score} / {grade.max_score}
                      </div>
                      <div className="text-xs text-gray-500">{Math.round(percentage)}%</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(percentage)}`}>
                        {grade.grade_letter}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(grade.graded_at).toLocaleDateString('th-TH')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
  );
};

export default Grades;

