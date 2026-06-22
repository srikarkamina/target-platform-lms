import "dotenv/config";
import { NextRequest } from "next/server";
import { GET as getQuizzes, POST as createQuiz } from "../app/api/quizzes/route";
import { GET as getQuiz, PUT as updateQuiz, DELETE as deleteQuiz } from "../app/api/quizzes/[id]/route";
import { generateToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import { Role } from "../app/generated/prisma/client";

async function main() {
  console.log("=== STARTING QUIZ BACKEND API INTEGRATION TESTS ===");

  // 1. Setup mock data
  const institute1 = await prisma.institute.create({
    data: { name: "Test Institute 1" },
  });
  const institute2 = await prisma.institute.create({
    data: { name: "Test Institute 2" },
  });

  const course1 = await prisma.course.create({
    data: {
      title: "Test Course 1",
      courseCode: "T101",
      instituteId: institute1.id,
    },
  });

  const admin1 = await prisma.user.create({
    data: {
      name: "Inst 1 Admin",
      email: "admin1@test.com",
      password: "password123",
      role: Role.ADMIN,
      instituteId: institute1.id,
    },
  });

  const faculty1 = await prisma.user.create({
    data: {
      name: "Inst 1 Faculty",
      email: "faculty1@test.com",
      password: "password123",
      role: Role.FACULTY,
      instituteId: institute1.id,
    },
  });

  const student1 = await prisma.user.create({
    data: {
      name: "Inst 1 Student",
      email: "student1@test.com",
      password: "password123",
      role: Role.STUDENT,
      instituteId: institute1.id,
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      name: "Inst 2 Admin",
      email: "admin2@test.com",
      password: "password123",
      role: Role.ADMIN,
      instituteId: institute2.id,
    },
  });

  // Assign course to faculty1 for course ownership validation
  await prisma.course.update({
    where: { id: course1.id },
    data: { facultyId: faculty1.id },
  });

  // Generate tokens
  const admin1Token = generateToken({ id: admin1.id, email: admin1.email, role: admin1.role });
  const faculty1Token = generateToken({ id: faculty1.id, email: faculty1.email, role: faculty1.role });
  const student1Token = generateToken({ id: student1.id, email: student1.email, role: student1.role });
  const admin2Token = generateToken({ id: admin2.id, email: admin2.email, role: admin2.role });

  let quizId = "";

  try {
    // TEST 1: POST /api/quizzes (Success as Admin)
    console.log("\n--- Test 1: Create Quiz (Success as Admin) ---");
    const req1 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "POST",
      headers: { Authorization: `Bearer ${admin1Token}` },
      body: JSON.stringify({
        title: "Pop Quiz 1",
        description: "A short quiz on TypeScript",
        courseId: course1.id,
        timeLimit: 15,
        passingMarks: 10,
        totalMarks: 20,
        isPublished: true,
        questions: [
          {
            question: "What is TypeScript?",
            options: ["A programming language", "A coffee brand", "A font style"],
            correctAnswers: ["A programming language"],
            questionType: "SINGLE_CHOICE",
            marks: 10,
            order: 0,
          },
          {
            // Second question
            question: "Which are JS engines?",
            options: ["V8", "SpiderMonkey", "Python"],
            correctAnswers: ["V8", "SpiderMonkey"],
            questionType: "MULTIPLE_CHOICE",
            marks: 10,
            order: 1,
          }
        ],
      }),
    });
    const res1 = await createQuiz(req1);
    console.log("Status:", res1.status);
    const body1 = await res1.json();
    console.log("Payload:", JSON.stringify(body1, null, 2));
    if (res1.status === 201) {
      quizId = body1.id;
    }

    // TEST 2: POST /api/quizzes (Validation Mismatch: passingMarks > totalMarks)
    console.log("\n--- Test 2: Create Quiz (Validation Error: passing > total) ---");
    const req2 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "POST",
      headers: { Authorization: `Bearer ${admin1Token}` },
      body: JSON.stringify({
        title: "Invalid Quiz",
        courseId: course1.id,
        timeLimit: 10,
        passingMarks: 20, // Exceeds total
        totalMarks: 10,
        questions: [
          {
            question: "Question 1",
            options: ["Opt 1", "Opt 2"],
            correctAnswers: ["Opt 1"],
            questionType: "SINGLE_CHOICE",
            marks: 10,
            order: 0,
          }
        ],
      }),
    });
    const res2 = await createQuiz(req2);
    console.log("Status (Expected 400):", res2.status);
    console.log("Body:", await res2.json());

    // TEST 3: POST /api/quizzes (Blocked Role: STUDENT)
    console.log("\n--- Test 3: Create Quiz (Blocked Role: STUDENT) ---");
    const req3 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "POST",
      headers: { Authorization: `Bearer ${student1Token}` },
      body: JSON.stringify({
        title: "Student Quiz Attempt",
        courseId: course1.id,
        timeLimit: 10,
        passingMarks: 5,
        totalMarks: 10,
        questions: [
          {
            question: "Question 1",
            options: ["Opt 1", "Opt 2"],
            correctAnswers: ["Opt 1"],
            questionType: "SINGLE_CHOICE",
            marks: 10,
            order: 0,
          }
        ],
      }),
    });
    const res3 = await createQuiz(req3);
    console.log("Status (Expected 403):", res3.status);
    console.log("Body:", await res3.json());

    // TEST 4: GET /api/quizzes (List Quizzes with Tenant Separation)
    console.log("\n--- Test 4: List Quizzes (Admin 1 - Expecting 1 Quiz) ---");
    const req4 = new NextRequest("http://localhost:3000/api/quizzes?page=1&limit=10", {
      method: "GET",
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const res4 = await getQuizzes(req4);
    console.log("Status:", res4.status);
    const body4 = await res4.json();
    console.log("Total Count:", body4.total);
    console.log("Quizzes:", body4.quizzes?.map((q: any) => `${q.title} (Questions: ${q._count?.questions})`));

    // TEST 5: GET /api/quizzes (List Quizzes as Admin 2 - Expecting 0 Quizzes due to Tenant Isolation)
    console.log("\n--- Test 5: List Quizzes (Admin 2 - Expecting 0 Quizzes due to Tenant Isolation) ---");
    const req5 = new NextRequest("http://localhost:3000/api/quizzes", {
      method: "GET",
      headers: { Authorization: `Bearer ${admin2Token}` },
    });
    const res5 = await getQuizzes(req5);
    console.log("Status:", res5.status);
    const body5 = await res5.json();
    console.log("Total Count (Expected 0):", body5.total);

    // TEST 6: GET /api/quizzes/[id] (Success as Faculty 1)
    console.log("\n--- Test 6: Get Quiz by ID (Success as Faculty 1) ---");
    const req6 = new NextRequest(`http://localhost:3000/api/quizzes/${quizId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${faculty1Token}` },
    });
    const res6 = await getQuiz(req6, { params: Promise.resolve({ id: quizId }) });
    console.log("Status:", res6.status);
    const body6 = await res6.json();
    console.log("Fetched Quiz Title:", body6.title);
    console.log("Questions Count:", body6.questions?.length);

    // TEST 7: GET /api/quizzes/[id] (Tenant Mismatch as Admin 2)
    console.log("\n--- Test 7: Get Quiz by ID (Tenant Mismatch - Expected 403) ---");
    const req7 = new NextRequest(`http://localhost:3000/api/quizzes/${quizId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${admin2Token}` },
    });
    const res7 = await getQuiz(req7, { params: Promise.resolve({ id: quizId }) });
    console.log("Status (Expected 403):", res7.status);
    console.log("Body:", await res7.json());

    // TEST 8: PUT /api/quizzes/[id] (Update Details and Question Modifications)
    console.log("\n--- Test 8: Update Quiz (PUT - Modifying Questions) ---");
    // Modify: Change Quiz Title, update Question 1, delete Question 2, add Question 3
    const q1 = body6.questions[0];
    const req8 = new NextRequest(`http://localhost:3000/api/quizzes/${quizId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${admin1Token}` },
      body: JSON.stringify({
        title: "Updated Pop Quiz 1",
        description: "An updated short quiz",
        timeLimit: 20,
        passingMarks: 15,
        totalMarks: 25,
        questions: [
          {
            id: q1.id, // Keep Q1
            question: "What is TypeScript? (Updated)",
            options: ["A typed superset of JS", "A coffee brand", "A font style"],
            correctAnswers: ["A typed superset of JS"],
            questionType: "SINGLE_CHOICE",
            marks: 15,
            order: 0,
          },
          {
            // New Question Q3 (Question 2 deleted implicitly since not passed in list)
            question: "Is Prisma an ORM?",
            options: ["Yes", "No"],
            correctAnswers: ["Yes"],
            questionType: "SINGLE_CHOICE",
            marks: 10,
            order: 1,
          }
        ],
      }),
    });
    const res8 = await updateQuiz(req8, { params: Promise.resolve({ id: quizId }) });
    console.log("Status:", res8.status);
    const body8 = await res8.json();
    console.log("Updated Title:", body8.title);
    console.log("Updated Passing Marks:", body8.passingMarks);
    console.log("Updated Questions:", body8.questions?.map((q: any) => q.question));

    // TEST 9: DELETE /api/quizzes/[id] (Soft Delete)
    console.log("\n--- Test 9: Delete Quiz (Soft Delete) ---");
    const req9 = new NextRequest(`http://localhost:3000/api/quizzes/${quizId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const res9 = await deleteQuiz(req9, { params: Promise.resolve({ id: quizId }) });
    console.log("Status:", res9.status);
    console.log("Body:", await res9.json());

    // TEST 10: GET /api/quizzes/[id] (Should return 404 after soft delete)
    console.log("\n--- Test 10: Get Quiz after Soft Delete ---");
    const req10 = new NextRequest(`http://localhost:3000/api/quizzes/${quizId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${admin1Token}` },
    });
    const res10 = await getQuiz(req10, { params: Promise.resolve({ id: quizId }) });
    console.log("Status (Expected 404):", res10.status);
    console.log("Body:", await res10.json());

  } catch (error: any) {
    console.error("UNEXPECTED ERROR DURING TESTS:", error);
  } finally {
    // 4. Cleanup DB
    console.log("\n=== CLEANING UP DATABASE TEST RECORDS ===");
    if (quizId) {
      // Deleting the quiz will cascade delete questions since Cascade is set in db
      await prisma.quiz.deleteMany({ where: { id: quizId } });
    }
    await prisma.course.deleteMany({ where: { id: course1.id } });
    await prisma.user.deleteMany({
      where: {
        id: { in: [admin1.id, faculty1.id, student1.id, admin2.id] },
      },
    });
    await prisma.institute.deleteMany({
      where: {
        id: { in: [institute1.id, institute2.id] },
      },
    });
    console.log("Cleanup finished.");
    await prisma.$disconnect();
  }
}

main().catch(console.error);
