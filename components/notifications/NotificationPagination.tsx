import { ChevronLeft, ChevronRight } from "lucide-react";

interface NotificationPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function NotificationPagination({
  page,
  totalPages,
  onPageChange,
}: NotificationPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4 rounded-b-2xl shadow-xs">
      <div className="flex flex-1 justify-between sm:hidden">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="relative ml-3 inline-flex items-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
        >
          Next
        </button>
      </div>
      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-xs text-slate-500">
            Page <strong className="font-semibold text-slate-900">{page}</strong> of{" "}
            <strong className="font-semibold text-slate-900">{totalPages}</strong>
          </p>
        </div>
        <div>
          <nav className="isolate inline-flex rounded-xl shadow-2xs gap-1.5" aria-label="Pagination">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Previous Page"
            >
              <ChevronLeft className="h-4.5 w-4.5" />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="relative inline-flex items-center rounded-xl border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
              aria-label="Next Page"
            >
              <ChevronRight className="h-4.5 w-4.5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}
export default NotificationPagination;
