import { prisma } from "../lib/prisma";

async function main() {
  const userId = "6ea9e737-6c29-4fd9-beba-148e984a8fff"; // rahul2@student.com
  const courseId = "e133d368-9ed7-43ea-a1b9-40af73ce2cd9"; // Python Programming

  const progressEntries = await prisma.progress.findMany({
    where: {
      userId: userId,
      video: { courseId: courseId }
    }
  });

  console.log("Prisma query result for progressEntries:", progressEntries);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
