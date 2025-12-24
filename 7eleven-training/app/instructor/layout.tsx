'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { InstructorSidebar } from '@/components/layout/InstructorSidebar';
import { Footer } from '@/components/layout/Footer';
import { NotificationToast } from '@/components/notification/NotificationToast';

export default function InstructorLayout({
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

    if (user.role !== 'instructor' && user.role !== 'admin') {
      if (user.role === 'student') {
        router.push('/student/dashboard');
      } else if (user.role === 'admin') {
        router.push('/admin/dashboard');
      }
    }
  }, [user, isAuthenticated, router]);

  if (!isAuthenticated || !user || (user.role !== 'instructor' && user.role !== 'admin')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <InstructorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
      <NotificationToast />
    </div>
  );
}
