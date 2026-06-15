import { prisma } from "../lib/prisma";
import { generateToken } from "../lib/auth";
import axios from "axios";

async function main() {
  const courseId = "e133d368-9ed7-43ea-a1b9-40af73ce2cd9"; // Python Programming
  
  // 1. Create a draft (unpublished) video in DB
  const draftVideo = await prisma.video.create({
    data: {
      title: "Draft Python Lesson",
      description: "Secret preview lesson",
      videoUrl: "https://example.com/draft.mp4",
      duration: 120,
      sortOrder: 5,
      published: false,
      courseId: courseId
    }
  });
  console.log("Created Draft Video in DB:", draftVideo.id);

  // Temporarily assign course to Faculty user
  await prisma.course.update({
    where: { id: courseId },
    data: { facultyId: "fe557188-0b56-409c-b520-1ec9a3ffc305" }
  });
  console.log("Temporarily assigned Python Programming to John Faculty");

  // Generate tokens for different roles
  const superAdminToken = generateToken({
    id: "ef6d12df-ca64-48ca-8f4b-7c6b4519621d",
    email: "admin@target.com",
    role: "SUPER_ADMIN",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  const facultyToken = generateToken({
    id: "fe557188-0b56-409c-b520-1ec9a3ffc305",
    email: "john@target.com",
    role: "FACULTY",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  const studentToken = generateToken({
    id: "6ea9e737-6c29-4fd9-beba-148e984a8fff",
    email: "rahul2@student.com",
    role: "STUDENT",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  try {
    // A. TEST SUPER_ADMIN ACCESS TO DRAFT VIDEO
    console.log("\n--- Testing Super Admin Access to Draft Video ---");
    const adminRes = await axios.get(`http://localhost:3000/api/videos/${draftVideo.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log("Super Admin GET Status:", adminRes.status);
    console.log("Super Admin GET Video Title:", adminRes.data?.title);

    // B. TEST FACULTY ACCESS TO DRAFT VIDEO
    console.log("\n--- Testing Faculty Access to Draft Video ---");
    const facultyRes = await axios.get(`http://localhost:3000/api/videos/${draftVideo.id}`, {
      headers: { Authorization: `Bearer ${facultyToken}` }
    });
    console.log("Faculty GET Status:", facultyRes.status);
    console.log("Faculty GET Video Title:", facultyRes.data?.title);

    // C. TEST STUDENT ACCESS TO DRAFT VIDEO (Should fail with 403)
    console.log("\n--- Testing Student Access to Draft Video ---");
    try {
      await axios.get(`http://localhost:3000/api/videos/${draftVideo.id}`, {
        headers: { Authorization: `Bearer ${studentToken}` }
      });
      console.log("WARNING: Student accessed draft video!");
    } catch (err: any) {
      console.log("Student GET Status:", err.response?.status);
      console.log("Student GET Error Message:", err.response?.data?.message);
    }

    // D. TEST STUDENT CONTENT LISTING (Should not include draft video)
    console.log("\n--- Testing Student Course Content Listing ---");
    const studentContentRes = await axios.get(`http://localhost:3000/api/courses/${courseId}/content`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });
    const hasDraft = studentContentRes.data?.videos?.some((v: any) => v.id === draftVideo.id);
    console.log("Student Content List Status:", studentContentRes.status);
    console.log("Student Content List contains draft video:", hasDraft);

    // E. EDIT VIDEO (via Super Admin PUT)
    console.log("\n--- Testing Edit Video (Super Admin PUT) ---");
    const editRes = await axios.put(`http://localhost:3000/api/videos/${draftVideo.id}`, {
      title: "Updated Draft Title",
      videoUrl: "https://example.com/draft-updated.mp4",
      sortOrder: 6
    }, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log("Super Admin PUT Status:", editRes.status);
    console.log("Super Admin PUT Updated Title:", editRes.data?.title);

    // F. DELETE VIDEO (via Super Admin DELETE)
    console.log("\n--- Testing Delete Video (Super Admin DELETE) ---");
    const deleteRes = await axios.delete(`http://localhost:3000/api/videos/${draftVideo.id}`, {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    console.log("Super Admin DELETE Status:", deleteRes.status);

    // G. VERIFY VIDEO IS DELETED
    console.log("\n--- Verifying Deleted Video is inaccessible ---");
    try {
      await axios.get(`http://localhost:3000/api/videos/${draftVideo.id}`, {
        headers: { Authorization: `Bearer ${superAdminToken}` }
      });
      console.log("WARNING: Deleted video is still accessible!");
    } catch (err: any) {
      console.log("Super Admin GET Deleted Status:", err.response?.status);
      console.log("Super Admin GET Deleted Message:", err.response?.data?.message);
    }

  } catch (error: any) {
    if (error.response) {
      console.error("Critical Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Critical Error:", error.message);
    }
  } finally {
    // Cleanup DB record
    await prisma.video.deleteMany({
      where: { id: draftVideo.id }
    });
    console.log("\nCleaned up draft video record from DB.");

    // Restore course facultyId to null
    await prisma.course.update({
      where: { id: courseId },
      data: { facultyId: null }
    });
    console.log("Restored Python Programming course facultyId to null");

    await prisma.$disconnect();
  }
}

main();
