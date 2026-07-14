import { useState } from "react";
import { Filter, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import { NotificationPriority, NotificationType } from "@/lib/notifications/types";

interface NotificationFiltersProps {
  filters: {
    isRead?: boolean;
    priority?: string;
    type?: string;
    expired?: boolean;
    startDate?: string;
    endDate?: string;
  };
  onFilterChange: (filters: any) => void;
  onClearFilters: () => void;
}

export function NotificationFilters({
  filters,
  onFilterChange,
  onClearFilters,
}: NotificationFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggle = () => setIsOpen((prev) => !prev);

  const handleSelectRead = (val: string) => {
    onFilterChange({
      isRead: val === "all" ? undefined : val === "read",
    });
  };

  const handleSelectPriority = (val: string) => {
    onFilterChange({
      priority: val === "all" ? undefined : val,
    });
  };

  const handleSelectType = (val: string) => {
    onFilterChange({
      type: val === "all" ? undefined : val,
    });
  };

  const handleSelectDate = (field: "startDate" | "endDate", val: string) => {
    onFilterChange({
      [field]: val || undefined,
    });
  };

  const handleSelectExpired = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      expired: e.target.checked,
    });
  };

  const activeFiltersCount = [
    filters.isRead !== undefined,
    !!filters.priority,
    !!filters.type,
    filters.expired === true,
    !!filters.startDate,
    !!filters.endDate,
  ].filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Header */}
      <button
        onClick={handleToggle}
        className="flex w-full items-center justify-between p-5 text-sm font-bold text-slate-800 hover:bg-slate-50 transition-colors focus:outline-hidden md:cursor-default md:hover:bg-transparent"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4.5 w-4.5 text-slate-500" />
          <span>Filters</span>
          {activeFiltersCount > 0 && (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-3xs font-extrabold text-indigo-600 ring-1 ring-indigo-100">
              {activeFiltersCount}
            </span>
          )}
        </div>
        <div className="md:hidden">
          {isOpen ? <ChevronUp className="h-4.5 w-4.5 text-slate-500" /> : <ChevronDown className="h-4.5 w-4.5 text-slate-500" />}
        </div>
      </button>

      {/* Body */}
      <div className={`p-5 pt-0 border-t border-slate-100 md:block ${isOpen ? "block" : "hidden"}`}>
        <div className="space-y-5 mt-5">
          {/* Read Status */}
          <div>
            <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Read Status</label>
            <select
              value={filters.isRead === undefined ? "all" : filters.isRead ? "read" : "unread"}
              onChange={(e) => handleSelectRead(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 shadow-2xs"
            >
              <option value="all">All notifications</option>
              <option value="unread">Unread only</option>
              <option value="read">Read only</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Priority</label>
            <select
              value={filters.priority || "all"}
              onChange={(e) => handleSelectPriority(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 shadow-2xs"
            >
              <option value="all">All priorities</option>
              {Object.values(NotificationPriority).map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Alert Type */}
          <div>
            <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Alert Type</label>
            <select
              value={filters.type || "all"}
              onChange={(e) => handleSelectType(e.target.value)}
              className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 shadow-2xs"
            >
              <option value="all">All types</option>
              {Object.values(NotificationType).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, " ")}
                </option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div>
            <label className="block text-2xs font-extrabold text-slate-500 uppercase tracking-wider mb-2">Date Range</label>
            <div className="space-y-2">
              <input
                type="date"
                value={filters.startDate || ""}
                onChange={(e) => handleSelectDate("startDate", e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
              <span className="block text-center text-3xs text-slate-400 font-bold uppercase">to</span>
              <input
                type="date"
                value={filters.endDate || ""}
                onChange={(e) => handleSelectDate("endDate", e.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:border-indigo-600 focus:outline-hidden focus:ring-1 focus:ring-indigo-600 shadow-2xs"
              />
            </div>
          </div>

          {/* Expiration Checkbox */}
          <div className="flex items-center gap-2.5 pt-2">
            <input
              id="expired-filter"
              type="checkbox"
              checked={filters.expired || false}
              onChange={handleSelectExpired}
              className="h-4 w-4 rounded-sm border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
            />
            <label htmlFor="expired-filter" className="text-xs font-medium text-slate-700 cursor-pointer">
              Show expired notifications
            </label>
          </div>

          {/* Reset Filters */}
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearFilters}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
            >
              <RotateCcw className="h-4 w-4 text-slate-500" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
export default NotificationFilters;
