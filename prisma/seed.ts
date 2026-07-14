import { PrismaClient } from "../app/generated/prisma/client";
import { Role } from "../app/generated/prisma/enums";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING DATABASE ===");

  // 1. Fetch or create TARGET Institute
  let institute = await prisma.institute.findFirst({
    where: { name: "TARGET Institute" },
  });

  if (!institute) {
    institute = await prisma.institute.create({
      data: { name: "TARGET Institute" },
    });
    console.log("Created Institute:", institute.name, `(${institute.id})`);
  } else {
    console.log("Reusing Institute:", institute.name, `(${institute.id})`);
  }

  // 2. Fetch or create Course
  let course = await prisma.course.findFirst({
    where: { courseCode: "FSD101" },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        title: "Full Stack Development",
        description: "Test Course",
        courseCode: "FSD101",
        instituteId: institute.id,
      },
    });
    console.log("Created Course:", course.title, `(${course.id})`);
  } else {
    console.log("Reusing Course:", course.title, `(${course.id})`);
  }

  // 3. Password hashing
  const superAdminPassword = await bcrypt.hash("123456", 10);
  const devPassword = await bcrypt.hash("password123", 10);

  // 4. Create SUPER_ADMIN
  let superAdmin = await prisma.user.findUnique({
    where: { email: "admin@target.com" },
  });
  if (!superAdmin) {
    superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin",
        email: "admin@target.com",
        password: superAdminPassword,
        role: Role.SUPER_ADMIN,
        instituteId: institute.id,
      },
    });
    console.log("Created SUPER_ADMIN:", superAdmin.email);
  } else {
    console.log("SUPER_ADMIN already exists:", superAdmin.email);
  }

  // 5. Create ADMIN
  let admin = await prisma.user.findUnique({
    where: { email: "admin@test.com" },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@test.com",
        password: devPassword,
        role: Role.ADMIN,
        instituteId: institute.id,
      },
    });
    console.log("Created ADMIN:", admin.email);
  } else {
    console.log("ADMIN already exists:", admin.email);
  }

  // 6. Create FACULTY
  let faculty = await prisma.user.findUnique({
    where: { email: "faculty@test.com" },
  });
  if (!faculty) {
    faculty = await prisma.user.create({
      data: {
        name: "Faculty User",
        email: "faculty@test.com",
        password: devPassword,
        role: Role.FACULTY,
        instituteId: institute.id,
      },
    });
    console.log("Created FACULTY:", faculty.email);
  } else {
    console.log("FACULTY already exists:", faculty.email);
  }

  // Assign Faculty User to the course
  if (course.facultyId !== faculty.id) {
    course = await prisma.course.update({
      where: { id: course.id },
      data: { facultyId: faculty.id },
    });
    console.log("Assigned Course", course.courseCode, "to Faculty:", faculty.name);
  }

  // 7. Create 3 STUDENTS
  const studentData = [
    { name: "Student One", email: "student1@test.com" },
    { name: "Student Two", email: "student2@test.com" },
    { name: "Student Three", email: "student3@test.com" },
  ];

  const students = [];
  for (const sData of studentData) {
    let student = await prisma.user.findUnique({
      where: { email: sData.email },
    });
    if (!student) {
      student = await prisma.user.create({
        data: {
          name: sData.name,
          email: sData.email,
          password: devPassword,
          role: Role.STUDENT,
          instituteId: institute.id,
        },
      });
      console.log("Created STUDENT:", student.name, `(${student.email})`);
    } else {
      console.log("STUDENT already exists:", student.email);
    }
    students.push(student);
  }

  // 8. Fetch or create Batch for enrollment
  let batch = await prisma.batch.findFirst({
    where: { courseId: course.id, name: "FSD101-Batch-A" },
  });

  if (!batch) {
    batch = await prisma.batch.create({
      data: {
        name: "FSD101-Batch-A",
        startDate: new Date(),
        endDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000), // 6 months duration
        courseId: course.id,
      },
    });
    console.log("Created Batch:", batch.name, `(${batch.id})`);
  } else {
    console.log("Reusing existing Batch:", batch.name, `(${batch.id})`);
  }

  // 9. Enroll students in batch
  for (const student of students) {
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_batchId: {
          studentId: student.id,
          batchId: batch.id,
        },
      },
    });

    if (!existingEnrollment) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          batchId: batch.id,
        },
      });
      console.log(`Enrolled student ${student.name} in Batch ${batch.name}`);
    } else {
      console.log(`Student ${student.name} already enrolled in Batch ${batch.name}`);
    }
  }

  // 10. Seed Subscription Plans
  console.log("Seeding Subscription Plans...");
  const plans = [
    {
      name: "Free",
      code: "free",
      price: 0.0,
      maxStudents: 50,
      maxFaculty: 5,
      maxCourses: 10,
      maxAdmins: 1,
      storageLimitGB: 2.0,
      trialDays: 14,
    },
    {
      name: "Basic",
      code: "basic",
      price: 49.0,
      maxStudents: 300,
      maxFaculty: 20,
      maxCourses: 50,
      maxAdmins: 2,
      storageLimitGB: 20.0,
      trialDays: 14,
    },
    {
      name: "Professional",
      code: "professional",
      price: 149.0,
      maxStudents: 1500,
      maxFaculty: 100,
      maxCourses: 250,
      maxAdmins: 5,
      storageLimitGB: 100.0,
      trialDays: 14,
    },
    {
      name: "Enterprise",
      code: "enterprise",
      price: 499.0,
      maxStudents: null,
      maxFaculty: null,
      maxCourses: null,
      maxAdmins: null,
      storageLimitGB: null,
      trialDays: 0,
    },
  ];

  for (const plan of plans) {
    await prisma.subscriptionPlan.upsert({
      where: { code: plan.code },
      update: plan,
      create: plan,
    });
  }
  console.log("Subscription plans upserted successfully.");

  // 11. Assign default subscription for existing institutes
  const allInstitutes = await prisma.institute.findMany({
    include: { subscription: true },
  });

  const freePlan = await prisma.subscriptionPlan.findUnique({
    where: { code: "free" },
  });

  if (freePlan) {
    for (const inst of allInstitutes) {
      if (!inst.subscription) {
        await prisma.subscription.create({
          data: {
            instituteId: inst.id,
            planId: freePlan.id,
            status: "ACTIVE",
            startsAt: new Date(),
            trialEndsAt: null,
            autoRenew: true,
          },
        });
        console.log(`Assigned Free subscription plan to institute: ${inst.name}`);
      }
    }
  }

  console.log("✅ Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });