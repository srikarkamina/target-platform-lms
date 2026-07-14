import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority, Notification } from "@/app/generated/prisma/client";

export interface CreateNotificationParams {
  userId: string;
  instituteId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface CreateNotificationsParams {
  userIds: string[];
  instituteId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority?: NotificationPriority;
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

export interface TypedNotificationParams {
  userIds: string | string[]; // Single user ID or list of user IDs
  instituteId: string;
  title: string;
  message: string;
  priority?: NotificationPriority; // optional priority override
  actionUrl?: string;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * Creates a single notification for a user inside an institute.
 * 
 * @param params - Configuration parameters for the notification.
 * @returns The created Notification object.
 */
export async function createNotification(params: CreateNotificationParams): Promise<Notification> {
  const { userId, instituteId, title, message, type, priority, actionUrl, expiresAt, metadata } = params;

  // 1. Verify recipient user exists and is not soft-deleted
  const recipient = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
  });
  if (!recipient) {
    throw new Error("Recipient user not found");
  }

  // 2. Verify institute exists and is not soft-deleted
  const institute = await prisma.institute.findFirst({
    where: { id: instituteId, deletedAt: null },
  });
  if (!institute) {
    throw new Error("Institute not found");
  }

  // 3. Verify user belongs to this institute (unless recipient is a SUPER_ADMIN)
  if (recipient.role !== "SUPER_ADMIN" && recipient.instituteId !== instituteId) {
    throw new Error("User does not belong to the specified institute");
  }

  // 4. Create the notification record
  const notification = await prisma.notification.create({
    data: {
      userId,
      instituteId,
      title,
      message,
      type,
      priority: priority || NotificationPriority.NORMAL,
      actionUrl: actionUrl || null,
      expiresAt: expiresAt || null,
      metadata: metadata || {},
    },
  });

  // Trigger Email Notification Asynchronously
  triggerEmailForNotification(notification).catch((err) => {
    console.error("Failed to trigger email notification in background:", err);
  });

  return notification;
}

/**
 * Creates multiple notifications efficiently for a list of users inside an institute.
 * Optimizes performance by querying recipient user validation in a single database query.
 * 
 * @param params - Configuration parameters for the bulk notifications.
 * @returns An object containing the count of created notifications.
 */
export async function createNotifications(params: CreateNotificationsParams): Promise<{ count: number }> {
  const { userIds, instituteId, title, message, type, priority, actionUrl, expiresAt, metadata } = params;

  if (userIds.length === 0) {
    return { count: 0 };
  }

  // 1. Verify institute exists and is not soft-deleted
  const institute = await prisma.institute.findFirst({
    where: { id: instituteId, deletedAt: null },
  });
  if (!institute) {
    throw new Error("Institute not found");
  }

  // 2. Fetch all target users in a single query to validate existence and tenant containment
  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      deletedAt: null,
    },
    select: { id: true, role: true, instituteId: true },
  });

  if (users.length !== userIds.length) {
    const foundIds = new Set(users.map((u) => u.id));
    const missingIds = userIds.filter((id) => !foundIds.has(id));
    throw new Error(`Recipient users not found: ${missingIds.join(", ")}`);
  }

  // 3. Verify users belong to this institute (unless recipient is a SUPER_ADMIN)
  for (const user of users) {
    if (user.role !== "SUPER_ADMIN" && user.instituteId !== instituteId) {
      throw new Error(`User ${user.id} does not belong to the specified institute`);
    }
  }

  // 4. Prepare data entries
  const data = userIds.map((userId) => ({
    userId,
    instituteId,
    title,
    message,
    type,
    priority: priority || NotificationPriority.NORMAL,
    actionUrl: actionUrl || null,
    expiresAt: expiresAt || null,
    metadata: metadata || {},
  }));

  // 5. Bulk insert
  const result = await prisma.notification.createMany({
    data,
  });

  // Trigger Bulk Email Notifications Asynchronously
  triggerEmailsForNotifications(data).catch((err) => {
    console.error("Failed to trigger bulk email notifications in background:", err);
  });

  return result;
}

/**
 * Internal helper to route typed notifications to either single or bulk creator depending on parameter type.
 */
