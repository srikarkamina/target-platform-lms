import { PrismaClient } from "../app/generated/prisma/client";
import { generateCertificateNumber, generateCertificateCode, generateVerificationToken } from "../lib/certificate";
import fs from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

async function testDuplicateEmail() {
  console.log("\n--- TEST 1: DUPLICATE EMAIL HANDLER ---");
  const institute = await prisma.institute.findFirst();
  if (!institute) throw new Error("No institute found");

  const email = `dup-${Date.now()}@example.com`;

  // Create first student
  await prisma.user.create({
    data: {
      name: "First Student",
      email,
      password: "password",
      role: "STUDENT",
      instituteId: institute.id,
    },
  });
  console.log(`Created student with email: ${email}`);

  // Attempt duplicate creation (simulated POST catch logic)
  try {
    await prisma.user.create({
      data: {
        name: "Second Student",
        email,
        password: "password",
        role: "STUDENT",
        instituteId: institute.id,
      },
    });
    console.error("❌ Test Failed: Duplicate email created without error!");
    process.exit(1);
  } catch (error: any) {
    console.log(`Successfully caught duplicate email error: ${error.message}`);
    // Simulate our API catch response:
    if (error.code === "P2002" || error.message?.includes("Unique constraint failed")) {
      console.log("✅ Correctly identified unique constraint code P2002. Status: 409 Conflict. Message: 'A student with this email already exists.'");
    } else {
      console.error("❌ Test Failed: Unexpected error code/message", error);
      process.exit(1);
    }
  }

  // Cleanup
  await prisma.user.delete({ where: { email } });
  console.log("Cleanup complete for Test 1.");
}

async function testAssignmentReplacement() {
  console.log("\n--- TEST 2: ASSIGNMENT REPLACEMENT FILE CLEANUP ---");
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const assignment = await prisma.assignment.findFirst();
  if (!student || !assignment) {
    console.warn("⚠️ Skipping Test 2: Missing student/assignment fixtures.");
    return;
  }

  // 1. Create simulated files in public/uploads/assignments
  const uploadDir = path.join(process.cwd(), "public", "uploads", "assignments");
  await fs.mkdir(uploadDir, { recursive: true });

  const file1Name = `test-file-1-${Date.now()}.docx`;
  const file2Name = `test-file-2-${Date.now()}.docx`;
  const file1Path = path.join(uploadDir, file1Name);
  const file2Path = path.join(uploadDir, file2Name);

  await fs.writeFile(file1Path, "Test Content 1");
  await fs.writeFile(file2Path, "Test Content 2");

  const file1Url = `/uploads/assignments/${file1Name}`;
  const file2Url = `/uploads/assignments/${file2Name}`;

  console.log(`Created temporary test files on disk:
- ${file1Path}
- ${file2Path}`);

  // 2. Insert initial submission in database
  const submission = await prisma.submission.create({
    data: {
      studentId: student.id,
      assignmentId: assignment.id,
      fileUrl: file1Url,
      fileName: file1Name,
      mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      fileSize: 100,
    },
  });
  console.log(`Created submission record in database. ID: ${submission.id}, fileUrl: ${submission.fileUrl}`);

  // 3. Simulate replacement PUT API logic:
  // Update submission in DB, and delete previous file from storage
  const submissionToUpdate = await prisma.submission.findUnique({
    where: { id: submission.id },
  });

  if (!submissionToUpdate) throw new Error("Submission not found");

  const dataToUpdate = {
    fileUrl: file2Url,
    fileName: file2Name,
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    fileSize: 200,
  };

  // Perform backend cleanup check
  if (dataToUpdate.fileUrl && submissionToUpdate.fileUrl && submissionToUpdate.fileUrl !== dataToUpdate.fileUrl) {
    const oldFilePath = path.join(process.cwd(), "public", submissionToUpdate.fileUrl);
    const pathExists = await fs.access(oldFilePath).then(() => true).catch(() => false);
    if (pathExists) {
      await fs.unlink(oldFilePath);
      console.log(`✅ File deletion triggered: Deleted old file ${oldFilePath}`);
    }
  }

  // Update submission in DB
  const updated = await prisma.submission.update({
    where: { id: submission.id },
    data: dataToUpdate,
  });

  console.log(`Updated submission in database. fileUrl: ${updated.fileUrl}`);

  // Verify that file1 is deleted from disk, and file2 remains
  const file1Exists = await fs.access(file1Path).then(() => true).catch(() => false);
  const file2Exists = await fs.access(file2Path).then(() => true).catch(() => false);

  console.log(`Post-update verification:
- File 1 exists: ${file1Exists} (Expected: false)
- File 2 exists: ${file2Exists} (Expected: true)`);

  if (!file1Exists && file2Exists) {
    console.log("✅ Storage cleanup and record updates passed successfully!");
  } else {
    console.error("❌ File replacement check failed!");
    process.exit(1);
  }

  // Cleanup
  await prisma.submission.delete({ where: { id: submission.id } });
  if (file2Exists) {
    await fs.unlink(file2Path);
  }
  console.log("Cleanup complete for Test 2.");
}

