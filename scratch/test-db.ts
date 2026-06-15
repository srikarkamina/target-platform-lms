import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== COURSES ===");
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, instituteId: true }
  });
  console.log(courses);

  console.log("=== BATCHES ===");
  const batches = await prisma.batch.findMany({
    select: { id: true, name: true, courseId: true }
  });
  console.log(batches);

  console.log("=== ENROLLMENTS ===");
  const enrollments = await prisma.enrollment.findMany({
    select: { id: true, studentId: true, batchId: true }
  });
  console.log(enrollments);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
