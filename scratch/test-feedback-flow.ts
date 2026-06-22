import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=== Testing Prisma Submission Feedback Flow ===");

  // Find a submission
  let submission = await prisma.submission.findFirst({
    include: {
      assignment: true,
      student: true
    }
  });

  if (!submission) {
    console.log("No submission found. Let's find an assignment and a student to create one...");
    const assignment = await prisma.assignment.findFirst();
    const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });

    if (!assignment || !student) {
      console.error("Cannot proceed: require at least one assignment and one student in database.");
      return;
    }

    console.log(`Creating test submission for Student: ${student.name}, Assignment: ${assignment.title}`);
    submission = await prisma.submission.create({
      data: {
        assignmentId: assignment.id,
        studentId: student.id,
        fileUrl: "https://example.com/test-file.pdf",
        fileName: "test-file.pdf",
      },
      include: {
        assignment: true,
        student: true
      }
    });
  }

  console.log(`Original Submission - ID: ${submission.id}`);
  console.log(`Current Grade: ${submission.grade}`);
  console.log(`Current Feedback: ${submission.feedback}`);

  const testGrade = Math.floor(Math.random() * 20) + 80; // 80 - 99
  const testFeedback = `Outstanding work! Evaluated at timestamp ${new Date().toISOString()}`;

  console.log(`\nUpdating submission with Grade: ${testGrade}, Feedback: "${testFeedback}"...`);

  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: {
      grade: testGrade,
      feedback: testFeedback
    }
  });

  console.log("Update completed successfully!");

  console.log("\nFetching the updated record from DB...");
  const retrieved = await prisma.submission.findUnique({
    where: { id: submission.id }
  });

  if (!retrieved) {
    console.error("Error: Could not retrieve submission after update!");
    return;
  }

  console.log(`Retrieved Grade: ${retrieved.grade} (Expected: ${testGrade})`);
  console.log(`Retrieved Feedback: "${retrieved.feedback}" (Expected: "${testFeedback}")`);

  if (retrieved.grade === testGrade && retrieved.feedback === testFeedback) {
    console.log("\n=== SUCCESS: Feedback and Grade are fully persisted and retrieved! ===");
  } else {
    console.error("\n=== FAILURE: Data mismatch after update! ===");
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