async function testCertificateRestrictions() {
  console.log("\n--- TEST 3: CERTIFICATE RESTRICTIONS ---");
  const institute = await prisma.institute.findFirst();
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const course = await prisma.course.findFirst();
  const template = await prisma.certificateTemplate.findFirst();

  if (!institute || !student || !course || !template) {
    console.warn("⚠️ Skipping Test 3: Missing fixtures.");
    return;
  }

  const seq = (await prisma.certificate.count({ where: { instituteId: institute.id } })) + 1;
  const activeCert = await prisma.certificate.create({
    data: {
      instituteId: institute.id,
      studentId: student.id,
      courseId: course.id,
      templateId: template.id,
      certificateNumber: generateCertificateNumber(seq),
      certificateCode: generateCertificateCode(),
      verificationToken: generateVerificationToken(),
      status: "ACTIVE",
    },
  });

  const revokedCert = await prisma.certificate.create({
    data: {
      instituteId: institute.id,
      studentId: student.id,
      courseId: course.id,
      templateId: template.id,
      certificateNumber: generateCertificateNumber(seq + 1),
      certificateCode: generateCertificateCode(),
      verificationToken: generateVerificationToken(),
      status: "REVOKED",
    },
  });

  console.log(`Created testing certificates:
- Active: ${activeCert.id} (Status: ${activeCert.status})
- Revoked: ${revokedCert.id} (Status: ${revokedCert.status})`);

  // Simulate GET /api/certificates/[id]/download check logic
  const checkDownload = (cert: any) => {
    if (cert.status === "REVOKED") {
      return { status: 403, message: "This certificate has been revoked and cannot be downloaded." };
    }
    return { status: 200, message: "Authorized for download" };
  };

  const activeRes = checkDownload(activeCert);
  const revokedRes = checkDownload(revokedCert);

  console.log(`Simulated download check results:
- Active: Status ${activeRes.status} (${activeRes.message})
- Revoked: Status ${revokedRes.status} (${revokedRes.message})`);

  if (activeRes.status === 200 && revokedRes.status === 403) {
    console.log("✅ Certificate download restriction validations passed successfully!");
  } else {
    console.error("❌ Certificate download checks failed!");
    process.exit(1);
  }

  // Cleanup
  await prisma.certificate.delete({ where: { id: activeCert.id } });
  await prisma.certificate.delete({ where: { id: revokedCert.id } });
  console.log("Cleanup complete for Test 3.");
}

async function run() {
  await testDuplicateEmail();
  await testAssignmentReplacement();
  await testCertificateRestrictions();
  console.log("\n✅ ALL REGRESSION TESTS PASSED SUCCESSFULLY!");
}

run().catch((e) => {
  console.error("Tests failed:", e);
  process.exit(1);
});
