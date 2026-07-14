import { prisma } from "../lib/prisma";
import {
  getTemplate,
  validateTemplate,
  checkDuplicateCertificate,
  prepareCertificateMetadata,
} from "../lib/services/certificate-service";
import {
  generateCertificateNumber,
  generateCertificateCode,
  generateVerificationToken,
} from "../lib/certificate";
import {
  createTemplateSchema,
  updateTemplateSchema,
  generateCertificateSchema,
} from "../lib/validations/certificate";

async function main() {
  console.log("=== STARTING CERTIFICATE FOUNDATION TESTS ===");

  // 1. Fetch or create test dependencies
  let institute = await prisma.institute.findFirst({ where: { deletedAt: null } });
  if (!institute) {
    console.log("No institute found. Creating test institute...");
    institute = await prisma.institute.create({
      data: { name: "Test Institute" },
    });
  }
  const instituteId = institute.id;
  console.log(`Using Institute ID: ${instituteId}`);

  let student = await prisma.user.findFirst({
    where: { role: "STUDENT", instituteId, deletedAt: null },
  });
  if (!student) {
    console.log("No student found for institute. Creating test student...");
    student = await prisma.user.create({
      data: {
        name: "Test Student",
        email: `student-${Date.now()}@test.com`,
        password: "hashedpassword123",
        role: "STUDENT",
        instituteId,
      },
    });
  }
  const studentId = student.id;
  console.log(`Using Student ID: ${studentId}`);

  let course = await prisma.course.findFirst({
    where: { instituteId, deletedAt: null },
  });
  if (!course) {
    console.log("No course found for institute. Creating test course...");
    course = await prisma.course.create({
      data: {
        title: "Test Course",
        courseCode: `TEST-${Date.now()}`,
        instituteId,
      },
    });
  }
  const courseId = course.id;
  console.log(`Using Course ID: ${courseId}`);

  // Also create a second institute to verify tenant isolation
  const secondInstitute = await prisma.institute.create({
    data: { name: "Second Test Institute" },
  });
  const secondInstituteId = secondInstitute.id;
  console.log(`Created second institute for isolation testing: ${secondInstituteId}`);

  try {
    // ----------------------------------------------------
    // TEST 1: Unique Identifier Engine Validation
    // ----------------------------------------------------
    console.log("\n--- TEST 1: Identifier Engine ---");
    const certNum1 = generateCertificateNumber(1);
    const certNum2 = generateCertificateNumber(99);
    console.log(`Generated Certificate Number 1: ${certNum1}`);
    console.log(`Generated Certificate Number 2: ${certNum2}`);
    if (!certNum1.startsWith("CERT-") || !certNum1.endsWith("-000001")) {
      throw new Error(`Invalid certificate number format: ${certNum1}`);
    }

    const certCode1 = generateCertificateCode();
    const certCode2 = generateCertificateCode();
    console.log(`Generated Certificate Code 1: ${certCode1}`);
    console.log(`Generated Certificate Code 2: ${certCode2}`);
    if (certCode1.length !== 10 || certCode1 === certCode2) {
      throw new Error(`Invalid or colliding certificate codes generated: ${certCode1}, ${certCode2}`);
    }

    const token1 = generateVerificationToken();
    console.log(`Generated Verification Token: ${token1}`);
    if (token1.length !== 64) {
      throw new Error(`Verification token should be 64 characters hex: ${token1}`);
    }
    console.log("✅ Identifier Engine Tests Passed!");

    // ----------------------------------------------------
    // TEST 2: Zod Validation Schemas
    // ----------------------------------------------------
    console.log("\n--- TEST 2: Validation Schemas ---");
    const validTemplateInput = {
      name: "Standard Completion Certificate",
      title: "Certificate of Completion",
      description: "Awarded for completing the course successfully.",
      backgroundImage: "https://example.com/background.png",
      signatureImage: "https://example.com/signature.png",
      isActive: true,
    };

    const parsedTemplate = createTemplateSchema.safeParse(validTemplateInput);
    if (!parsedTemplate.success) {
      throw new Error(`Template validation failed unexpectedly: ${JSON.stringify(parsedTemplate.error.issues)}`);
    }

    const invalidTemplateInput = {
      name: "", // name empty
      title: "Certificate",
      backgroundImage: "not-a-url",
    };
    const parsedInvalidTemplate = createTemplateSchema.safeParse(invalidTemplateInput);
    if (parsedInvalidTemplate.success) {
      throw new Error("Invalid template inputs were incorrectly parsed as successful!");
    }
    console.log("✅ Validation Schemas Tests Passed!");

    // ----------------------------------------------------
    // TEST 3: Database & Service operations (CRUD & Retrieval)
    // ----------------------------------------------------
    console.log("\n--- TEST 3: Template Operations & Services ---");
    // Create template
    const template = await prisma.certificateTemplate.create({
      data: {
        name: validTemplateInput.name,
        title: validTemplateInput.title,
        description: validTemplateInput.description,
        backgroundImage: validTemplateInput.backgroundImage,
        signatureImage: validTemplateInput.signatureImage,
        isActive: validTemplateInput.isActive,
        instituteId,
      },
    });
    console.log(`Created Certificate Template with ID: ${template.id}`);

    // Retrieve via service
    const retrievedTemplate = await getTemplate(template.id, instituteId);
    console.log(`Retrieved Template Name: ${retrievedTemplate.name}`);
    if (retrievedTemplate.name !== template.name) {
      throw new Error("Mismatch in retrieved template details");
    }

    // Validate Template (isActive check)
    validateTemplate(retrievedTemplate);
    console.log("Template validation (isActive) check passed!");

    // ----------------------------------------------------
    // TEST 4: Tenant Isolation Check
    // ----------------------------------------------------
    console.log("\n--- TEST 4: Tenant Isolation ---");
    try {
      // Attempting to retrieve template using secondary instituteId
      await getTemplate(template.id, secondInstituteId);
      throw new Error("Tenant isolation failed! Accessed template from another institute.");
    } catch (err: any) {
      console.log(`Expected tenant isolation error caught: "${err.message}"`);
      if (!err.message.includes("Tenant mismatch")) {
        throw new Error(`Unexpected error type during tenant boundary check: ${err.message}`);
      }
    }
    console.log("✅ Tenant Isolation Tests Passed!");

    // ----------------------------------------------------
    // TEST 5: Certificate Generation & Duplicates
    // ----------------------------------------------------
    console.log("\n--- TEST 5: Certificate Issue & Duplicates ---");
    // Ensure no prior certificate exists
    const duplicateBefore = await checkDuplicateCertificate(studentId, courseId);
    if (duplicateBefore !== null) {
      throw new Error("Pre-existing certificate found before creation!");
    }

    // Prepare metadata
    const certMeta = await prepareCertificateMetadata({
      studentId,
      courseId,
      templateId: template.id,
      instituteId,
    });
    console.log("Prepared Certificate Metadata:", JSON.stringify(certMeta, null, 2));

    // Create Certificate
    const certificate = await prisma.certificate.create({
      data: certMeta,
    });
    console.log(`Issued Certificate ID: ${certificate.id}`);

    // Check duplicate now (should return the issued certificate)
    const duplicateAfter = await checkDuplicateCertificate(studentId, courseId);
    if (duplicateAfter === null || duplicateAfter.id !== certificate.id) {
      throw new Error("Duplicate certificate check failed to identify existing certificate!");
    }
    console.log("✅ Certificate Generation and Duplicate Checks Passed!");

    // Clean up created entities
    console.log("\n--- Cleaning up test records ---");
    await prisma.certificate.delete({ where: { id: certificate.id } });
    await prisma.certificateTemplate.delete({ where: { id: template.id } });
    console.log("Test records cleaned up successfully.");

  } finally {
    // Clean up second institute
    await prisma.institute.delete({ where: { id: secondInstituteId } });
    console.log("Second institute cleaned up.");
  }

  console.log("\n=== ALL CERTIFICATE FOUNDATION TESTS PASSED SUCCESSFULLY! ===");
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
