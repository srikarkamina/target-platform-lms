import { generateToken } from "../lib/auth";
import axios from "axios";

async function main() {
  const token = generateToken({
    id: "6ea9e737-6c29-4fd9-beba-148e984a8fff",
    email: "rahul2@student.com",
    role: "STUDENT",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  const courseId = "e133d368-9ed7-43ea-a1b9-40af73ce2cd9";

  try {
    const response = await axios.get(`http://localhost:3000/api/courses/${courseId}/content`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Response Status:", response.status);
    console.log("Response Progress:", response.data.progress);
    console.log("Response Videos:", JSON.stringify(response.data.videos, null, 2));
  } catch (error: any) {
    if (error.response) {
      console.error("Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

main();
