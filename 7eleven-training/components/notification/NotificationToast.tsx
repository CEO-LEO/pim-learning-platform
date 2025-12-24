'use client';

import { useNotificationStore } from '@/store/notification-store';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function NotificationToast() {
  const { notifications, removeNotification } = useNotificationStore();
  
  // Show only unread notifications of type info/success as toasts
  const toastNotifications = notifications.filter(
    (n) => !n.read && (n.type === 'info' || n.type === 'success')
  );

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case 'success':
        return 'default';
      case 'warning':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  };

  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {toastNotifications.map((notification) => (
        <Alert
          key={notification.id}
          variant={getVariant(notification.type)}
          className={cn(
            'shadow-lg animate-in slide-in-from-right',
            notification.type === 'success' && 'border-green-200 bg-green-50',
            notification.type === 'info' && 'border-blue-200 bg-blue-50'
          )}
        >
          <div className="flex items-start space-x-2">
            {getIcon(notification.type)}
            <div className="flex-1">
              <AlertDescription className="font-medium">{notification.title}</AlertDescription>
              <AlertDescription className="text-sm">{notification.message}</AlertDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Alert>
      ))}
    </div>
  );
}