async function sendTypedNotification(
  params: TypedNotificationParams & { type: NotificationType; defaultPriority: NotificationPriority }
): Promise<any> {
  const { userIds, instituteId, title, message, priority, actionUrl, expiresAt, metadata, type, defaultPriority } = params;
  
  const finalPriority = priority || defaultPriority;

  if (Array.isArray(userIds)) {
    return await createNotifications({
      userIds,
      instituteId,
      title,
      message,
      type,
      priority: finalPriority,
      actionUrl,
      expiresAt,
      metadata,
    });
  } else {
    return await createNotification({
      userId: userIds,
      instituteId,
      title,
      message,
      type,
      priority: finalPriority,
      actionUrl,
      expiresAt,
      metadata,
    });
  }
}

/**
 * Notifies student(s) that a new assignment has been created.
 * Default Type: ASSIGNMENT_CREATED
 * Default Priority: NORMAL
 * 
 * @example
 * await notifyAssignmentCreated({
 *   userIds: ["student-1", "student-2"],
 *   instituteId: "inst-1",
 *   title: "New Assignment: Algebra Homework",
 *   message: "Please complete by next Monday.",
 *   actionUrl: "/dashboard/assignments/algebra-hw-id"
 * });
 */
export async function notifyAssignmentCreated(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.ASSIGNMENT_CREATED,
    defaultPriority: NotificationPriority.NORMAL,
  });
}

/**
 * Notifies student(s) of an upcoming assignment due date.
 * Default Type: ASSIGNMENT_DUE
 * Default Priority: HIGH
 * 
 * @example
 * await notifyAssignmentDue({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Assignment Due Soon",
 *   message: "Algebra Homework is due in 3 hours.",
 *   actionUrl: "/dashboard/assignments/algebra-hw-id"
 * });
 */
export async function notifyAssignmentDue(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.ASSIGNMENT_DUE,
    defaultPriority: NotificationPriority.HIGH,
  });
}

/**
 * Notifies student(s) that a quiz has been published.
 * Default Type: QUIZ_PUBLISHED
 * Default Priority: NORMAL
 * 
 * @example
 * await notifyQuizPublished({
 *   userIds: ["student-1"],
 *   instituteId: "inst-1",
 *   title: "Quiz Published",
 *   message: "TypeScript quiz is now active.",
 *   actionUrl: "/dashboard/quizzes/ts-quiz-id"
 * });
 */
export async function notifyQuizPublished(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.QUIZ_PUBLISHED,
    defaultPriority: NotificationPriority.NORMAL,
  });
}

/**
 * Notifies student(s) that a quiz due date is close.
 * Default Type: QUIZ_DUE
 * Default Priority: HIGH
 * 
 * @example
 * await notifyQuizDue({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Quiz Deadline Approaching",
 *   message: "TypeScript quiz deadline is tonight at 11 PM.",
 *   actionUrl: "/dashboard/quizzes/ts-quiz-id"
 * });
 */
export async function notifyQuizDue(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.QUIZ_DUE,
    defaultPriority: NotificationPriority.HIGH,
  });
}

/**
 * Notifies a student that they have enrolled in a course.
 * Default Type: COURSE_ENROLLED
 * Default Priority: NORMAL
 * 
 * @example
 * await notifyCourseEnrolled({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Welcome to CS101",
 *   message: "You have successfully enrolled in Introduction to Computer Science.",
 *   actionUrl: "/dashboard/courses/cs101-id"
 * });
 */
export async function notifyCourseEnrolled(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.COURSE_ENROLLED,
    defaultPriority: NotificationPriority.NORMAL,
  });
}

/**
 * Notifies a student that they have completed a course.
 * Default Type: COURSE_COMPLETED
 * Default Priority: NORMAL
 * 
 * @example
 * await notifyCourseCompleted({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Course Completed!",
 *   message: "Congratulations on finishing Introduction to Computer Science.",
 *   actionUrl: "/dashboard/courses/cs101-id"
 * });
 */
export async function notifyCourseCompleted(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.COURSE_COMPLETED,
    defaultPriority: NotificationPriority.NORMAL,
  });
}

/**
 * Notifies a student that a new certificate has been issued.
 * Default Type: CERTIFICATE_ISSUED
 * Default Priority: LOW
 * 
 * @example
 * await notifyCertificateIssued({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Certificate Issued",
 *   message: "Your completion certificate for CS101 is ready.",
 *   actionUrl: "/dashboard/certificates/cert-123"
 * });
 */
