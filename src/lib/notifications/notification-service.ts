import { io, Socket } from 'socket.io-client';
import { create } from 'zustand';
import { toast } from 'react-hot-toast';

export interface Notification {
  id: string;
  userId: string;
  type: 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED' | 'PROMOTION' | 'POINTS_EARNED' | 'SYSTEM';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface NotificationStore {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    })),
  markAsRead: (notificationId) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: state.unreadCount - 1,
    })),
  markAllAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    })),
  clearAll: () => set({ notifications: [], unreadCount: 0 }),
}));

class NotificationService {
  private socket: Socket | null = null;
  
  connect(userId: string) {
    this.socket = io(import.meta.env.VITE_API_URL, {
      auth: {
        userId,
      },
    });

    this.socket.on('notification', (notification: Notification) => {
      useNotificationStore.getState().addNotification(notification);
      
      // Mostra un toast per le notifiche importanti
      if (notification.type === 'BOOKING_CONFIRMED' || notification.type === 'BOOKING_CANCELLED') {
        toast(notification.message, {
          icon: notification.type === 'BOOKING_CONFIRMED' ? '✅' : '❌',
        });
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  async fetchNotifications(userId: string): Promise<Notification[]> {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/notifications/${userId}`);
      const notifications = await response.json();
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  }
}

export const notificationService = new NotificationService();
