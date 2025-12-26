import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FiAward, FiDownload, FiCheckCircle } from 'react-icons/fi';
import { CardSkeleton } from '../components/LoadingSkeleton';
import Toast from '../components/Toast';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Certificates = () => {
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  };

  useEffect(() => {
    fetchCertificates();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCertificates = async () => {
    try {
      setError(null);
      const response = await axios.get(`${API_URL}/certificates/my`);
      setCertificates(response.data);
    } catch (error) {
      console.error('Failed to fetch certificates:', error);
      const errorMessage = error.response?.data?.error || 'ไม่สามารถโหลดใบประกาศนียบัตรได้';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (certificate) => {
    // In a real application, this would generate and download a PDF certificate
    // For now, we'll just show the certificate details
    const certificateData = `
ใบประกาศนียบัตร
${certificate.module_title}

เรียน ท่าน ${user?.name}
รหัสนักศึกษา: ${user?.student_id}

ด้วยท่านได้ผ่านการเรียนและสอบในหลักสูตร "${certificate.module_title}" 
เรียบร้อยแล้ว จึงขอประกาศให้ทราบ

เลขที่ใบประกาศ: ${certificate.certificate_number}
วันที่ออก: ${new Date(certificate.issued_at).toLocaleDateString('th-TH')}

มหาวิทยาลัยปัญญาภิวัฒน์
    `;
    
    const blob = new Blob([certificateData], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate-${certificate.certificate_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
        <div className="mb-6">
          <div className="h-8 bg-gray-200 rounded w-64 mb-2 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginTop: 0, paddingTop: '1.5rem' }}>
      <h1 className="text-3xl font-bold text-gray-800 mb-6">ใบประกาศนียบัตร</h1>

      {certificates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <FiAward size={64} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 mb-2">คุณยังไม่มีใบประกาศนียบัตร</p>
          <p className="text-sm text-gray-500">เมื่อคุณผ่านหลักสูตรแล้ว จะได้รับใบประกาศนียบัตรที่นี่</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((certificate) => (
            <div
              key={certificate.certificate_id}
              className="bg-gradient-to-br from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-16 h-16 bg-yellow-400 rounded-full flex items-center justify-center">
                  <FiAward className="text-yellow-800" size={32} />
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-600">เลขที่</p>
                  <p className="text-sm font-semibold text-gray-800">{certificate.certificate_number}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-gray-800 mb-2">{certificate.module_title}</h2>
              <p className="text-sm text-gray-600 mb-4">{certificate.module_description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiCheckCircle className="text-green-600" size={16} />
                  <span>ออกโดย: {certificate.issued_by_name}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <FiCheckCircle className="text-green-600" size={16} />
                  <span>วันที่ออก: {new Date(certificate.issued_at).toLocaleDateString('th-TH')}</span>
                </div>
              </div>

              <button
                onClick={() => downloadCertificate(certificate)}
                className="w-full bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors flex items-center justify-center space-x-2"
              >
                <FiDownload size={18} />
                <span>ดาวน์โหลด</span>
              </button>
            </div>
          ))}
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

export default Certificates;

