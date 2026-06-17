import "dotenv/config";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Checking User table...");
  const users = await prisma.user.findMany({ take: 1 });
  console.log(`User table exists. Result size: ${users.length}`);

  console.log("Checking Course table...");
  const courses = await prisma.course.findMany({ take: 1 });
  console.log(`Course table exists. Result size: ${courses.length}`);

  console.log("Checking Progress table...");
  const progresses = await prisma.progress.findMany({ take: 1 });
  console.log(`Progress table exists. Result size: ${progresses.length}`);

  console.log("Checking Assignment table...");
  const assignments = await prisma.assignment.findMany({ take: 1 });
  console.log(`Assignment table exists. Result size: ${assignments.length}`);

  console.log("Checking Submission table...");
  const submissions = await prisma.submission.findMany({ take: 1 });
  console.log(`Submission table exists. Result size: ${submissions.length}`);

  console.log("=== ALL TABLES VERIFIED SUCCESSFULLY ===");
}

main()
  .catch((err) => {
    console.error("Verification failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
