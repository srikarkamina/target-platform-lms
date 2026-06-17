import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== COURSES ===");
  const courses = await prisma.course.findMany({
    select: { id: true, title: true, courseCode: true }
  });
  console.log(courses);

  console.log("=== ASSIGNMENTS ===");
  const assignments = await prisma.assignment.findMany({
    select: { id: true, title: true, courseId: true }
  });
  console.log(assignments);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
