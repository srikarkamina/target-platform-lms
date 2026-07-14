"use client";

import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBadge } from "./NotificationBadge";
import { NotificationDropdown } from "./NotificationDropdown";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    fetchNotifications,
    fetchUnreadCount,
  } = useNotifications();

  // Load unread count on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Load latest notifications when dropdown is opened
  useEffect(() => {
    if (isOpen) {
      fetchNotifications({ limit: 10, page: 1 });
    }
  }, [isOpen, fetchNotifications]);

  // Auto-refresh: count polls every 60s & refreshes on window focus
  useEffect(() => {
    const handleFocus = () => {
      fetchUnreadCount();
    };
    window.addEventListener("focus", handleFocus);

    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 60000); // 60 seconds

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchUnreadCount]);

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        id="notification-menu-button"
        onClick={toggleDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs hover:text-indigo-600 focus:outline-hidden focus:ring-2 focus:ring-indigo-600 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={`Open notifications panel. ${unreadCount} unread notifications.`}
      >
        <Bell className="h-5 w-5 text-slate-500 hover:text-indigo-600 transition-colors" />
        <NotificationBadge count={unreadCount} />
      </button>

      <NotificationDropdown
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        loading={loading}
        markAsRead={markAsRead}
        markAllAsRead={markAllAsRead}
        deleteNotification={deleteNotification}
      />
    </div>
  );
}
export default NotificationBell;
