import type { Notification as PrismaNotification } from "@/app/generated/prisma/client";
import { NotificationType, NotificationPriority } from "@/app/generated/prisma/enums";

export type Notification = PrismaNotification;
export { NotificationType, NotificationPriority };
export type { NotificationType as NotificationTypeType, NotificationPriority as NotificationPriorityType };
