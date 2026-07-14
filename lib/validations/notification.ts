import { z } from "zod";
import { NotificationPriority, NotificationType } from "@/app/generated/prisma/client";

export const getNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  isRead: z
    .string()
    .optional()
    .transform((val) => {
      if (val === "true") return true;
      if (val === "false") return false;
      return undefined;
    }),
  priority: z.nativeEnum(NotificationPriority).optional(),
  type: z.nativeEnum(NotificationType).optional(),
  expired: z
    .string()
    .optional()
    .default("false")
    .transform((val) => val === "true"),
  startDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: "Invalid startDate format",
    }),
  endDate: z
    .string()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined))
    .refine((date) => !date || !isNaN(date.getTime()), {
      message: "Invalid endDate format",
    }),
});

export const notificationIdParamSchema = z.object({
  id: z.string().uuid("Invalid notification ID format"),
});
