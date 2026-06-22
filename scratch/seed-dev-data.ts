import "dotenv/config";
import { PrismaClient } from "../app/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("=== SEEDING DEVELOPMENT TEST DATA ===");

  // 1. Fetch or create Institute
  let institute = await prisma.institute.findFirst({
    where: { name: "TARGET Institute" },
  });

  if (!institute) {
    institute = await prisma.institute.create({
      data: { name: "TARGET Institute" },
    });
    console.log("Created new Institute:", institute.id);
  } else {
    console.log("Reusing existing Institute:", institute.name, `(${institute.id})`);
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
    console.log("Created new Course:", course.title, `(${course.id})`);
  } else {
    console.log("Reusing existing Course:", course.title, `(${course.id})`);
  }

  // 3. Password hashing
  const defaultPassword = "password123";
  const hashedPassword = await bcrypt.hash(defaultPassword, 10);

  // 4. Create ADMIN
  let admin = await prisma.user.findUnique({
    where: { email: "admin@test.com" },
  });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@test.com",
        password: hashedPassword,
        role: "ADMIN",
        instituteId: institute.id,
      },
    });
    console.log("Created ADMIN:", admin.name, `(${admin.email})`);
  } else {
    console.log("ADMIN already exists:", admin.email);
  }

  // 5. Create FACULTY
  let faculty = await prisma.user.findUnique({
    where: { email: "faculty@test.com" },
  });
  if (!faculty) {
    faculty = await prisma.user.create({
      data: {
        name: "Faculty User",
        email: "faculty@test.com",
        password: hashedPassword,
        role: "FACULTY",
        instituteId: institute.id,
      },
    });
    console.log("Created FACULTY:", faculty.name, `(${faculty.email})`);
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

  // 6. Create 3 STUDENTS
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
          password: hashedPassword,
          role: "STUDENT",
          instituteId: institute.id,
        },
      });
      console.log("Created STUDENT:", student.name, `(${student.email})`);
    } else {
      console.log("STUDENT already exists:", student.email);
    }
    students.push(student);
  }

  // 7. Fetch or create Batch for enrollment
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

  // 8. Enroll students in batch
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

  console.log("🚀 Seeding test data completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
