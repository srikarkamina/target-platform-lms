import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== DB ANALYSIS ===");

  // 1. User counts by role
  const roles = ["SUPER_ADMIN", "ADMIN", "FACULTY", "STUDENT"];
  const userCounts = await Promise.all(
    roles.map(async (role) => {
      const count = await prisma.user.count({ where: { role: role as any } });
      return { role, count };
    })
  );
  console.log("User counts by role:", userCounts);

  // 2. Institute count & records
  const institutes = await prisma.institute.findMany();
  console.log(`Institutes (${institutes.length}):`, institutes);

  // 3. Course count & records
  const courses = await prisma.course.findMany({
    include: {
      faculty: { select: { id: true, name: true, email: true } },
    },
  });
  console.log(`Courses (${courses.length}):`, courses);

  // 4. Enrollments count
  const enrollmentCount = await prisma.enrollment.count();
  console.log("Total Enrollments count:", enrollmentCount);

  // 5. Batches count
  const batches = await prisma.batch.findMany();
  console.log(`Batches (${batches.length}):`, batches);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
