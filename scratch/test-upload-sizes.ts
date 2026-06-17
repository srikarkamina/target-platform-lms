import { generateToken } from "../lib/auth";
import { prisma } from "../lib/prisma";
import axios from "axios";
import fs from "fs";
import path from "path";
import FormData from "form-data";

const STUDENT_ID = "54061540-9d67-4a23-9b33-51c9ec106fe3"; // Valid Super Admin ID in DB to avoid FK errors
const ASSIGNMENT_ID = "cmqijdhqg0001dydo37ry33t0"; // Valid Assignment ID

// Helper to create a dummy file on disk chunk by chunk to avoid out of memory errors
async function createDummyFile(filePath: string, sizeInMb: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const stream = fs.createWriteStream(filePath);
    const chunk = Buffer.alloc(1024 * 1024); // 1MB buffer of zeros
    
    let written = 0;
    function write() {
      let ok = true;
      while (written < sizeInMb && ok) {
        ok = stream.write(chunk);
        written++;
      }
      if (written < sizeInMb) {
        stream.once("drain", write);
      } else {
        stream.end();
      }
    }
    
    stream.on("finish", () => resolve());
    stream.on("error", (err) => reject(err));
    write();
  });
}

async function testUpload(sizeInMb: number, token: string): Promise<{ success: boolean; fileUrl?: string; fileName?: string; fileSize?: number; mimeType?: string }> {
  const fileName = `test-upload-${sizeInMb}MB.zip`;
  const filePath = path.join(__dirname, fileName);
  
  console.log(`\n--- Testing ${sizeInMb}MB Upload ---`);
  console.log(`[TEST] Creating dummy file of size ${sizeInMb}MB at ${filePath}...`);
  await createDummyFile(filePath, sizeInMb);
  console.log(`[TEST] File created successfully. Size: ${fs.statSync(filePath).size} bytes`);
  
  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), {
    filename: fileName,
    contentType: "application/zip",
  });
  
  try {
    console.log(`[TEST] Uploading file to http://localhost:3000/api/upload/assignment...`);
    const response = await axios.post("http://localhost:3000/api/upload/assignment", form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Bearer ${token}`,
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log(`[TEST] Upload response status: ${response.status}`);
    console.log("[TEST] Upload response body:", response.data);
    
    // Cleanup local test file
    fs.unlinkSync(filePath);
    
    return {
      success: true,
      fileUrl: response.data.url,
      fileName: response.data.fileName,
      fileSize: response.data.fileSize,
      mimeType: response.data.mimeType,
    };
  } catch (error: any) {
    if (error.response) {
      console.log(`[TEST] Upload failed with status ${error.response.status}:`, error.response.data);
    } else {
      console.log("[TEST] Upload failed with error:", error.message);
    }
    
    // Cleanup local test file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    return { success: false };
  }
}

async function testSubmission(uploadData: any, token: string) {
  console.log("[TEST] Creating submission record in database...");
  const payload = {
    assignmentId: ASSIGNMENT_ID,
    fileUrl: uploadData.fileUrl,
    fileName: uploadData.fileName,
    mimeType: uploadData.mimeType,
    fileSize: uploadData.fileSize,
    studentId: STUDENT_ID,
  };
  
  try {
    const response = await axios.post("http://localhost:3000/api/submissions", payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`[TEST] Submission endpoint status: ${response.status}`);
    console.log("[TEST] Submission endpoint response:", response.data);
    
    // Check in database using Prisma
    const dbRecord = await prisma.submission.findFirst({
      where: {
        id: response.data.id,
      },
    });
    
    if (dbRecord) {
      console.log(`[TEST] VERIFICATION SUCCESS: Submission found in DB with ID: ${dbRecord.id}`);
      
      // Clean up database record
      await prisma.submission.delete({
        where: { id: dbRecord.id },
      });
      console.log(`[TEST] Cleaned up submission from DB.`);
      
      // Clean up uploaded file from local uploads directory
      const uploadedLocalPath = path.join(process.cwd(), "public", uploadData.fileUrl);
      if (fs.existsSync(uploadedLocalPath)) {
        fs.unlinkSync(uploadedLocalPath);
        console.log(`[TEST] Cleaned up uploaded file from public directory: ${uploadedLocalPath}`);
      }
      return true;
    } else {
      console.error("[TEST] VERIFICATION FAILED: Submission was NOT found in DB!");
      return false;
    }
  } catch (error: any) {
    if (error.response) {
      console.error("[TEST] Submission endpoint failed status:", error.response.status, error.response.data);
    } else {
      console.error("[TEST] Submission failed error:", error.message);
    }
    return false;
  }
}

async function main() {
  const token = generateToken({
    id: STUDENT_ID,
    email: "admin@target.com",
    role: "SUPER_ADMIN",
    instituteId: "42d111c0-97aa-4f29-85bf-ca3b0df00d46",
  });
  
  console.log("Starting assignment file upload and size limit tests...");
  
  const results = {
    "10MB": false,
    "50MB": false,
    "150MB": false,
    "300MB": false,
    "310MB_reject": false,
  };
  
  // 1. Test 10MB
  const upload10 = await testUpload(10, token);
  if (upload10.success) {
    results["10MB"] = await testSubmission(upload10, token);
  }
  
  // 2. Test 50MB
  const upload50 = await testUpload(50, token);
  if (upload50.success) {
    results["50MB"] = await testSubmission(upload50, token);
  }
  
  // 3. Test 150MB
  const upload150 = await testUpload(150, token);
  if (upload150.success) {
    results["150MB"] = await testSubmission(upload150, token);
  }
  
  // 4. Test 300MB
  const upload300 = await testUpload(300, token);
  if (upload300.success) {
    results["300MB"] = await testSubmission(upload300, token);
  }
  
  // 5. Test 310MB (Should be rejected)
  const upload310 = await testUpload(310, token);
  if (!upload310.success) {
    console.log("[TEST] VERIFICATION SUCCESS: 310MB file was rejected as expected.");
    results["310MB_reject"] = true;
  } else {
    console.error("[TEST] VERIFICATION FAILED: 310MB file was ACCEPTED! It should have been rejected.");
    // Cleanup
    const uploadedLocalPath = path.join(process.cwd(), "public", upload310.fileUrl!);
    if (fs.existsSync(uploadedLocalPath)) {
      fs.unlinkSync(uploadedLocalPath);
    }
  }
  
  console.log("\n================ TEST SUMMARY ================");
  console.log(JSON.stringify(results, null, 2));
  console.log("==============================================");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
