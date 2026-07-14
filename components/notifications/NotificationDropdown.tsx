import { useEffect, useRef } from "react";
import Link from "next/link";
import { CheckCheck, X } from "lucide-react";
import { Notification } from "@/lib/notifications/types";
import { NotificationCard } from "./NotificationCard";
import { NotificationDropdownSkeleton } from "./NotificationSkeleton";
import { EmptyNotifications } from "./EmptyNotifications";

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
}

export function NotificationDropdown({
  isOpen,
  onClose,
  notifications,
  loading,
  markAsRead,
  markAllAsRead,
  deleteNotification,
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside detection
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Focus trapping & Escape key detection
  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key === "Tab" && dropdownRef.current) {
        const focusableElements = dropdownRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), div[tabindex="0"]'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            event.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            event.preventDefault();
          }
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Auto-focus first element when opening
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const focusableElements = dropdownRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), div[tabindex="0"]'
      );
      if (focusableElements.length > 0) {
        setTimeout(() => {
          focusableElements[0].focus();
        }, 50);
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 mt-2.5 w-80 md:w-96 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-hidden z-50 flex flex-col max-h-[500px] transition-all duration-200 ease-out ${
        isOpen
          ? "opacity-100 translate-y-0 scale-100 visible pointer-events-auto"
          : "opacity-0 -translate-y-2 scale-95 invisible pointer-events-none"
      }`}
      role="menu"
      aria-orientation="vertical"
      aria-labelledby="notification-menu-button"
    >
      {/* Dropdown Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Notifications</h3>
          <p className="text-4xs text-slate-500 mt-0.5">Latest alerts and updates</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={markAllAsRead}
            disabled={notifications.length === 0 || !notifications.some((n) => !n.isRead)}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
            title="Mark all as read"
            aria-label="Mark all notifications as read"
          >
            <CheckCheck className="h-4.5 w-4.5" />
          </button>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Close notifications panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Notifications List */}
      <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100">
        {loading ? (
          <NotificationDropdownSkeleton />
        ) : notifications.length === 0 ? (
          <div className="p-6">
            <EmptyNotifications />
          </div>
        ) : (
          notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
              onClickCloseDropdown={onClose}
            />
          ))
        )}
      </div>

      {/* Dropdown Footer */}
      <div className="border-t border-slate-100 bg-slate-50/50 p-3 text-center">
        <Link
          href="/dashboard/notifications"
          onClick={onClose}
          className="inline-flex w-full items-center justify-center rounded-xl bg-white border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-2xs hover:shadow-xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
        >
          View all notifications
        </Link>
      </div>
    </div>
  );
}
export default NotificationDropdown;
