const fs = require("fs");
const path = require("path");

const files = [
  "app/dashboard/courses/new/page.tsx",
  "app/dashboard/courses/[id]/page.tsx",
  "app/dashboard/materials/page.tsx",
  "app/dashboard/videos/page.tsx",
  "app/dashboard/videos/[id]/edit/page.tsx",
  "app/dashboard/videos/create/page.tsx",
  "app/dashboard/students/page.tsx",
  "app/dashboard/assignments/page.tsx",
  "app/dashboard/assignments/[id]/page.tsx",
  "app/dashboard/submissions/page.tsx",
  "app/dashboard/quizzes/page.tsx",
  "app/dashboard/quizzes/create/page.tsx",
  "app/dashboard/quizzes/[id]/edit/page.tsx",
  "app/dashboard/certificate-templates/page.tsx",
  "app/dashboard/certificates/page.tsx",
  "app/dashboard/notifications/page.tsx",
  "app/dashboard/reports/page.tsx",
  "app/dashboard/admin/reports/page.tsx",
  "app/dashboard/student/quizzes/page.tsx",
  "app/dashboard/student/quizzes/[id]/page.tsx",
  "app/dashboard/student/quizzes/[id]/result/page.tsx",
  "app/dashboard/student/submissions/page.tsx",
  "app/dashboard/student/submissions/[id]/page.tsx",
  "app/dashboard/student/reports/page.tsx"
];

const basePath = "d:/target/target_platform";

files.forEach(file => {
  const filePath = path.join(basePath, file);
  if (!fs.existsSync(filePath)) {
    console.error(`File does not exist: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // 1. Replace imports
  content = content.replace(
    /import Navbar from ["']@\/components\/Navbar["'];?\r?\nimport Sidebar from ["']@\/components\/Sidebar["'];?/g,
    'import DashboardLayout from "@/components/layout/DashboardLayout";\nimport DashboardPageContainer from "@/components/layout/DashboardPageContainer";'
  );
  content = content.replace(
    /import Sidebar from ["']@\/components\/Sidebar["'];?\r?\nimport Navbar from ["']@\/components\/Navbar["'];?/g,
    'import DashboardLayout from "@/components/layout/DashboardLayout";\nimport DashboardPageContainer from "@/components/layout/DashboardPageContainer";'
  );

  // 2. Identify custom max-widths
  let maxWidthAttr = "";
  if (file.includes("edit/page.tsx") || file.includes("create/page.tsx") || file.includes("result/page.tsx")) {
    maxWidthAttr = ' maxWidth="max-w-4xl"';
  }

  // 3. Replace open container structure
  // Matches <div className="min-h-screen...
  // down to <main className="..." or similar
  const openRegex = /<div className=["']min-h-screen[\s\S]*?<main[\s\S]*?>/g;
  content = content.replace(openRegex, `<DashboardLayout>\n      <DashboardPageContainer${maxWidthAttr}>`);

  // 4. Replace closing container structure
  // Matches </main>\r?\n\s*<\/div>\r?\n\s*<\/div>/
  const closeRegex = /<\/main>\r?\n\s*<\/div>\r?\n\s*<\/div>/g;
  content = content.replace(closeRegex, "</DashboardPageContainer>\n    </DashboardLayout>");

  fs.writeFileSync(filePath, content, "utf8");
  console.log(`Refactored layout in: ${file}`);
});

console.log("Refactoring complete.");
