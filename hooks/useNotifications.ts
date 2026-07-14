import { useState, useCallback, useRef } from "react";
import api from "@/lib/axios";
import { Notification } from "@/lib/notifications/types";
import { toast } from "react-hot-toast";

export interface FetchFilters {
  page?: number;
  limit?: number;
  isRead?: boolean;
  priority?: string;
  type?: string;
  expired?: boolean;
  startDate?: string;
  endDate?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [countLoading, setCountLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);

  const prevNotificationsRef = useRef<Notification[]>([]);
  const prevUnreadCountRef = useRef<number>(0);

  const fetchUnreadCount = useCallback(async () => {
    setCountLoading(true);
    try {
      const response = await api.get("/notifications/count");
      if (response.data?.success) {
        setUnreadCount(response.data.data.unread);
      }
    } catch (err: any) {
      console.error("Failed to fetch unread count:", err);
    } finally {
      setCountLoading(false);
    }
  }, []);

  const fetchNotifications = useCallback(async (filters: FetchFilters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, any> = {
        page: filters.page ?? 1,
        limit: filters.limit ?? 10,
      };

      if (filters.isRead !== undefined) {
        params.isRead = String(filters.isRead);
      }
      if (filters.priority) {
        params.priority = filters.priority;
      }
      if (filters.type) {
        params.type = filters.type;
      }
      if (filters.expired !== undefined) {
        params.expired = String(filters.expired);
      }
      if (filters.startDate) {
        params.startDate = filters.startDate;
      }
      if (filters.endDate) {
        params.endDate = filters.endDate;
      }

      const response = await api.get("/notifications", { params });
      
      setNotifications(response.data.notifications || []);
      setTotal(response.data.total || 0);
      setPage(response.data.page || 1);
      setTotalPages(response.data.totalPages || 1);
    } catch (err: any) {
      console.error("Failed to fetch notifications:", err);
      setError(err.response?.data?.message || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: string) => {
    prevNotificationsRef.current = notifications;
    prevUnreadCountRef.current = unreadCount;

    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await api.patch(`/notifications/${id}/read`);
      toast.success("Notification marked as read");
      fetchUnreadCount();
    } catch (err: any) {
      console.error("Failed to mark notification as read:", err);
      setNotifications(prevNotificationsRef.current);
      setUnreadCount(prevUnreadCountRef.current);
      toast.error("Failed to mark notification as read");
    }
  }, [notifications, unreadCount, fetchUnreadCount]);

  const markAllAsRead = useCallback(async () => {
    prevNotificationsRef.current = notifications;
    prevUnreadCountRef.current = unreadCount;

    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);

    try {
      await api.patch("/notifications/read-all");
      toast.success("All notifications marked as read");
      fetchUnreadCount();
    } catch (err: any) {
      console.error("Failed to mark all as read:", err);
      setNotifications(prevNotificationsRef.current);
      setUnreadCount(prevUnreadCountRef.current);
      toast.error("Failed to mark all notifications as read");
    }
  }, [notifications, unreadCount, fetchUnreadCount]);

  const deleteNotification = useCallback(async (id: string) => {
    prevNotificationsRef.current = notifications;
    prevUnreadCountRef.current = unreadCount;

    const target = notifications.find((n) => n.id === id);
    const wasUnread = target ? !target.isRead : false;

    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (wasUnread) {
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }

    try {
      await api.delete(`/notifications/${id}`);
      toast.success("Notification deleted");
      fetchUnreadCount();
    } catch (err: any) {
      console.error("Failed to delete notification:", err);
      setNotifications(prevNotificationsRef.current);
      setUnreadCount(prevUnreadCountRef.current);
      toast.error("Failed to delete notification");
    }
  }, [notifications, unreadCount, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    countLoading,
    error,
    page,
    totalPages,
    total,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
