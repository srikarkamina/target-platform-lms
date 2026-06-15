import { prisma } from "../lib/prisma";

async function main() {
  const studentId = "6ea9e737-6c29-4fd9-beba-148e984a8fff"; // rahul2@student.com
  const courseId = "e133d368-9ed7-43ea-a1b9-40af73ce2cd9"; // Python Programming

  // Check if batch already exists for this course
  let batch = await prisma.batch.findFirst({
    where: { courseId }
  });

  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        name: "Python Batch A",
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        courseId: courseId
      }
    });
    console.log("Created batch:", batch);
  } else {
    console.log("Batch already exists:", batch);
  }

  // Enroll the student in this batch
  const enrollment = await prisma.enrollment.upsert({
    where: {
      studentId_batchId: {
        studentId,
        batchId: batch.id
      }
    },
    update: {},
    create: {
      studentId,
      batchId: batch.id
    }
  });

  console.log("Created/Verified Enrollment:", enrollment);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
