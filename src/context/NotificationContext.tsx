import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { AppNotification } from '../types/canteen.ts';
import { api } from '../lib/api.ts';
import { useAuth } from './AuthContext.tsx';

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  isDrawerOpen: boolean;
  setIsDrawerOpen: (open: boolean) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  playChime: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Subtle web audio chime for kitchen and order updates
  const playChime = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch {
      // AudioContext might be blocked until user gesture, ignore
    }
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.getNotifications();
      // Check if new unread notification arrived
      if (data.length > notifications.length && notifications.length > 0) {
        playChime();
      }
      setNotifications(data);
    } catch (err) {
      // ignore transient fetch errors
    }
  }, [user, notifications.length, playChime]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 10000);
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead();
      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, readAt: now })));
    } catch (e) {
      console.error(e);
    }
  };

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isDrawerOpen,
        setIsDrawerOpen,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        playChime,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
