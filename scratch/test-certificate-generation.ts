import { prisma } from "../lib/prisma";
import { generateCertificate, getTemplate, checkDuplicateCertificate } from "../lib/services/certificate-service";
import { generateCertificateNumber, generateCertificateCode, generateVerificationToken } from "../lib/certificate";

async function main() {
  console.log("=== STARTING CERTIFICATE GENERATION & ELIGIBILITY TESTS ===");

  // 1. Fetch baseline test entities
  let institute = await prisma.institute.findFirst({ where: { deletedAt: null } });
  if (!institute) {
    institute = await prisma.institute.create({ data: { name: "Audit Institute" } });
  }
  const instituteId = institute.id;
  console.log(`Using Institute ID: ${instituteId}`);

  // Create a second institute for tenant isolation tests
  const secondInstitute = await prisma.institute.create({ data: { name: "Isolation Institute" } });
  const secondInstituteId = secondInstitute.id;

  // Create a mock student inside the first institute
  const student = await prisma.user.create({
    data: {
      name: "Grad Student",
      email: `grad-${Date.now()}@test.com`,
      password: "somehashedpassword",
      role: "STUDENT",
      instituteId,
    },
  });
  const studentId = student.id;
  console.log(`Created Student: ${student.name} (ID: ${studentId})`);

  // Create a mock course inside the first institute
  const course = await prisma.course.create({
    data: {
      title: "Microservices Architecture",
      courseCode: `CS-M-${Date.now()}`,
      instituteId,
    },
  });
  const courseId = course.id;
  console.log(`Created Course: ${course.title} (ID: ${courseId})`);

  // Create a mock video lesson inside the course (published: true)
  const video = await prisma.video.create({
    data: {
      title: "Introduction to Event-Driven Design",
      videoUrl: "https://example.com/video1.mp4",
      courseId,
      published: true,
    },
  });
  console.log(`Created Video Lesson: ${video.title} (ID: ${video.id})`);

  // Create a template inside the first institute
  const template = await prisma.certificateTemplate.create({
    data: {
      name: "Engineering Diploma",
      title: "Master of Engineering",
      description: "For complete demonstration of skills.",
      isActive: true,
      instituteId,
    },
  });
  const templateId = template.id;
  console.log(`Created Certificate Template: ${template.name} (ID: ${templateId})`);

  try {
    // ----------------------------------------------------
    // TEST 1: Course Completion Eligibility Check (Expect Failure)
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Generate Certificate (Expect Failure due to incomplete videos) ---");
    try {
      await generateCertificate({
        studentId,
        courseId,
        templateId,
        instituteId,
      });
      throw new Error("Failure: Certificate was generated even though the student has not completed all videos!");
    } catch (err: any) {
      console.log(`Expected eligibility error caught: "${err.message}"`);
      if (!err.message.includes("has not completed all lessons")) {
        throw new Error(`Unexpected error type: ${err.message}`);
      }
      console.log("✅ Eligibility Check Test Passed!");
    }

    // ----------------------------------------------------
    // TEST 2: Course Completion Eligibility Check (Expect Success after watching)
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Generate Certificate (Expect Success after complete progress) ---");
    // Create completed watch progress record for student
    await prisma.progress.create({
      data: {
        userId: studentId,
        videoId: video.id,
        completed: true,
      },
    });
    console.log("Marked progress as completed for the student...");

    const certificate = await generateCertificate({
      studentId,
      courseId,
      templateId,
      instituteId,
    });
    console.log(`Successfully generated Certificate: ${certificate.certificateNumber}`);
    if (!certificate.certificateNumber || certificate.status !== "ACTIVE") {
      throw new Error("Invalid certificate state after generation");
    }
    console.log("✅ Successful Certificate Generation Test Passed!");

    // ----------------------------------------------------
    // TEST 3: Duplicate Certificate Prevention (Expect Failure)
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Duplicate Prevention (Expect Failure) ---");
    try {
      await generateCertificate({
        studentId,
        courseId,
        templateId,
        instituteId,
      });
      throw new Error("Failure: Duplicate certificate was incorrectly generated!");
    } catch (err: any) {
      console.log(`Expected duplicate error caught: "${err.message}"`);
      if (!err.message.includes("Certificate already exists")) {
        throw new Error(`Unexpected duplicate error type: ${err.message}`);
      }
      console.log("✅ Duplicate Prevention Test Passed!");
    }

    // ----------------------------------------------------
    // TEST 4: Tenant Isolation Check (Expect Failure)
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Tenant Isolation (Expect Failure on mismatched tenant) ---");
    try {
      // Attempting to generate certificate using secondary instituteId
      await generateCertificate({
        studentId,
        courseId,
        templateId,
        instituteId: secondInstituteId,
      });
      throw new Error("Failure: Tenant isolation bypassed! Mismatched institute generated a certificate.");
    } catch (err: any) {
      console.log(`Expected tenant mismatch error caught: "${err.message}"`);
      if (!err.message.includes("does not belong to this institute") && !err.message.includes("does not belong")) {
        throw new Error(`Unexpected tenant mismatch error type: ${err.message}`);
      }
      console.log("✅ Tenant Isolation Test Passed!");
    }

    // ----------------------------------------------------
    // TEST 5: Certificate Retrieval & Duplicate check helper
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Duplicate Helper and Find Checks ---");
    const foundCert = await checkDuplicateCertificate(studentId, courseId);
    if (!foundCert || foundCert.id !== certificate.id) {
      throw new Error("checkDuplicateCertificate failed to fetch matching certificate record");
    }
    console.log("✅ Duplicate Helper Checks Passed!");

    // Clean up created entities
    console.log("\n--- Cleaning up test records ---");
    await prisma.progress.delete({
      where: { userId_videoId: { userId: studentId, videoId: video.id } },
    });
    await prisma.certificate.delete({ where: { id: certificate.id } });
    await prisma.video.delete({ where: { id: video.id } });
    await prisma.course.delete({ where: { id: courseId } });
    await prisma.certificateTemplate.delete({ where: { id: templateId } });
    await prisma.user.delete({ where: { id: studentId } });
    console.log("Test records cleaned up successfully.");

  } finally {
    // Clean up second institute
    await prisma.institute.delete({ where: { id: secondInstituteId } });
    console.log("Second institute cleaned up.");
  }

  console.log("\n=== ALL CERTIFICATE GENERATION & ELIGIBILITY TESTS PASSED! ===");
}

main()
  .catch((e) => {
    console.error("\n❌ TEST FAILURE:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
