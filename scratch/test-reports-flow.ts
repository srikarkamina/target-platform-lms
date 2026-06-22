import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== Testing Reports Quiz Query Logic ===");

  // Find a student who has submitted attempts
  const attempts = await prisma.quizAttempt.findMany({
    include: {
      quiz: {
        include: {
          course: true
        }
      },
      student: true
    }
  });

  console.log(`Total quiz attempts in database: ${attempts.length}`);

  const statusGroups = attempts.reduce((acc: Record<string, number>, curr) => {
    acc[curr.status] = (acc[curr.status] || 0) + 1;
    return acc;
  }, {});

  console.log("\nQuiz Attempts Grouped by Status:", JSON.stringify(statusGroups, null, 2));

  // Let's run a test query matching our student reports logic
  // Fetch a student with attempts
  const studentWithAttempt = attempts.find(a => a.status === "SUBMITTED")?.student;
  
  if (!studentWithAttempt) {
    console.log("\nNo 'SUBMITTED' attempts found in database. Let's list some attempts:");
    attempts.slice(0, 5).forEach((a) => {
      console.log(`Attempt ID: ${a.id}, Status: ${a.status}, Passed: ${a.passed}, Student: ${a.student.name}`);
    });
    return;
  }

  console.log(`\nFound Student for report test: ${studentWithAttempt.name} (ID: ${studentWithAttempt.id})`);

  // Run the student query we fixed
  const studentAttempts = await prisma.quizAttempt.findMany({
    where: { studentId: studentWithAttempt.id, status: "SUBMITTED" },
    include: {
      quiz: {
        include: {
          course: { select: { courseCode: true, title: true } },
        },
      },
    },
  });

  console.log(`Completed/Submitted Quiz Count for student: ${studentAttempts.length}`);
  studentAttempts.forEach((a) => {
    console.log(`- Quiz: ${a.quiz.title}, Course: ${a.quiz.course.courseCode}, Score: ${a.score}, Percentage: ${a.percentage}%, Passed: ${a.passed}`);
  });

  if (studentAttempts.length > 0) {
    console.log("\n=== SUCCESS: Quiz Attempts are correctly found using the 'SUBMITTED' status filter! ===");
  } else {
    console.error("\n=== FAILURE: Failed to load student's quiz attempts. ===");
  }
}

main()
  .catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
