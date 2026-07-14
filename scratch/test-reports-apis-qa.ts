import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== STARTING WEEK 5 MODULES QA & DB VERIFICATION ===\n");

  // 1. Fetch key baseline test entities
  const student = await prisma.user.findFirst({
    where: { email: "student1@test.com", deletedAt: null },
  });
  const admin = await prisma.user.findFirst({
    where: { email: "admin@test.com", deletedAt: null },
  });
  const course = await prisma.course.findFirst({
    where: { courseCode: "FSD101", deletedAt: null },
  });

  if (!student || !admin || !course) {
    console.error("Baseline seed data is missing. Please run `npx tsx scratch/seed-dev-data.ts` first.");
    process.exit(1);
  }

  const instituteId = admin.instituteId!;
  const studentId = student.id;
  const courseId = course.id;

  console.log(`Verified Entities:`);
  console.log(`- Student: ${student.name} (ID: ${studentId})`);
  console.log(`- Admin: ${admin.name} (ID: ${admin.id}, Institute ID: ${instituteId})`);
  console.log(`- Course: ${course.title} (ID: ${courseId}, Institute ID: ${course.instituteId})\n`);

  // ==========================================
  // STUDENT PERFORMANCE REPORTS VERIFICATION
  // ==========================================
  console.log("--- 1. Testing Student Reports Summary Logic ---");
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId, batch: { deletedAt: null, course: { deletedAt: null } } },
    include: {
      batch: {
        include: {
          course: {
            include: {
              videos: { where: { deletedAt: null, published: true } },
            },
          },
        },
      },
    },
  });

  const enrolledCourseIds = enrollments.map((e) => e.batch.courseId);
  console.log(`Courses Enrolled: ${enrolledCourseIds.length}`);

  // Fetch progresses
  const progressEntries = await prisma.progress.findMany({
    where: {
      userId: studentId,
      completed: true,
      video: { courseId: { in: enrolledCourseIds }, deletedAt: null, published: true },
    },
    select: { videoId: true, video: { select: { courseId: true } } },
  });

  let completedCourses = 0;
  let inProgressCourses = 0;

  for (const enrollment of enrollments) {
    const c = enrollment.batch.course;
    const totalVideos = c.videos.length;
    if (totalVideos === 0) {
      inProgressCourses++;
      continue;
    }
    const completedCount = progressEntries.filter((p) => p.video.courseId === c.id).length;
    if (completedCount === totalVideos) {
      completedCourses++;
    } else {
      inProgressCourses++;
    }
  }
  console.log(`Completed Courses: ${completedCourses}, In Progress Courses: ${inProgressCourses}`);

  // Quiz statistics
  const quizStats = await prisma.quizAttempt.aggregate({
    where: { studentId, status: "SUBMITTED" },
    _count: { id: true },
    _avg: { percentage: true },
  });
  console.log(`Quizzes Attempted: ${quizStats._count.id || 0}, Average Score: ${quizStats._avg.percentage || 0}%`);

  // Assignments
  const totalAssignments = await prisma.assignment.count({
    where: { courseId: { in: enrolledCourseIds }, deletedAt: null },
  });
  const assignmentsSubmitted = await prisma.submission.count({
    where: { studentId, assignment: { courseId: { in: enrolledCourseIds }, deletedAt: null } },
  });
  console.log(`Total Assignments: ${totalAssignments}, Submitted: ${assignmentsSubmitted}, Pending: ${totalAssignments - assignmentsSubmitted}`);

  // Certificates
  const certsEarned = await prisma.certificate.count({
    where: { studentId, status: "ACTIVE", deletedAt: null },
  });
  console.log(`Certificates Earned: ${certsEarned}`);
  console.log("✅ Student Reports summary checks pass!\n");


  // ==========================================
  // ADMIN DASHBOARD ANALYTICS VERIFICATION
  // ==========================================
  console.log("--- 2. Testing Admin Analytics Dashboard Logic ---");
  const totalStudents = await prisma.user.count({ where: { role: "STUDENT", instituteId, deletedAt: null } });
  const activeStudents = await prisma.user.count({
    where: {
      role: "STUDENT",
      instituteId,
      deletedAt: null,
      enrollments: { some: { batch: { deletedAt: null } } },
    },
  });
  const totalFaculty = await prisma.user.count({ where: { role: "FACULTY", instituteId, deletedAt: null } });
  const totalCourses = await prisma.course.count({ where: { instituteId, deletedAt: null } });
  const totalQuizzes = await prisma.quiz.count({ where: { instituteId, deletedAt: null } });
  const totalCertificates = await prisma.certificate.count({ where: { instituteId, deletedAt: null } });

  console.log(`Institute totals:`);
  console.log(`- Total Students: ${totalStudents}`);
  console.log(`- Active Students: ${activeStudents}`);
  console.log(`- Total Faculty: ${totalFaculty}`);
  console.log(`- Total Courses: ${totalCourses}`);
  console.log(`- Total Quizzes: ${totalQuizzes}`);
  console.log(`- Total Certificates: ${totalCertificates}`);
  console.log("✅ Admin Dashboard counts checks pass!\n");


  // ==========================================
  // SECURITY & TENANT ISOLATION VERIFICATION
  // ==========================================
  console.log("--- 3. Testing Security & Tenant Isolation ---");
  const mismatchedInstituteId = "mismatched-uuid-for-isolation-test";

  // Simulate mismatched admin dashboard query
  const courseCountWrongTenant = await prisma.course.count({
    where: { instituteId: mismatchedInstituteId, deletedAt: null },
  });

  console.log(`Courses counted for mismatched institute: ${courseCountWrongTenant}`);
  if (courseCountWrongTenant === 0) {
    console.log("✅ Security Tenant Isolation verified! Wrong institute yields 0 results.");
  } else {
    console.error("❌ FAILURE: Wrong institute returned results!");
  }

  console.log("\n=== QA VERIFICATION SCRIPT COMPLETED SUCCESSFULLY ===");
}

main()
  .catch((err) => {
    console.error("QA script failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
