import { generateToken } from "../lib/auth";
import axios from "axios";

async function main() {
  const token = generateToken({
    id: "6ea9e737-6c29-4fd9-beba-148e984a8fff",
    email: "rahul2@student.com",
    role: "STUDENT",
    instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a"
  });

  console.log("Generated Token:", token);

  const videoId = "1b6ce867-68a8-4538-ad44-e36dcd57cf46"; // My New Video Lesson
  
  try {
    const response = await axios.post("http://localhost:3000/api/progress", {
      videoId: videoId,
      completed: true
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log("Response:", response.status, response.data);
  } catch (error: any) {
    if (error.response) {
      console.error("Error Response:", error.response.status, error.response.data);
    } else {
      console.error("Error:", error.message);
    }
  }
}

main();