export async function notifyCertificateIssued(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.CERTIFICATE_ISSUED,
    defaultPriority: NotificationPriority.LOW,
  });
}

/**
 * Notifies a student that their certificate has been revoked.
 * Default Type: CERTIFICATE_REVOKED
 * Default Priority: URGENT
 * 
 * @example
 * await notifyCertificateRevoked({
 *   userIds: "student-1",
 *   instituteId: "inst-1",
 *   title: "Certificate Revoked",
 *   message: "Your certificate for CS101 has been revoked.",
 *   actionUrl: "/dashboard/certificates/cert-123"
 * });
 */
export async function notifyCertificateRevoked(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.CERTIFICATE_REVOKED,
    defaultPriority: NotificationPriority.URGENT,
  });
}

/**
 * Sends a general announcement or custom alert to user(s).
 * Default Type: GENERAL
 * Default Priority: NORMAL
 * 
 * @example
 * await notifyGeneral({
 *   userIds: ["admin-1", "faculty-1", "student-1"],
 *   instituteId: "inst-1",
 *   title: "Scheduled Maintenance",
 *   message: "The platform will be down for 2 hours on Sunday.",
 *   priority: NotificationPriority.HIGH
 * });
 */
export async function notifyGeneral(params: TypedNotificationParams) {
  return await sendTypedNotification({
    ...params,
    type: NotificationType.GENERAL,
    defaultPriority: NotificationPriority.NORMAL,
  });
}

/**
 * Marks a notification as read after validating ownership and tenant isolation.
 */
export async function markNotificationAsRead(
  id: string,
  userId: string,
  instituteId: string | null,
  isSuperAdmin: boolean = false
): Promise<Notification> {
  const notification = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Access denied: Notification ownership mismatch");
  }

  if (!isSuperAdmin && notification.instituteId !== instituteId) {
    throw new Error("Access denied: Tenant mismatch");
  }

  return await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });
}

/**
 * Marks all unread notifications of a user as read.
 */
export async function markAllNotificationsAsRead(
  userId: string,
  instituteId: string | null,
  isSuperAdmin: boolean = false
): Promise<number> {
  const where: any = {
    userId,
    isRead: false,
    deletedAt: null,
  };

  if (!isSuperAdmin) {
    if (!instituteId) {
      throw new Error("Institute ID is required for non-super admins");
    }
    where.instituteId = instituteId;
  }

  const result = await prisma.notification.updateMany({
    where,
    data: { isRead: true },
  });

  return result.count;
}

/**
 * Soft deletes a notification after validating ownership and tenant isolation.
 */
export async function softDeleteNotification(
  id: string,
  userId: string,
  instituteId: string | null,
  isSuperAdmin: boolean = false
): Promise<Notification> {
  const notification = await prisma.notification.findFirst({
    where: { id, deletedAt: null },
  });

  if (!notification) {
    throw new Error("Notification not found");
  }

  if (notification.userId !== userId) {
    throw new Error("Access denied: Notification ownership mismatch");
  }

  if (!isSuperAdmin && notification.instituteId !== instituteId) {
    throw new Error("Access denied: Tenant mismatch");
  }

  return await prisma.notification.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

async function triggerEmailForNotification(notification: any) {
  try {
    // 1. Fetch recipient email and name
    const recipient = await prisma.user.findFirst({
      where: { id: notification.userId, deletedAt: null },
      select: { email: true, name: true, role: true },
    });
    if (!recipient || !recipient.email) return;

    // 2. Fetch settings
    const settings = await prisma.instituteSettings.findUnique({
      where: { instituteId: notification.instituteId },
      select: { name: true, emailNotificationsEnabled: true },
    });
    if (!settings || !settings.emailNotificationsEnabled) return;

    // 3. Import sendTemplateEmail dynamically to avoid circular dependencies
    const { sendTemplateEmail } = await import("@/lib/services/email-service");

    let emailType: any = null;
    const variables: Record<string, string> = {
      studentName: recipient.name,
      name: recipient.name,
      instituteName: settings.name || "Target LMS",
      message: notification.message,
    };

    if (notification.type === NotificationType.ASSIGNMENT_CREATED) {
      emailType = "ASSIGNMENT_CREATED";
      variables.assignmentName = notification.title.replace("New Assignment: ", "");
    } else if (notification.type === NotificationType.ASSIGNMENT_DUE) {
      emailType = "ASSIGNMENT_REMINDER";
      variables.assignmentName = notification.title.replace("Reminder: Assignment ", "").replace(" is due soon", "");
    } else if (notification.type === NotificationType.QUIZ_PUBLISHED) {
      emailType = "QUIZ_PUBLISHED";
      variables.quizName = notification.title.replace("New Quiz Available: ", "").replace("Quiz Published: ", "");
    } else if (notification.type === NotificationType.QUIZ_DUE) {
      emailType = "QUIZ_REMINDER";
      variables.quizName = notification.title.replace("Reminder: Quiz ", "").replace(" is pending", "");
    } else if (notification.type === NotificationType.COURSE_ENROLLED) {
      emailType = "COURSE_ENROLLMENT";
      const match = notification.message.match(/"([^"]+)"/) || notification.message.match(/'([^']+)'/);
      variables.courseName = match ? match[1] : notification.title.replace("Enrolled in Course: ", "");
    } else if (notification.type === NotificationType.CERTIFICATE_ISSUED) {
      emailType = "CERTIFICATE_ISSUED";
      variables.certificateId = notification.metadata?.certificateId || "N/A";
    } else {
      emailType = "GENERAL";
    }

    if (emailType) {
      await sendTemplateEmail({
        recipientEmail: recipient.email,
        type: emailType,
        variables,
        userId: notification.userId,
        instituteId: notification.instituteId,
      });
    }
  } catch (error) {
    console.error("Failed to trigger email notification:", error);
  }
}

