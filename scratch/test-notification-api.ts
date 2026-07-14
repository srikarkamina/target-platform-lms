import "dotenv/config";
import { NextRequest } from "next/server";
import { GET as getNotifications } from "../app/api/notifications/route";
import { GET as getNotificationsCount } from "../app/api/notifications/count/route";
import { PATCH as readAllNotifications } from "../app/api/notifications/read-all/route";
import { PATCH as readNotification } from "../app/api/notifications/[id]/read/route";
import { DELETE as deleteNotification } from "../app/api/notifications/[id]/route";
import {
  notifyAssignmentCreated,
  notifyAssignmentDue,
  notifyCertificateIssued,
  notifyCertificateRevoked,
  notifyGeneral,
} from "../lib/services/notification-service";
import { generateToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Role, NotificationPriority, NotificationType } from "../app/generated/prisma/client";

async function main() {
  console.log("=== STARTING HARDENED NOTIFICATION BACKEND INTEGRATION TESTS ===");

  // 1. Setup mock data
  const institute1 = await prisma.institute.create({
    data: { name: "Hardened Institute 1" },
  });
  const institute2 = await prisma.institute.create({
    data: { name: "Hardened Institute 2" },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Student 1",
      email: "student1.hardened@notification-test.com",
      password: "password123",
      role: Role.STUDENT,
      instituteId: institute1.id,
    },
  });

  const student2 = await prisma.user.create({
    data: {
      name: "Student 2",
      email: "student2.hardened@notification-test.com",
      password: "password123",
      role: Role.STUDENT,
      instituteId: institute2.id,
    },
  });

  const student3 = await prisma.user.create({
    data: {
      name: "Student 3",
      email: "student3.hardened@notification-test.com",
      password: "password123",
      role: Role.STUDENT,
      instituteId: institute1.id, // same institute as student 1 for bulk tests
    },
  });

  const superadmin = await prisma.user.create({
    data: {
      name: "Super Admin",
      email: "superadmin.hardened@notification-test.com",
      password: "password123",
      role: Role.SUPER_ADMIN,
    },
  });

  // Generate tokens
  const student1Token = generateToken({ id: student1.id, email: student1.email, role: student1.role });
  const student2Token = generateToken({ id: student2.id, email: student2.email, role: student2.role });
  const student3Token = generateToken({ id: student3.id, email: student3.email, role: student3.role });
  const superadminToken = generateToken({ id: superadmin.id, email: superadmin.email, role: superadmin.role });

  let testNotifs: string[] = [];

  try {
    // TEST 1: Typed Helpers (Single Notification Creation with Priorities)
    console.log("\n--- Test 1: Create Notifications via Typed Helpers ---");
    
    // Assignment Created -> Normal
    const notif1 = await notifyAssignmentCreated({
      userIds: student1.id,
      instituteId: institute1.id,
      title: "Assignment Created",
      message: "Math Assignment 1 has been published.",
      actionUrl: `/dashboard/assignments/math-1`,
    });
    testNotifs.push(notif1.id);
    console.log(`Created Assignment Created Notif: ${notif1.id} (Priority: ${notif1.priority})`);

    // Assignment Due -> High
    const notif2 = await notifyAssignmentDue({
      userIds: student1.id,
      instituteId: institute1.id,
      title: "Assignment Due",
      message: "Math Assignment 1 is due in 2 hours.",
      actionUrl: `/dashboard/assignments/math-1`,
    });
    testNotifs.push(notif2.id);
    console.log(`Created Assignment Due Notif: ${notif2.id} (Priority: ${notif2.priority})`);

    // Certificate Issued -> Low
    const notif3 = await notifyCertificateIssued({
      userIds: student1.id,
      instituteId: institute1.id,
      title: "Certificate Issued",
      message: "Your Calculus certificate is ready.",
      actionUrl: `/dashboard/certificates/calc-cert`,
    });
    testNotifs.push(notif3.id);
    console.log(`Created Certificate Issued Notif: ${notif3.id} (Priority: ${notif3.priority})`);

    // Certificate Revoked -> Urgent
    const notif4 = await notifyCertificateRevoked({
      userIds: student1.id,
      instituteId: institute1.id,
      title: "Certificate Revoked",
      message: "Calculus certificate has been revoked due to audit.",
      actionUrl: `/dashboard/certificates/calc-cert`,
    });
    testNotifs.push(notif4.id);
    console.log(`Created Certificate Revoked Notif: ${notif4.id} (Priority: ${notif4.priority})`);

    // Verify properties in Database
    if (
      notif1.priority !== NotificationPriority.NORMAL ||
      notif2.priority !== NotificationPriority.HIGH ||
      notif3.priority !== NotificationPriority.LOW ||
      notif4.priority !== NotificationPriority.URGENT
    ) {
      console.error("❌ Test Failed: Default priorities are incorrect!");
    } else {
      console.log("✅ Priorities verified successfully.");
    }

    // TEST 2: Bulk Helper (createNotifications)
    console.log("\n--- Test 2: Bulk Notification Creation ---");
    const bulkResult = await notifyGeneral({
      userIds: [student1.id, student3.id],
      instituteId: institute1.id,
      title: "General Maintenance",
      message: "Systems down from 2 AM to 4 AM tonight.",
      priority: NotificationPriority.HIGH,
    });
    console.log("Bulk creation result count (Expected 2):", bulkResult.count);
    if (bulkResult.count !== 2) {
      console.error("❌ Test Failed: Bulk notification creation failed!");
    } else {
      console.log("✅ Bulk notifications created.");
    }

    // Retrieve bulk notifications for cleanup tracking
    const bulkNotifs = await prisma.notification.findMany({
      where: { title: "General Maintenance" },
      select: { id: true },
    });
    bulkNotifs.forEach((n) => testNotifs.push(n.id));

    // TEST 3: GET /api/notifications/count (Unread count verification)
    console.log("\n--- Test 3: GET /api/notifications/count (Expected: 5 for student 1) ---");
    const req3 = new NextRequest("http://localhost:3000/api/notifications/count", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res3 = await getNotificationsCount(req3);
    const body3 = await res3.json();
    console.log("Unread count result:", JSON.stringify(body3));
    if (res3.status !== 200 || !body3.success || body3.data.unread !== 5) {
      console.error("❌ Test Failed: Unread count mismatch!");
    } else {
      console.log("✅ Unread count matches expected value (5).");
    }

    // TEST 4: GET /api/notifications Filters (Priority & Type)
    console.log("\n--- Test 4: GET /api/notifications (Filter by Priority: URGENT) ---");
    const req4_1 = new NextRequest("http://localhost:3000/api/notifications?priority=URGENT", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res4_1 = await getNotifications(req4_1);
    const body4_1 = await res4_1.json();
    console.log("Urgent notifications count (Expected 1):", body4_1.total);
    console.log("Titles:", body4_1.notifications?.map((n: any) => n.title));
    if (body4_1.total !== 1 || body4_1.notifications?.[0]?.priority !== NotificationPriority.URGENT) {
      console.error("❌ Test Failed: Priority filtering failed!");
    } else {
      console.log("✅ Priority filter verified.");
    }

    console.log("\n--- Test 4.2: GET /api/notifications (Filter by Type: ASSIGNMENT_DUE) ---");
    const req4_2 = new NextRequest("http://localhost:3000/api/notifications?type=ASSIGNMENT_DUE", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res4_2 = await getNotifications(req4_2);
    const body4_2 = await res4_2.json();
    console.log("Assignment Due notifications count (Expected 1):", body4_2.total);
    console.log("Titles:", body4_2.notifications?.map((n: any) => n.title));
    if (body4_2.total !== 1 || body4_2.notifications?.[0]?.type !== NotificationType.ASSIGNMENT_DUE) {
      console.error("❌ Test Failed: Type filtering failed!");
    } else {
      console.log("✅ Type filter verified.");
    }

    // TEST 5: Expiration Filter (expired=false vs expired=true)
    console.log("\n--- Test 5: GET /api/notifications (Expiration Filtering) ---");
    
    // Create an expired notification (expired 5 minutes ago)
    const expiredNotif = await notifyGeneral({
      userIds: student1.id,
      instituteId: institute1.id,
      title: "Expired Announcement",
      message: "This should not show up by default.",
      expiresAt: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    });
    testNotifs.push(expiredNotif.id);

    // Call GET with default parameters (expired=false)
    const req5_1 = new NextRequest("http://localhost:3000/api/notifications", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res5_1 = await getNotifications(req5_1);
    const body5_1 = await res5_1.json();
    console.log("Notifications count default (Expected 5, excluding expired):", body5_1.total);
    const hasExpiredByDefault = body5_1.notifications?.some((n: any) => n.id === expiredNotif.id);
    console.log("Has expired notification in default list:", hasExpiredByDefault);

    // Call GET with expired=true
    const req5_2 = new NextRequest("http://localhost:3000/api/notifications?expired=true", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res5_2 = await getNotifications(req5_2);
    const body5_2 = await res5_2.json();
    console.log("Notifications count with expired=true (Expected 6):", body5_2.total);
    const hasExpiredWithFlag = body5_2.notifications?.some((n: any) => n.id === expiredNotif.id);
    console.log("Has expired notification with expired=true:", hasExpiredWithFlag);

    if (hasExpiredByDefault || !hasExpiredWithFlag) {
      console.error("❌ Test Failed: Expiration filtering logic failed!");
    } else {
      console.log("✅ Expiration filtering verified successfully.");
    }

    // Check count API ignores expired records
    const req5_3 = new NextRequest("http://localhost:3000/api/notifications/count", {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res5_3 = await getNotificationsCount(req5_3);
    const body5_3 = await res5_3.json();
    console.log("Count API unread count (Expected 5):", body5_3.data.unread);
    if (body5_3.data.unread !== 5) {
      console.error("❌ Test Failed: Count API did not exclude expired notifications!");
    } else {
      console.log("✅ Count API excludes expired notifications successfully.");
    }

    // TEST 6: Date Range Filters
    console.log("\n--- Test 6: GET /api/notifications (Date Range Filter) ---");
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const req6 = new NextRequest(`http://localhost:3000/api/notifications?startDate=${yesterday.toISOString()}&endDate=${tomorrow.toISOString()}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res6 = await getNotifications(req6);
    const body6 = await res6.json();
    console.log("Range query results (Expected 5 active):", body6.total);
    if (body6.total !== 5) {
      console.error("❌ Test Failed: Date range filter count mismatch!");
    } else {
      console.log("✅ Date range filter verified.");
    }

    // TEST 7: Mark Read and Delete checks (Confirming no regressions)
    console.log("\n--- Test 7: PATCH /api/notifications/[id]/read (Successful read) ---");
    const req7 = new NextRequest(`http://localhost:3000/api/notifications/${notif1.id}/read`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${student1Token}` },
    });
    const res7 = await readNotification(req7, { params: Promise.resolve({ id: notif1.id }) });
    const body7 = await res7.json();
    console.log("IsRead updated to:", body7.isRead);

    // Verify count decreased to 4
    const res7Count = await getNotificationsCount(
      new NextRequest("http://localhost:3000/api/notifications/count", {
        method: "GET",
        headers: { Authorization: `Bearer ${student1Token}` },
      })
    );
    const body7Count = await res7Count.json();
    console.log("Updated unread count (Expected 4):", body7Count.data.unread);
    if (body7Count.data.unread !== 4) {
      console.error("❌ Test Failed: Count did not decrease after mark as read!");
    } else {
      console.log("✅ Regression tests passed.");
    }

  } catch (error: any) {
    console.error("UNEXPECTED ERROR DURING TESTS:", error);
  } finally {
    // Cleanup DB
    console.log("\n=== CLEANING UP DATABASE TEST RECORDS ===");
    if (testNotifs.length > 0) {
      await prisma.notification.deleteMany({
        where: { id: { in: testNotifs } },
      });
    }
    await prisma.user.deleteMany({
      where: { id: { in: [student1.id, student2.id, student3.id, superadmin.id] } },
    });
    await prisma.institute.deleteMany({
      where: { id: { in: [institute1.id, institute2.id] } },
    });
    console.log("Cleanup finished.");
    await prisma.$disconnect();
  }
}

main().catch(console.error);
