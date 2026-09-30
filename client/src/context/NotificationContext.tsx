import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../../../shared/schemas';
import { api } from '../lib/api';
import { useAuth } from './AuthContext';

export interface ToastItem {
  id: string;
  type: 'info' | 'success' | 'warning' | 'alert';
  title: string;
  message: string;
  duration?: number;
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastItem[];
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  requestBrowserPermission: () => Promise<boolean>;
  browserNotificationsEnabled: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [browserNotificationsEnabled, setBrowserNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = { ...toast, id };
      setToasts((prev) => [...prev, newToast]);

      const duration = toast.duration || 6000;
      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const requestBrowserPermission = async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast({
        type: 'warning',
        title: 'Notifications Unsupported',
        message: 'Your browser does not support desktop notifications.',
      });
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      const granted = permission === 'granted';
      setBrowserNotificationsEnabled(granted);
      if (granted) {
        showToast({
          type: 'success',
          title: 'Notifications Enabled',
          message: 'You will receive live alerts when your turn approaches!',
        });
      }
      return granted;
    } catch {
      return false;
    }
  };

  const triggerDesktopNotification = (title: string, body: string) => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, {
          body,
          icon: '/favicon.ico',
        });
      } catch (err) {
        console.warn('Desktop notification error:', err);
      }
    }
  };

  // Load user notifications when logged in
  const refreshNotifications = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      return;
    }
    try {
      const items = await api.notifications.list();
      setNotifications(items);
    } catch (err) {
      console.warn('Failed to load notifications:', err);
    }
  }, [user]);

  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Connect to SSE for user-specific real-time notifications
  useEffect(() => {
    if (!user) return;

    const eventSource = new EventSource(`/api/events/user/${user.id}`);

    eventSource.addEventListener('notification', (e) => {
      try {
        const item: NotificationItem = JSON.parse(e.data);
        setNotifications((prev) => [item, ...prev]);

        showToast({
          type: 'alert',
          title: item.title,
          message: item.body,
        });

        triggerDesktopNotification(item.title, item.body);
      } catch (err) {
        console.error('SSE Notification parse error:', err);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [user, showToast]);

  const markAsRead = async (id: string) => {
    await api.notifications.markRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllAsRead = async () => {
    await api.notifications.markAllRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        showToast,
        removeToast,
        markAsRead,
        markAllAsRead,
        requestBrowserPermission,
        browserNotificationsEnabled,
      }}
    >
      {children}

      {/* In-app Toast container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-2xl border backdrop-blur-md transition-all duration-300 transform translate-y-0 ${
              toast.type === 'alert'
                ? 'bg-amber-950/90 border-amber-500/50 text-amber-100 glow-amber'
                : toast.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 glow-emerald'
                : toast.type === 'warning'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100'
                : 'bg-slate-900/90 border-indigo-500/40 text-slate-100 glow-indigo'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-sm">{toast.title}</h4>
                <p className="text-xs text-slate-300 mt-1">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
