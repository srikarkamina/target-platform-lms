// Use global fetch (Node 18+)

async function main() {
  console.log("Triggering local Google Callback API...");
  try {
    const res = await fetch("http://localhost:3000/api/auth/google/callback?error=access_denied&error_description=Google+Sign-In+is+not+configured+for+this+tenant.+Please+sign+in+with+your+email+and+password.", {
      redirect: "manual",
    });
    console.log("Response status:", res.status);
    console.log("Redirect location header:", res.headers.get("location"));
  } catch (err) {
    console.error("Error triggering callback:", err);
  }
}

main();
