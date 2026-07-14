export function NotificationSkeletonCard() {
  return (
    <div className="flex gap-4 border-b border-slate-100 p-4 bg-white animate-pulse">
      <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-200" />
      <div className="flex-1 min-w-0 pr-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-4 w-12 rounded bg-slate-200" />
        </div>
        <div className="h-3 w-full rounded bg-slate-200 mb-2" />
        <div className="h-2 w-16 rounded bg-slate-200" />
      </div>
    </div>
  );
}

export function NotificationListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
      {Array.from({ length: count }).map((_, idx) => (
        <NotificationSkeletonCard key={idx} />
      ))}
    </div>
  );
}

export function NotificationDropdownSkeleton() {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: 3 }).map((_, idx) => (
        <div key={idx} className="flex gap-3 p-3.5">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-200" />
          <div className="flex-1">
            <div className="h-3.5 w-24 rounded bg-slate-200 mb-1.5" />
            <div className="h-2.5 w-full rounded bg-slate-200 mb-1.5" />
            <div className="h-2 w-12 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}
