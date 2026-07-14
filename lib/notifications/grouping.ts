import { Notification } from "./types";

export interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  earlier: Notification[];
}

/**
 * Groups a list of notifications by date relative to the current local time:
 * - Today
 * - Yesterday
 * - Earlier
 * 
 * @param notifications - List of Notification objects.
 * @returns GroupedNotifications object containing grouped lists.
 */
export function groupNotifications(notifications: Notification[]): GroupedNotifications {
  const grouped: GroupedNotifications = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  const todayStr = new Date().toDateString();

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toDateString();

  for (const notif of notifications) {
    const notifDate = new Date(notif.createdAt);
    const notifDateStr = notifDate.toDateString();

    if (notifDateStr === todayStr) {
      grouped.today.push(notif);
    } else if (notifDateStr === yesterdayStr) {
      grouped.yesterday.push(notif);
    } else {
      grouped.earlier.push(notif);
    }
  }

  return grouped;
}
