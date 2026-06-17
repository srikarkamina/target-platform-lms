import "dotenv/config";
import axios from "axios";

const API_BASE_URL = "http://localhost:3000/api";

async function main() {
  console.log("1. Authenticating as Super Admin...");
  const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
    email: "admin@target.com",
    password: "123456"
  });

  const token = loginRes.data.token;
  console.log("Token retrieved successfully.");

  console.log("2. Creating course...");
  const createRes = await axios.post(
    `${API_BASE_URL}/courses`,
    {
      title: "Full Stack Development",
      courseCode: "FSD101",
      description: "Test Course"
    },
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Course created. Response Status:", createRes.status);
  console.log("Response Data:", createRes.data);

  if (createRes.status === 201) {
    console.log("=== COURSE CREATION VERIFIED SUCCESSFULLY ===");
  } else {
    console.error("Course creation failed with status:", createRes.status);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Course verification script failed:", err.message);
  if (err.response) {
    console.error("Response data:", err.response.data);
  }
  process.exit(1);
});
