import {
  FileText,
  ClipboardList,
  BookOpen,
  Trophy,
  AlertTriangle,
  Bell,
  type LucideIcon,
} from "lucide-react";
import { NotificationType } from "./types";

/**
 * Maps a NotificationType to its corresponding Lucide Icon component.
 * 
 * @param type - The NotificationType.
 * @returns The LucideIcon react component.
 */
export function getNotificationIcon(type: NotificationType): LucideIcon {
  switch (type) {
    case NotificationType.ASSIGNMENT_CREATED:
    case NotificationType.ASSIGNMENT_DUE:
      return FileText;
    case NotificationType.QUIZ_PUBLISHED:
    case NotificationType.QUIZ_DUE:
      return ClipboardList;
    case NotificationType.COURSE_ENROLLED:
    case NotificationType.COURSE_COMPLETED:
      return BookOpen;
    case NotificationType.CERTIFICATE_ISSUED:
      return Trophy;
    case NotificationType.CERTIFICATE_REVOKED:
      return AlertTriangle;
    case NotificationType.GENERAL:
    default:
      return Bell;
  }
}
