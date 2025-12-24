'use client';

import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Menu } from 'lucide-react';
import Link from 'next/link';
import { NotificationBell } from '@/components/notification/NotificationBell';

interface NavbarProps {
  onMenuClick?: () => void;
}

export function Navbar({ onMenuClick }: NavbarProps) {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'ผู้ดูแลระบบ';
      case 'instructor':
        return 'ผู้สอน';
      default:
        return 'นักศึกษา';
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
      <div className="max-w-7xl mx-auto">
        {/* Top Bar */}
        <div className="flex h-16 items-center justify-between px-4 md:px-6">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo */}
          <Link 
            href={user?.role === 'admin' ? '/admin/dashboard' : user?.role === 'instructor' ? '/instructor/checkin' : '/student/dashboard'} 
            className="flex items-center space-x-2 mr-6"
          >
            <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white text-xl font-bold">7</span>
            </div>
            <span className="font-bold text-xl text-gray-900 hidden sm:inline-block">
              7-Eleven Training
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 flex-1 ml-8">
            {user?.role === 'student' && (
              <>
                <Link 
                  href="/student/dashboard" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  หน้าแรก
                </Link>
                <Link 
                  href="/student/courses" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  หลักสูตร
                </Link>
                <Link 
                  href="/student/my-bookings" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  การจองของฉัน
                </Link>
                <Link 
                  href="/student/profile" 
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors"
                >
                  โปรไฟล์
                </Link>
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <NotificationBell />

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-green-700" />
                    </div>
                    <div className="hidden md:block text-left">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.student_id}</p>
                      <p className="text-xs text-gray-500">{getRoleLabel(user.role)}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={user?.role === 'student' ? '/student/profile' : user?.role === 'admin' ? '/admin/settings' : '/instructor/stamps'} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      <span>โปรไฟล์</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ออกจากระบบ</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/login">
                <Button variant="outline">เข้าสู่ระบบ</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
