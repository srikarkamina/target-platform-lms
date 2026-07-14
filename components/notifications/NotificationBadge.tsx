interface NotificationBadgeProps {
  count: number;
}

export function NotificationBadge({ count }: NotificationBadgeProps) {
  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count;

  return (
    <span
      key={count}
      className="absolute -top-1.5 -right-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-2xs font-extrabold text-white ring-2 ring-white animate-badge-pop"
    >
      {displayCount}
    </span>
  );
}
