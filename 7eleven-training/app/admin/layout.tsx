'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Navbar } from '@/components/layout/Navbar';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Footer } from '@/components/layout/Footer';
import { NotificationToast } from '@/components/notification/NotificationToast';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount (client-side only)
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const checkAuth = async () => {
      // First, try to get auth from localStorage directly (more reliable)
      let authUser = null;
      let authIsAuthenticated = false;
      
      try {
        const authStorage = localStorage.getItem('auth-storage');
        if (authStorage) {
          const parsed = JSON.parse(authStorage);
          if (parsed?.state) {
            authUser = parsed.state.user;
            authIsAuthenticated = parsed.state.isAuthenticated;
            console.log('[ADMIN LAYOUT] Found auth in localStorage:', { user: authUser, isAuthenticated: authIsAuthenticated });
          }
        }
      } catch (e) {
        console.error('[ADMIN LAYOUT] Error parsing localStorage:', e);
      }

      // Wait a bit for zustand to hydrate
      await new Promise(resolve => setTimeout(resolve, 200));

      // Use zustand state if available, otherwise use localStorage
      const finalUser = user || authUser;
      const finalIsAuthenticated = isAuthenticated || authIsAuthenticated;

      console.log('[ADMIN LAYOUT] Final auth check:', { 
        user: finalUser, 
        isAuthenticated: finalIsAuthenticated,
        zustandUser: user,
        zustandAuth: isAuthenticated
      });

      if (!finalIsAuthenticated || !finalUser) {
        console.log('[ADMIN LAYOUT] Not authenticated, redirecting to login');
        router.push('/login');
        return;
      }

      if (finalUser.role !== 'admin') {
        console.log('[ADMIN LAYOUT] User role is not admin:', finalUser.role);
        if (finalUser.role === 'student') {
          router.push('/student/dashboard');
        } else if (finalUser.role === 'instructor') {
          router.push('/instructor/checkin');
        }
        return;
      }
      
      console.log('[ADMIN LAYOUT] Auth check passed, user is admin');
      setIsChecking(false);
    };

    checkAuth();
  }, [mounted, user, isAuthenticated, router]);

  // Show loading state while checking auth or not mounted
  if (!mounted || isChecking || !isAuthenticated || !user || user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1">
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Footer />
      <NotificationToast />
    </div>
  );
}
