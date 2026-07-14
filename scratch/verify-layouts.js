const fs = require("fs");
const path = require("path");

const dashboardDir = "d:/target/target_platform/app/dashboard";

function getPageFiles(dir, files = []) {
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      getPageFiles(filePath, files);
    } else if (file === "page.tsx") {
      files.push(filePath);
    }
  });
  return files;
}

const allPages = getPageFiles(dashboardDir);

const hasLayout = [];
const hasContainer = [];
const missingLayout = [];
const missingContainer = [];

allPages.forEach(p => {
  const relativePath = path.relative("d:/target/target_platform", p).replace(/\\/g, "/");
  const content = fs.readFileSync(p, "utf8");
  
  const usesLayout = content.includes("DashboardLayout");
  const usesContainer = content.includes("DashboardPageContainer");

  if (usesLayout) {
    hasLayout.push(relativePath);
  } else {
    missingLayout.push(relativePath);
  }

  if (usesContainer) {
    hasContainer.push(relativePath);
  } else {
    missingContainer.push(relativePath);
  }
});

console.log("=== VERIFICATION SUMMARY ===");
console.log(`Total dashboard page routes found: ${allPages.length}`);
console.log("\nPages USING DashboardLayout:");
hasLayout.forEach(f => console.log(`  - ${f}`));

console.log("\nPages USING DashboardPageContainer:");
hasContainer.forEach(f => console.log(`  - ${f}`));

console.log("\nPages MISSING DashboardLayout:");
missingLayout.forEach(f => console.log(`  - ${f}`));

console.log("\nPages MISSING DashboardPageContainer:");
missingContainer.forEach(f => console.log(`  - ${f}`));
