import "dotenv/config";
import { NextRequest } from "next/server";
import { POST as createAssignment } from "../app/api/assignments/route";
import { PUT as updateAssignment, POST as remindAssignment } from "../app/api/assignments/[id]/route";
import { POST as createQuiz } from "../app/api/quizzes/route";
import { PUT as updateQuiz, POST as remindQuiz } from "../app/api/quizzes/[id]/route";
import { POST as createEnrollment } from "../app/api/enrollments/route";
import { POST as createStudent } from "../app/api/students/route";
import { PUT as updateStudent } from "../app/api/students/[id]/route";
import { POST as updateProgress } from "../app/api/progress/route";
import { POST as generateCertificate } from "../app/api/certificates/generate/route";
import { DELETE as revokeCertificate } from "../app/api/certificates/[id]/route";
import { generateToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Role, NotificationPriority, NotificationType } from "../app/generated/prisma/client";

async function main() {
  console.log("=== STARTING LMS NOTIFICATION INTEGRATION FLOW TESTS ===");

  let institute: any = null;
  let faculty: any = null;
  let admin: any = null;
  let studentUser: any = null;
  let course: any = null;
  let dummyCourse: any = null;
  let defaultBatch: any = null;
  let template: any = null;
  let video1: any = null;
  let video2: any = null;
  let assignData: any = null;
  let quiz1Data: any = null;
  let quiz2Data: any = null;
  let bulkStudent: any = null;
  let course2: any = null;
  let batch2: any = null;
  let course3: any = null;
  let certData: any = null;

  try {
    // Pre-cleanup in case of previous failed runs (using correct dependency order)
    const testEmails = [
      "faculty.integration@test.com",
      "admin.integration@test.com",
      "student.integration@test.com",
      "bulkstudent.integration@test.com"
    ];

    // 1. Delete progress
    await prisma.progress.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    // 2. Delete notifications
    await prisma.notification.deleteMany({
      where: { user: { email: { in: testEmails } } },
    });
    // 3. Delete certificates
    await prisma.certificate.deleteMany({
      where: { student: { email: { in: testEmails } } },
    });
    // 4. Delete submissions
    await prisma.submission.deleteMany({
      where: { student: { email: { in: testEmails } } },
    });
    // 5. Delete quiz attempts
    await prisma.quizAttempt.deleteMany({
      where: { student: { email: { in: testEmails } } },
    });
    // 6. Delete quizzes
    await prisma.quiz.deleteMany({
      where: { course: { institute: { name: "Integration Test Institute" } } },
    });
    // 7. Delete assignments
    await prisma.assignment.deleteMany({
      where: { course: { institute: { name: "Integration Test Institute" } } },
    });
    // 8. Delete videos
    await prisma.video.deleteMany({
      where: { course: { institute: { name: "Integration Test Institute" } } },
    });
    // 9. Delete enrollments
    await prisma.enrollment.deleteMany({
      where: { student: { email: { in: testEmails } } },
    });
    // 10. Delete batches
    await prisma.batch.deleteMany({
      where: { course: { institute: { name: "Integration Test Institute" } } },
    });
    // 11. Delete templates
    await prisma.certificateTemplate.deleteMany({
      where: { institute: { name: "Integration Test Institute" } },
    });
    // 12. Delete courses
    await prisma.course.deleteMany({
      where: { institute: { name: "Integration Test Institute" } },
    });
    // 13. Delete users
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
    // 14. Delete institute
    await prisma.institute.deleteMany({
      where: { name: "Integration Test Institute" },
    });

    // 1. Setup mock resources
    institute = await prisma.institute.create({
      data: { name: "Integration Test Institute" },
    });

    faculty = await prisma.user.create({
      data: {
        name: "Faculty Test",
        email: "faculty.integration@test.com",
        password: "password123",
        role: Role.FACULTY,
        instituteId: institute.id,
      },
    });

    admin = await prisma.user.create({
      data: {
        name: "Admin Test",
        email: "admin.integration@test.com",
        password: "password123",
        role: Role.ADMIN,
        instituteId: institute.id,
      },
    });

    studentUser = await prisma.user.create({
      data: {
        name: "Student Test",
        email: "student.integration@test.com",
        password: "password123",
        role: Role.STUDENT,
        instituteId: institute.id,
      },
    });

    course = await prisma.course.create({
      data: {
        title: "Integration Testing 101",
        courseCode: "IT101",
        description: "Learn how to integration test.",
        instituteId: institute.id,
        facultyId: faculty.id,
      },
    });

    dummyCourse = await prisma.course.create({
      data: {
        title: "Dummy Course for Seeding",
        courseCode: "DUMMY101",
        instituteId: institute.id,
        facultyId: faculty.id,
      },
    });

    defaultBatch = await prisma.batch.create({
      data: {
        name: "IT101-Default-Batch",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        courseId: course.id,
      },
    });

    // Enroll studentUser in the batch
    await prisma.enrollment.create({
      data: {
        studentId: studentUser.id,
        batchId: defaultBatch.id,
      },
    });

    // Create certificate template
    template = await prisma.certificateTemplate.create({
      data: {
        name: "IT101 Completion Template",
        title: "Certificate of Completion",
        backgroundImage: "bg.png",
        signatureImage: "sig.png",
        instituteId: institute.id,
        isActive: true,
      },
    });

    // Create some videos in the course for progress testing
    video1 = await prisma.video.create({
      data: {
        title: "Video Lesson 1",
        videoUrl: "https://example.com/v1.mp4",
        courseId: course.id,
        published: true,
        sortOrder: 1,
      },
    });

    video2 = await prisma.video.create({
      data: {
        title: "Video Lesson 2",
        videoUrl: "https://example.com/v2.mp4",
        courseId: course.id,
        published: true,
        sortOrder: 2,
      },
    });

    // WORKAROUND for global unique certificateNumber constraint:
    // We seed dummy certificates for our institute until our count equals/exceeds global count.
    // Using dummyCourse to bypass duplicate student+course certificate validation rules.
    const globalCount = await prisma.certificate.count();
    for (let i = 0; i < globalCount; i++) {
      await prisma.certificate.create({
        data: {
          instituteId: institute.id,
          studentId: studentUser.id,
          courseId: dummyCourse.id,
          templateId: template.id,
          certificateNumber: `CERT-DUMMY-${institute.id}-${i}`,
          certificateCode: `CODE-DUMMY-${institute.id}-${i}`,
          verificationToken: `TOKEN-DUMMY-${institute.id}-${i}`,
          status: "ACTIVE",
        },
      });
    }

    // Tokens
    const facultyToken = generateToken({ id: faculty.id, email: faculty.email, role: faculty.role });
    const adminToken = generateToken({ id: admin.id, email: admin.email, role: admin.role });
    const studentToken = generateToken({ id: studentUser.id, email: studentUser.email, role: studentUser.role });

    console.log("Mock data configured successfully.");

    // Mock question payload
    const mockQuestions = [
      {
        question: "What is TypeScript?",
        options: ["A programming language", "A coffee brand"],
        correctAnswers: ["A programming language"],
        questionType: "SINGLE_CHOICE",
        marks: 10,
        order: 1,
      },
    ];

    // -------------------------------------------------------------
    // TEST 1: Assignment Created Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 1: Assignment Created Notification Flow ---");
    const createAssignReq = new NextRequest("http://localhost:3000/api/assignments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Assignment",
        description: "Submit validation cases.",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        courseId: course.id,
      }),
    });

    const createAssignRes = await createAssignment(createAssignReq);
    assignData = await createAssignRes.json();
    console.log("Assignment created status:", createAssignRes.status, "ID:", assignData.id);

    // Verify student receives ASSIGNMENT_CREATED notification
    const assignCreatedNotifs = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.ASSIGNMENT_CREATED,
        deletedAt: null,
      },
    });
    console.log("Assignment Created Notifications Count (Expected 1):", assignCreatedNotifs.length);
    if (assignCreatedNotifs.length !== 1) {
      console.error("❌ Test 1 Failed: Notification was not created!");
    } else {
      console.log("✅ Test 1 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 2: Assignment Update - Duplicate Prevention Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 2: Assignment Edit - Duplicate Prevention Flow ---");
    const updateAssignReq = new NextRequest(`http://localhost:3000/api/assignments/${assignData.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Assignment Updated Title",
      }),
    });

    const updateAssignRes = await updateAssignment(updateAssignReq, { params: Promise.resolve({ id: assignData.id }) });
    console.log("Assignment updated status:", updateAssignRes.status);

    const assignNotifsPostUpdate = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.ASSIGNMENT_CREATED,
        deletedAt: null,
      },
    });
    console.log("Assignment Created Notifications Count after update (Expected 1):", assignNotifsPostUpdate.length);
    if (assignNotifsPostUpdate.length !== 1) {
      console.error("❌ Test 2 Failed: Duplicate assignment created notification generated!");
    } else {
      console.log("✅ Test 2 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 3: Assignment Due Date Reminder Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 3: Assignment Due Date Reminder Flow ---");
    // Initially student has not submitted. Reminding should create a HIGH priority due notification
    const remindAssignReq1 = new NextRequest(`http://localhost:3000/api/assignments/${assignData.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });

    const remindAssignRes1 = await remindAssignment(remindAssignReq1, { params: Promise.resolve({ id: assignData.id }) });
    const remind1Data = await remindAssignRes1.json();
    console.log("First reminder status:", remindAssignRes1.status, "Notified Count:", remind1Data.count);

    const dueNotifs1 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.ASSIGNMENT_DUE,
        priority: NotificationPriority.HIGH,
        deletedAt: null,
      },
    });
    console.log("Assignment Due Notifications Count (Expected 1):", dueNotifs1.length);

    // Now submit on behalf of student
    await prisma.submission.create({
      data: {
        assignmentId: assignData.id,
        studentId: studentUser.id,
        fileUrl: "https://submission.com/doc.pdf",
        fileName: "doc.pdf",
      },
    });

    // Remind again. Should notify 0 because student has submitted.
    const remindAssignReq2 = new NextRequest(`http://localhost:3000/api/assignments/${assignData.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const remindAssignRes2 = await remindAssignment(remindAssignReq2, { params: Promise.resolve({ id: assignData.id }) });
    const remind2Data = await remindAssignRes2.json();
    console.log("Second reminder status:", remindAssignRes2.status, "Notified Count:", remind2Data.count);

    const dueNotifs2 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.ASSIGNMENT_DUE,
        priority: NotificationPriority.HIGH,
        deletedAt: null,
      },
    });
    console.log("Assignment Due Notifications Count after submission (Expected 1):", dueNotifs2.length);

    if (dueNotifs1.length !== 1 || remind2Data.count !== 0 || dueNotifs2.length !== 1) {
      console.error("❌ Test 3 Failed: Assignment due reminder logic mismatch!");
    } else {
      console.log("✅ Test 3 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 4: Quiz Published Notification Flow (Draft vs Published)
    // -------------------------------------------------------------
    console.log("\n--- Test 4: Quiz Published Notification Flow ---");
    // Create draft quiz (isPublished = false)
    const createQuizReq1 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Quiz Draft",
        description: "Draft quiz.",
        courseId: course.id,
        timeLimit: 30,
        passingMarks: 5,
        totalMarks: 10,
        isPublished: false,
        questions: mockQuestions,
      }),
    });

    const createQuizRes1 = await createQuiz(createQuizReq1);
    quiz1Data = await createQuizRes1.json();
    console.log("Draft quiz status:", createQuizRes1.status, "ID:", quiz1Data.id);

    const quizNotifs1 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_PUBLISHED,
        deletedAt: null,
      },
    });
    console.log("Quiz Published Notifications Count for Draft Quiz (Expected 0):", quizNotifs1.length);

    // Create published quiz (isPublished = true)
    const createQuizReq2 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Quiz Published",
        description: "Published quiz.",
        courseId: course.id,
        timeLimit: 30,
        passingMarks: 5,
        totalMarks: 10,
        isPublished: true,
        questions: mockQuestions,
      }),
    });

    const createQuizRes2 = await createQuiz(createQuizReq2);
    quiz2Data = await createQuizRes2.json();
    console.log("Published quiz status:", createQuizRes2.status, "ID:", quiz2Data.id);

    const quizNotifs2 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_PUBLISHED,
        deletedAt: null,
      },
    });
    console.log("Quiz Published Notifications Count after Published Quiz (Expected 1):", quizNotifs2.length);

    if (quizNotifs1.length !== 0 || quizNotifs2.length !== 1) {
      console.error("❌ Test 4 Failed: Quiz creation publication mismatch!");
    } else {
      console.log("✅ Test 4 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 5: Quiz Update status shift & edit duplicate checks
    // -------------------------------------------------------------
    console.log("\n--- Test 5: Quiz Update status shift & edit duplicate checks ---");
    // Update draft quiz (isPublished = false -> true). Should trigger notification
    const updateQuizReq1 = new NextRequest(`http://localhost:3000/api/quizzes/${quiz1Data.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        isPublished: true,
      }),
    });

    const updateQuizRes1 = await updateQuiz(updateQuizReq1, { params: Promise.resolve({ id: quiz1Data.id }) });
    console.log("Update draft -> published status:", updateQuizRes1.status);

    const quizNotifsPostPublish = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_PUBLISHED,
        deletedAt: null,
      },
    });
    console.log("Quiz Published Notifications Count after state transition (Expected 2):", quizNotifsPostPublish.length);

    // Update published quiz title (should NOT trigger notification)
    const updateQuizReq2 = new NextRequest(`http://localhost:3000/api/quizzes/${quiz1Data.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "Test Quiz Draft Updated Title",
      }),
    });

    const updateQuizRes2 = await updateQuiz(updateQuizReq2, { params: Promise.resolve({ id: quiz1Data.id }) });
    console.log("Update title status:", updateQuizRes2.status);

    const quizNotifsPostEdit = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_PUBLISHED,
        deletedAt: null,
      },
    });
    console.log("Quiz Published Notifications Count after simple title edit (Expected 2):", quizNotifsPostEdit.length);

    if (quizNotifsPostPublish.length !== 2 || quizNotifsPostEdit.length !== 2) {
      console.error("❌ Test 5 Failed: Quiz update publication/duplicate prevention failed!");
    } else {
      console.log("✅ Test 5 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 6: Quiz Due Date Reminder Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 6: Quiz Due Date Reminder Flow ---");
    // Initially student has not submitted. Reminding should create a HIGH priority due notification
    const remindQuizReq1 = new NextRequest(`http://localhost:3000/api/quizzes/${quiz2Data.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });

    const remindQuizRes1 = await remindQuiz(remindQuizReq1, { params: Promise.resolve({ id: quiz2Data.id }) });
    const remindQuiz1Data = await remindQuizRes1.json();
    console.log("Quiz reminder status:", remindQuizRes1.status, "Notified Count:", remindQuiz1Data.count);

    const quizDueNotifs1 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_DUE,
        priority: NotificationPriority.HIGH,
        deletedAt: null,
      },
    });
    console.log("Quiz Due Notifications Count (Expected 1):", quizDueNotifs1.length);

    // Create a finished attempt for student
    await prisma.quizAttempt.create({
      data: {
        quizId: quiz2Data.id,
        studentId: studentUser.id,
        score: 8,
        percentage: 80,
        passed: true,
        status: "SUBMITTED",
        startedAt: new Date(),
        submittedAt: new Date(),
      },
    });

    // Remind again. Should notify 0 because student has submitted.
    const remindQuizReq2 = new NextRequest(`http://localhost:3000/api/quizzes/${quiz2Data.id}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${facultyToken}`,
      },
    });
    const remindQuizRes2 = await remindQuiz(remindQuizReq2, { params: Promise.resolve({ id: quiz2Data.id }) });
    const remindQuiz2Data = await remindQuizRes2.json();
    console.log("Second quiz reminder status:", remindQuizRes2.status, "Notified Count:", remindQuiz2Data.count);

    const quizDueNotifs2 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.QUIZ_DUE,
        priority: NotificationPriority.HIGH,
        deletedAt: null,
      },
    });
    console.log("Quiz Due Notifications Count after completion (Expected 1):", quizDueNotifs2.length);

    if (quizDueNotifs1.length !== 1 || remindQuiz2Data.count !== 0 || quizDueNotifs2.length !== 1) {
      console.error("❌ Test 6 Failed: Quiz due reminder logic mismatch!");
    } else {
      console.log("✅ Test 6 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 7: Single Enrollment Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 7: Single Enrollment Notification Flow ---");
    // Create new course & batch
    course2 = await prisma.course.create({
      data: {
        title: "Integration Testing 102",
        courseCode: "IT102",
        instituteId: institute.id,
        facultyId: faculty.id,
      },
    });
    batch2 = await prisma.batch.create({
      data: {
        name: "IT102-Default-Batch",
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        courseId: course2.id,
      },
    });

    // Enroll studentUser in batch2
    const enrollReq = new NextRequest("http://localhost:3000/api/enrollments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: studentUser.id,
        batchId: batch2.id,
      }),
    });

    const enrollRes = await createEnrollment(enrollReq);
    console.log("Enrollment status:", enrollRes.status);

    const enrollNotifs = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.COURSE_ENROLLED,
        deletedAt: null,
      },
    });
    // Expected count is 1 because the first course enrollment was created directly in setup via prisma query (which has no triggers)
    console.log("Course Enrolled Notifications Count (Expected 1):", enrollNotifs.length);
    if (enrollNotifs.length !== 1) {
      console.error("❌ Test 7 Failed: Enrollment notification not sent!");
    } else {
      console.log("✅ Test 7 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 8: Student Creation (POST /api/students) Enrollment Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 8: Student Creation Enrollment Notification Flow ---");
    const createStudReq = new NextRequest("http://localhost:3000/api/students", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bulk Enrolled Student",
        email: "bulkstudent.integration@test.com",
        courseIds: [course.id, course2.id],
      }),
    });

    const createStudRes = await createStudent(createStudReq);
    bulkStudent = await createStudRes.json();
    console.log("Bulk student created status:", createStudRes.status, "ID:", bulkStudent.id);

    const bulkStudentNotifs = await prisma.notification.findMany({
      where: {
        userId: bulkStudent.id,
        type: NotificationType.COURSE_ENROLLED,
        deletedAt: null,
      },
    });
    console.log("Enrollment Notifications for Bulk Student (Expected 2):", bulkStudentNotifs.length);
    if (bulkStudentNotifs.length !== 2) {
      console.error("❌ Test 8 Failed: Bulk student enrollment notifications count mismatch!");
    } else {
      console.log("✅ Test 8 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 9: Student Update (PUT /api/students/[id]) Enrollment Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 9: Student Update Enrollment Notification Flow ---");
    course3 = await prisma.course.create({
      data: {
        title: "Integration Testing 103",
        courseCode: "IT103",
        instituteId: institute.id,
        facultyId: faculty.id,
      },
    });

    const updateStudReq = new NextRequest(`http://localhost:3000/api/students/${bulkStudent.id}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Bulk Enrolled Student Updated Name",
        email: "bulkstudent.integration@test.com",
        courseIds: [course.id, course2.id, course3.id], // newly enrolled in course3
      }),
    });

    const updateStudRes = await updateStudent(updateStudReq, { params: Promise.resolve({ id: bulkStudent.id }) });
    console.log("Student updated status:", updateStudRes.status);

    const bulkStudentNotifs2 = await prisma.notification.findMany({
      where: {
        userId: bulkStudent.id,
        type: NotificationType.COURSE_ENROLLED,
        deletedAt: null,
      },
    });
    console.log("Enrollment Notifications for Bulk Student after update (Expected 3):", bulkStudentNotifs2.length);
    if (bulkStudentNotifs2.length !== 3) {
      console.error("❌ Test 9 Failed: Student update course enrollment notifications mismatch!");
    } else {
      console.log("✅ Test 9 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 10: Video Progress and Course Completed Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 10: Video Progress & Course Completed Notification Flow ---");
    // complete video 1
    const progressReq1 = new NextRequest("http://localhost:3000/api/progress", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: video1.id,
        completed: true,
      }),
    });

    const progressRes1 = await updateProgress(progressReq1);
    console.log("Video 1 progress status:", progressRes1.status);

    const compNotifs1 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.COURSE_COMPLETED,
        deletedAt: null,
      },
    });
    console.log("Course Completed Notifications Count (Expected 0):", compNotifs1.length);

    // complete video 2
    const progressReq2 = new NextRequest("http://localhost:3000/api/progress", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: video2.id,
        completed: true,
      }),
    });

    const progressRes2 = await updateProgress(progressReq2);
    console.log("Video 2 progress status:", progressRes2.status);

    const compNotifs2 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.COURSE_COMPLETED,
        deletedAt: null,
      },
    });
    console.log("Course Completed Notifications Count after all videos complete (Expected 1):", compNotifs2.length);

    // Trigger progress update again to check duplicate prevention
    const progressReq3 = new NextRequest("http://localhost:3000/api/progress", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${studentToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        videoId: video2.id,
        completed: true,
      }),
    });

    const progressRes3 = await updateProgress(progressReq3);
    console.log("Re-update Video 2 status:", progressRes3.status);

    const compNotifs3 = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.COURSE_COMPLETED,
        deletedAt: null,
      },
    });
    console.log("Course Completed Notifications Count after re-update (Expected 1):", compNotifs3.length);

    if (compNotifs1.length !== 0 || compNotifs2.length !== 1 || compNotifs3.length !== 1) {
      console.error("❌ Test 10 Failed: Course completed notification flow mismatch!");
    } else {
      console.log("✅ Test 10 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 11: Certificate Issued Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 11: Certificate Issued Notification Flow ---");
    const certReq = new NextRequest("http://localhost:3000/api/certificates/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: studentUser.id,
        courseId: course.id,
        templateId: template.id,
        completionDate: new Date().toISOString(),
      }),
    });

    const certRes = await generateCertificate(certReq);
    certData = await certRes.json();
    console.log("Certificate generate status:", certRes.status, "ID:", certData.id);

    const certNotifs = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.CERTIFICATE_ISSUED,
        priority: NotificationPriority.LOW,
        deletedAt: null,
      },
    });
    console.log("Certificate Issued Notifications Count (Expected 1):", certNotifs.length);
    if (certNotifs.length !== 1) {
      console.error("❌ Test 11 Failed: Certificate Issued notification failed!");
    } else {
      console.log("✅ Test 11 Passed.");
    }

    // -------------------------------------------------------------
    // TEST 12: Certificate Revoked Notification Flow
    // -------------------------------------------------------------
    console.log("\n--- Test 12: Certificate Revoked Notification Flow ---");
    const revokeReq = new NextRequest(`http://localhost:3000/api/certificates/${certData.id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    });

    const revokeRes = await revokeCertificate(revokeReq, { params: Promise.resolve({ id: certData.id }) });
    console.log("Certificate revoke status:", revokeRes.status);

    const revokeNotifs = await prisma.notification.findMany({
      where: {
        userId: studentUser.id,
        type: NotificationType.CERTIFICATE_REVOKED,
        priority: NotificationPriority.URGENT,
        deletedAt: null,
      },
    });
    console.log("Certificate Revoked Notifications Count (Expected 1):", revokeNotifs.length);
    if (revokeNotifs.length !== 1) {
      console.error("❌ Test 12 Failed: Certificate Revoked notification failed!");
    } else {
      console.log("✅ Test 12 Passed.");
    }

  } catch (err: any) {
    console.error("CRITICAL ERROR DURING FLOW TESTS:", err.stack || err.message);
  } finally {
    // Cleanup DB
    console.log("\n=== CLEANING UP DATABASE RECORDS ===");
    try {
      if (studentUser || bulkStudent) {
        const studentIds = [studentUser?.id, bulkStudent?.id].filter(Boolean);
        await prisma.progress.deleteMany({
          where: { userId: { in: studentIds } },
        });
        await prisma.notification.deleteMany({
          where: { userId: { in: studentIds } },
        });
        await prisma.certificate.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await prisma.submission.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await prisma.quizAttempt.deleteMany({
          where: { studentId: { in: studentIds } },
        });
        await prisma.enrollment.deleteMany({
          where: { studentId: { in: studentIds } },
        });
      }
      if (template) {
        await prisma.certificateTemplate.delete({
          where: { id: template.id },
        });
      }
      if (course) {
        await prisma.quiz.deleteMany({
          where: { courseId: course.id },
        });
        await prisma.assignment.deleteMany({
          where: { courseId: course.id },
        });
        await prisma.video.deleteMany({
          where: { courseId: course.id },
        });
      }
      if (dummyCourse) {
        await prisma.course.delete({
          where: { id: dummyCourse.id },
        });
      }
      if (course2) {
        await prisma.batch.deleteMany({
          where: { courseId: course2.id },
        });
        await prisma.course.delete({
          where: { id: course2.id },
        });
      }
      if (course3) {
        await prisma.batch.deleteMany({
          where: { courseId: course3.id },
        });
        await prisma.course.delete({
          where: { id: course3.id },
        });
      }
      if (defaultBatch) {
        await prisma.batch.delete({
          where: { id: defaultBatch.id },
        });
      }
      if (course) {
        await prisma.course.delete({
          where: { id: course.id },
        });
      }
      if (studentUser || faculty || admin || bulkStudent) {
        const userIds = [studentUser?.id, faculty?.id, admin?.id, bulkStudent?.id].filter(Boolean);
        await prisma.user.deleteMany({
          where: { id: { in: userIds } },
        });
      }
      if (institute) {
        await prisma.institute.delete({
          where: { id: institute.id },
        });
      }
      console.log("Cleanup completed successfully.");
    } catch (cleanupError: any) {
      console.error("Error during cleanup:", cleanupError.message);
    } finally {
      await prisma.$disconnect();
    }
  }
}

main().catch(console.error);
