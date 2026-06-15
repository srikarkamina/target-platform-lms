import { generateToken } from "../lib/auth";
import axios from "axios";

async function main() {
  const token = generateToken({
    id: "ef6d12df-ca64-48ca-8f4b-7c6b4519621d",
    email: "admin@target.com",
    role: "SUPER_ADMIN",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  console.log("Super Admin Token:", token);

  const videoId = "1b6ce867-68a8-4538-ad44-e36dcd57cf46";
  const courseId = "e133d368-9ed7-43ea-a1b9-40af73ce2cd9";

  try {
    console.log("Testing GET /api/videos/[id]...");
    const videoResponse = await axios.get(`http://localhost:3000/api/videos/${videoId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Video GET Response Status:", videoResponse.status);
    console.log("Video GET Title:", videoResponse.data?.title);
    console.log("Video GET Full Object:", JSON.stringify(videoResponse.data, null, 2));

    console.log("\nTesting GET /api/courses/[id]/content...");
    const courseResponse = await axios.get(`http://localhost:3000/api/courses/${courseId}/content`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Course Content Response Status:", courseResponse.status);
    console.log("Course Title:", courseResponse.data?.course?.title);
    console.log("Videos Count:", courseResponse.data?.videos?.length);
  } catch (error: any) {
    if (error.response) {
      console.error("Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

main();
