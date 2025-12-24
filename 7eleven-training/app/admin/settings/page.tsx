'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'admin') {
      router.push('/admin/dashboard');
      return;
    }
  }, [user, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ตั้งค่าระบบ</h1>
          <p className="text-gray-600 mt-1">จัดการการตั้งค่าระบบ</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>การตั้งค่า</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">หน้านี้อยู่ระหว่างการพัฒนา</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
