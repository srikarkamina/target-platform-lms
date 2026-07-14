"use client";

import { useState, useEffect, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
import { useNotifications, FetchFilters } from "@/hooks/useNotifications";
import { NotificationHeader } from "@/components/notifications/NotificationHeader";
import { NotificationFilters } from "@/components/notifications/NotificationFilters";
import { NotificationSearch } from "@/components/notifications/NotificationSearch";
import { NotificationList } from "@/components/notifications/NotificationList";
import { NotificationPagination } from "@/components/notifications/NotificationPagination";

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    error,
    page,
    totalPages,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  // Local state for filters and search term
  const [filters, setFilters] = useState<Omit<FetchFilters, "page" | "limit">>({
    isRead: undefined,
    priority: undefined,
    type: undefined,
    expired: false,
    startDate: undefined,
    endDate: undefined,
  });

  const [pageState, setPageState] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Load initial counts and list
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Fetch list when filters or page changes
  useEffect(() => {
    fetchNotifications({
      page: pageState,
      limit: 10,
      ...filters,
    });
  }, [pageState, filters, fetchNotifications]);

  // Reset page when filters change
  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }));
    setPageState(1);
  };

  const handleClearFilters = () => {
    setFilters({
      isRead: undefined,
      priority: undefined,
      type: undefined,
      expired: false,
      startDate: undefined,
      endDate: undefined,
    });
    setSearchTerm("");
    setPageState(1);
  };

  const handlePageChange = (newPage: number) => {
    setPageState(newPage);
  };

  const handleRetry = () => {
    fetchUnreadCount();
    fetchNotifications({
      page: pageState,
      limit: 10,
      ...filters,
    });
  };

  // Client-side search filtering (debounced by component inputs)
  const filteredNotifications = useMemo(() => {
    if (!searchTerm) return notifications;
    const query = searchTerm.toLowerCase();
    return notifications.filter(
      (n) =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.type.toLowerCase().includes(query)
    );
  }, [notifications, searchTerm]);

  return (
    <DashboardLayout>
      <DashboardPageContainer>
          {/* Header area */}
          <NotificationHeader
            unreadCount={unreadCount}
            onMarkAllAsRead={markAllAsRead}
            hasNotifications={notifications.length > 0}
          />

          {/* Main Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
            {/* Sticky Filters Column */}
            <div className="lg:col-span-1 lg:sticky lg:top-6">
              <NotificationFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={handleClearFilters}
              />
            </div>

            {/* List Column */}
            <div className="lg:col-span-3 space-y-4">
              <NotificationSearch value={searchTerm} onChange={setSearchTerm} />

              <div className="flex flex-col">
                <NotificationList
                  notifications={filteredNotifications}
                  loading={loading}
                  error={error}
                  onMarkRead={markAsRead}
                  onDelete={deleteNotification}
                  onRetry={handleRetry}
                  isSearchActive={!!searchTerm}
                  isUnreadFilterActive={filters.isRead === false}
                />

                <NotificationPagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              </div>
            </div>
          </div>
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