async function triggerEmailsForNotifications(notifications: any[]) {
  for (const notif of notifications) {
    triggerEmailForNotification(notif).catch((err) => {
      console.error("Failed to trigger bulk email:", err);
    });
  }
}

/**
 * Triggers scheduled notification alerts for events and polls just-in-time.
 */
export async function triggerScheduledNotifications(instituteId: string) {
  try {
    const now = new Date();

    // 1. Event Reminders: Events starting in next 24 hours
    const upcomingEvents = await prisma.event.findMany({
      where: {
        instituteId,
        reminderSent: false,
        deletedAt: null,
        startDate: {
          gt: now,
          lte: new Date(now.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        registrations: {
          where: { deletedAt: null },
          select: { studentId: true }
        }
      }
    });

    for (const event of upcomingEvents) {
      const studentIds = event.registrations.map(r => r.studentId);
      if (studentIds.length > 0) {
        await createNotifications({
          userIds: studentIds,
          instituteId,
          title: `Upcoming Event Reminder: ${event.title}`,
          message: `Reminder: The event "${event.title}" starts soon on ${event.startDate.toLocaleDateString()}.`,
          type: NotificationType.EVENT_REMINDER,
          priority: NotificationPriority.HIGH,
          actionUrl: `/dashboard/events`
        });
      }
      await prisma.event.update({
        where: { id: event.id },
        data: { reminderSent: true }
      });
    }

    // 2. Poll Closed: Polls that have expired
    const expiredPolls = await prisma.poll.findMany({
      where: {
        instituteId,
        deletedAt: null,
        expiryDate: { lte: now }
      }
    });

    for (const poll of expiredPolls) {
      const alreadyNotified = await prisma.notification.findFirst({
        where: {
          instituteId,
          type: NotificationType.POLL_CLOSED,
          metadata: {
            equals: { pollId: poll.id }
          }
        }
      });

      if (!alreadyNotified) {
        const votes = await prisma.pollVote.findMany({
          where: { pollId: poll.id, deletedAt: null },
          select: { userId: true }
        });
        const voterIds = Array.from(new Set(votes.map(v => v.userId)));

        if (voterIds.length > 0) {
          await createNotifications({
            userIds: voterIds,
            instituteId,
            title: `Poll Ended: ${poll.question}`,
            message: `The poll "${poll.question}" is now closed. View results.`,
            type: NotificationType.POLL_CLOSED,
            priority: NotificationPriority.NORMAL,
            actionUrl: `/dashboard/polls`,
            metadata: { pollId: poll.id }
          });
        }
      }
    }
  } catch (err) {
    console.error("Scheduled notifications check failed:", err);
  }
}

