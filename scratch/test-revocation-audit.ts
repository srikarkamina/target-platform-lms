import { prisma } from "../lib/prisma";
import { generateCertificate, getTemplate, checkDuplicateCertificate } from "../lib/services/certificate-service";

async function main() {
  console.log("=== STARTING CERTIFICATE REVOCATION AUDIT TESTS ===");

  // 1. Fetch baseline entities
  let institute = await prisma.institute.findFirst({ where: { deletedAt: null } });
  if (!institute) {
    institute = await prisma.institute.create({ data: { name: "Audit Inst" } });
  }
  const instituteId = institute.id;

  const student = await prisma.user.create({
    data: {
      name: "Revocation Student",
      email: `rev-student-${Date.now()}@test.com`,
      password: "hashedpassword123",
      role: "STUDENT",
      instituteId,
    },
  });
  const studentId = student.id;

  const course = await prisma.course.create({
    data: {
      title: "Audited Course Layout",
      courseCode: `AUD-${Date.now()}`,
      instituteId,
    },
  });
  const courseId = course.id;

  const template = await prisma.certificateTemplate.create({
    data: {
      name: "Audit Template",
      title: "Audit Title",
      isActive: true,
      instituteId,
    },
  });
  const templateId = template.id;

  try {
    // ----------------------------------------------------
    // TEST 1: Generate Certificate
    // ----------------------------------------------------
    console.log("Generating active certificate...");
    const certificate = await generateCertificate({
      studentId,
      courseId,
      templateId,
      instituteId,
    });
    console.log(`Issued Certificate ID: ${certificate.id}`);
    console.log(`Initial Status: ${certificate.status}`);
    if (certificate.status !== "ACTIVE") {
      throw new Error("Initial status should be ACTIVE");
    }

    // ----------------------------------------------------
    // TEST 2: Revocation State Change (Soft Delete)
    // ----------------------------------------------------
    console.log("\nRevoking certificate...");
    // Simulate DELETE endpoint logic
    const revoked = await prisma.certificate.update({
      where: { id: certificate.id },
      data: {
        status: "REVOKED",
        revokedAt: new Date(),
      },
    });

    console.log(`Updated Status: ${revoked.status}`);
    console.log(`deletedAt: ${revoked.deletedAt}`);
    console.log(`revokedAt: ${revoked.revokedAt}`);

    if (revoked.status !== "REVOKED") {
      throw new Error("Status was not set to REVOKED");
    }
    if (revoked.deletedAt !== null) {
      throw new Error("deletedAt should remain null so it is visible in the registry");
    }
    if (!revoked.revokedAt) {
      throw new Error("revokedAt was not populated");
    }
    console.log("✅ Soft Revocation State Checks Passed!");

    // ----------------------------------------------------
    // TEST 3: Registry Visibility & Searchability
    // ----------------------------------------------------
    console.log("\nQuerying registry...");
    // Simulate GET /api/certificates query parameters
    const certificatesList = await prisma.certificate.findMany({
      where: {
        instituteId,
        deletedAt: null,
      },
    });

    console.log(`Certificates returned in search: ${certificatesList.length}`);
    const foundInSearch = certificatesList.find((c) => c.id === certificate.id);
    if (!foundInSearch) {
      throw new Error("Revoked certificate was not found in the search results!");
    }
    console.log("✅ Registry Visibility Checks Passed!");

    // ----------------------------------------------------
    // TEST 4: Statistics Calculations
    // ----------------------------------------------------
    console.log("\nCalculating statistics...");
    const totalIssued = certificatesList.length;
    const activeCount = certificatesList.filter((c) => c.status === "ACTIVE").length;
    const revokedCount = certificatesList.filter((c) => c.status === "REVOKED").length;

    console.log(`Total Issued: ${totalIssued}`);
    console.log(`Active: ${activeCount}`);
    console.log(`Revoked: ${revokedCount}`);

    if (totalIssued !== 1) {
      throw new Error(`Total Issued should be 1, got ${totalIssued}`);
    }
    if (activeCount !== 0) {
      throw new Error(`Active Count should be 0, got ${activeCount}`);
    }
    if (revokedCount !== 1) {
      throw new Error(`Revoked Count should be 1, got ${revokedCount}`);
    }
    console.log("✅ Statistics Calculation Checks Passed!");

    // Clean up created entities
    console.log("\nCleaning up test records...");
    await prisma.certificate.delete({ where: { id: certificate.id } });
    await prisma.certificateTemplate.delete({ where: { id: templateId } });
    await prisma.course.delete({ where: { id: courseId } });
    await prisma.user.delete({ where: { id: studentId } });
    console.log("Cleanup complete.");

  } catch (err) {
    console.error("Test execution failed:", err);
    throw err;
  }
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
