import { prisma } from "../lib/prisma";

async function main() {
  const courses = await prisma.course.findMany();
  console.log("All courses:", courses);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
