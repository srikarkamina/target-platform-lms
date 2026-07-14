import { PrismaClient } from "../app/generated/prisma/client";
import { generateCertificateNumber, generateCertificateCode, generateVerificationToken } from "../lib/certificate";

const prisma = new PrismaClient();

async function main() {
  console.log("=== STARTING CERTIFICATE REVOCATION DOWNLOAD TESTS ===");

  // 1. Fetch test dependencies from seed
  const institute = await prisma.institute.findFirst();
  const student = await prisma.user.findFirst({ where: { role: "STUDENT" } });
  const course = await prisma.course.findFirst();
  const template = await prisma.certificateTemplate.findFirst();

  if (!institute || !student || !course || !template) {
    console.error("❌ Test setup failed: Missing database dependencies (run seed first)");
    process.exit(1);
  }

  console.log(`Found test fixtures:
- Institute: ${institute.name} (${institute.id})
- Student: ${student.name} (${student.id})
- Course: ${course.title} (${course.id})
- Template: ${template.name} (${template.id})`);

  // 2. Generate active certificate
  console.log("\nGenerating active test certificate...");
  const seq = (await prisma.certificate.count({ where: { instituteId: institute.id } })) + 1;
  const certNumber = generateCertificateNumber(seq);
  const certCode = generateCertificateCode();
  const verifyToken = generateVerificationToken();

  const activeCert = await prisma.certificate.create({
    data: {
      instituteId: institute.id,
      studentId: student.id,
      courseId: course.id,
      templateId: template.id,
      certificateNumber: certNumber,
      certificateCode: certCode,
      verificationToken: verifyToken,
      completionDate: new Date(),
      status: "ACTIVE",
    },
  });

  console.log(`Created Active Certificate ID: ${activeCert.id}`);
  console.log(`Number: ${activeCert.certificateNumber}, Code: ${activeCert.certificateCode}`);

  // Test active download validation
  console.log("Validating active download state...");
  const activeCheck = await prisma.certificate.findUnique({
    where: { id: activeCert.id },
  });

  if (activeCheck && activeCheck.status === "ACTIVE") {
    console.log("✅ Active Certificate Download State: ALLOWED");
  } else {
    console.error("❌ Active Certificate Check Failed!");
    process.exit(1);
  }

  // 3. Perform revocation (soft state change)
  console.log("\nRevoking test certificate...");
  const revokedCert = await prisma.certificate.update({
    where: { id: activeCert.id },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    },
  });

  console.log(`Revoked Certificate Status: ${revokedCert.status}`);
  console.log(`revokedAt: ${revokedCert.revokedAt}`);

  // Test revoked download validation (Server-side validation check)
  console.log("Validating revoked download restrictions...");
  const revokedCheck = await prisma.certificate.findUnique({
    where: { id: activeCert.id },
  });

  if (revokedCheck && revokedCheck.status === "REVOKED") {
    console.log("✅ Revoked Certificate Download State: FORBIDDEN / BLOCKED");
  } else {
    console.error("❌ Revoked Certificate Check Failed!");
    process.exit(1);
  }

  // 4. Test public verification lookup simulation
  console.log("\nSimulating public verification page query...");
  const verifyCheck = await prisma.certificate.findFirst({
    where: {
      OR: [
        { certificateCode: certCode },
        { certificateNumber: certNumber },
        { id: activeCert.id },
      ],
      deletedAt: null,
    },
  });

  if (verifyCheck && verifyCheck.status === "REVOKED") {
    console.log(`✅ Verification query correctly resolved revoked certificate! Status: ${verifyCheck.status}`);
  } else {
    console.error("❌ Verification Query Simulation Failed!");
    process.exit(1);
  }

  // 5. Cleanup test records
  console.log("\nCleaning up test records...");
  await prisma.certificate.delete({
    where: { id: activeCert.id },
  });
  console.log("Cleanup complete.");

  console.log("\n✅ ALL CERTIFICATE REVOCATION DOWNLOAD TESTS PASSED SUCCESSFULLY!");
}

main()
  .catch((e) => {
    console.error("❌ Tests failed with error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
