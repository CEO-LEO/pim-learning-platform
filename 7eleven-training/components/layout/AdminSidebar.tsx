'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  Settings,
  Calendar,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const menuItems = [
  {
    title: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'จัดการหลักสูตร',
    href: '/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'จัดการนักศึกษา',
    href: '/admin/students',
    icon: Users,
  },
  {
    title: 'ตั้งรอบเวลาภาคปฏิบัติ',
    href: '/admin/bookings',
    icon: Calendar,
  },
  {
    title: 'ตั้งค่า',
    href: '/admin/settings',
    icon: Settings,
  },
];

export function AdminSidebar({ isOpen = true, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out h-screen flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        {/* Mobile Close Button */}
        <div className="flex items-center justify-between p-4 border-b md:hidden">
          <span className="font-bold text-lg">เมนู</span>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-green-50 text-green-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                <Icon className={cn('h-5 w-5', isActive ? 'text-green-600' : 'text-gray-500')} />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
