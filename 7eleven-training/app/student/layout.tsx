'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/layout/Navbar';
import { StudentSidebar } from '@/components/layout/StudentSidebar';
import { Footer } from '@/components/layout/Footer';
import { NotificationToast } from '@/components/notification/NotificationToast';

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'student') {
      if (user.role === 'admin') {
        router.push('/admin/dashboard');
      } else if (user.role === 'instructor') {
        router.push('/instructor/checkin');
      }
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || !user || user.role !== 'student') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <StudentSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
      <NotificationToast />
    </div>
  );
}
