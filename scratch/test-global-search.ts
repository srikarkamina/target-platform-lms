import "dotenv/config";
import { prisma } from "../lib/prisma";
import { SearchService } from "../lib/search/search-service";
import { AuthorizedUser } from "../lib/authorization";
import { validateSearchParams } from "../lib/validations/search";
import { getEntityLink } from "../components/search/SearchResultItem";

async function runTests() {
  console.log("=========================================================");
  console.log("      RUNNING GLOBAL SEARCH BACKEND AUDIT TESTS          ");
  console.log("=========================================================\n");

  const searchService = SearchService.getInstance();

  // 1. Fetch target test users from the database representing different roles & institutes
  const superAdmin = await prisma.user.findFirst({
    where: { role: "SUPER_ADMIN", deletedAt: null },
    select: { id: true, email: true, role: true, instituteId: true }
  });

  const admins = await prisma.user.findMany({
    where: { role: "ADMIN", deletedAt: null },
    select: { id: true, email: true, role: true, instituteId: true },
    take: 2
  });

  const faculty = await prisma.user.findFirst({
    where: { role: "FACULTY", deletedAt: null },
    select: { id: true, email: true, role: true, instituteId: true }
  });

  const student = await prisma.user.findFirst({
    where: { role: "STUDENT", deletedAt: null },
    select: { id: true, email: true, role: true, instituteId: true }
  });

  console.log("Test Users Resolved:");
  console.log(`- Super Admin:  ${superAdmin?.email || "None"}`);
  console.log(`- Admin 1:      ${admins[0]?.email || "None"} (Institute: ${admins[0]?.instituteId || "None"})`);
  console.log(`- Admin 2:      ${admins[1]?.email || "None"} (Institute: ${admins[1]?.instituteId || "None"})`);
  console.log(`- Faculty:      ${faculty?.email || "None"} (Institute: ${faculty?.instituteId || "None"})`);
  console.log(`- Student:      ${student?.email || "None"} (Institute: ${student?.instituteId || "None"})\n`);

  if (!superAdmin || admins.length < 1 || !faculty || !student) {
    throw new Error("Missing test users in the database to run full search matrix.");
  }

  const userSuperAdmin: AuthorizedUser = { ...superAdmin, role: "SUPER_ADMIN" };
  const userAdmin1: AuthorizedUser = { ...admins[0], role: "ADMIN" };
  const userFaculty: AuthorizedUser = { ...faculty, role: "FACULTY" };
  const userStudent: AuthorizedUser = { ...student, role: "STUDENT" };

  let passCount = 0;
  let failCount = 0;

  function assert(condition: boolean, testName: string, failureDetails?: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passCount++;
    } else {
      console.log(`❌ [FAIL] ${testName}`);
      if (failureDetails) console.log(`   └> Reason: ${failureDetails}`);
      failCount++;
    }
  }

  // ----------------------------------------------------
  // TEST 1: Validation Rules Validation
  // ----------------------------------------------------
  console.log("--- TEST 1: Input Validation ---");
  const val1 = validateSearchParams({ q: "" });
  assert(!val1.success, "Reject empty search query string", val1.success ? "Should fail" : val1.error);

  const val2 = validateSearchParams({ q: "cloud", page: "0" });
  assert(!val2.success, "Reject invalid page numbers (0)", val2.success ? "Should fail" : val2.error);

  const val3 = validateSearchParams({ q: "cloud", limit: "150" });
  assert(!val3.success, "Reject excessive result limit (150)", val3.success ? "Should fail" : val3.error);

  const val4 = validateSearchParams({ q: "cloud", type: "invalid_type" });
  assert(!val4.success, "Reject unknown searchable type parameter", val4.success ? "Should fail" : val4.error);

  const val5 = validateSearchParams({ q: "cloud", type: "courses", page: "2", limit: "15" });
  assert(val5.success, "Accept valid queries and standard pagination configuration");

  // ----------------------------------------------------
  // TEST 2: Tenant Isolation
  // ----------------------------------------------------
  console.log("\n--- TEST 2: Tenant Isolation ---");
  // Let's create a test course in Institute 1 (if not exists) and a test course in Institute 2
  // We can search for all courses using Super Admin and verify they belong to multiple institutes
  const superAdminSearch = await searchService.search({ q: "a", page: 1, limit: 10 }, userSuperAdmin);
  const coursesGlobal = superAdminSearch.data.courses || [];
  
  const admin1Search = await searchService.search({ q: "a", page: 1, limit: 10 }, userAdmin1);
  const coursesAdmin1 = admin1Search.data.courses || [];

  const crossTenantCourses = coursesAdmin1.filter(c => c.instituteId !== userAdmin1.instituteId);
  assert(crossTenantCourses.length === 0, "Admin search does not leak records from other institutes", `Found ${crossTenantCourses.length} leaking courses.`);

  // ----------------------------------------------------
  // TEST 3: Student Restrictions
  // ----------------------------------------------------
  console.log("\n--- TEST 3: Student Enrolled Courses Only ---");
  const studentSearch = await searchService.search({ q: "a", page: 1, limit: 10 }, userStudent);
  const studentCourses = studentSearch.data.courses || [];

  // Verify that for all courses returned, the student has a valid enrollment
  let enrollmentsValid = true;
  for (const c of studentCourses) {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: userStudent.id,
        batch: { courseId: c.id, deletedAt: null }
      }
    });
    if (!enrollment) {
      enrollmentsValid = false;
      break;
    }
  }
  assert(enrollmentsValid, "Students can only search and discover courses they are enrolled in");

  // ----------------------------------------------------
  // TEST 4: Faculty Restrictions
  // ----------------------------------------------------
  console.log("\n--- TEST 4: Faculty Assigned Courses Only ---");
  const facultySearch = await searchService.search({ q: "a", page: 1, limit: 10 }, userFaculty);
  const facultyCourses = facultySearch.data.courses || [];

  const unassignedCourses = facultyCourses.filter(c => c.facultyId !== userFaculty.id);
  assert(unassignedCourses.length === 0, "Faculty can only search and discover courses taught by them", `Discovered ${unassignedCourses.length} unassigned courses.`);

  // ----------------------------------------------------
  // TEST 5: Reports Access Control
  // ----------------------------------------------------
  console.log("\n--- TEST 5: Reports Module Restrictions ---");
  // Admin search for reports should run successfully
  assert(admin1Search.data.reports !== undefined, "Admin search yields reports data module");
  
  // Student search for reports must be completely empty
  assert((studentSearch.data.reports || []).length === 0, "Students are prohibited from receiving report results");

  // Faculty search for reports must be completely empty
  assert((facultySearch.data.reports || []).length === 0, "Faculty are prohibited from receiving report results");

  // ----------------------------------------------------
  // TEST 6: Notifications Scope
  // ----------------------------------------------------
  console.log("\n--- TEST 6: Notifications Personal Boundaries ---");
  const studentNotifications = studentSearch.data.notifications || [];
  const foreignNotifications = studentNotifications.filter(n => n.userId !== userStudent.id);
  assert(foreignNotifications.length === 0, "Students can only search notifications addressed to their user account");

  // ----------------------------------------------------
  // TEST 7: Single Module Search (Type parameter)
  // ----------------------------------------------------
  console.log("\n--- TEST 7: Specific Module Filtering ---");
  const typeSearch = await searchService.search({ q: "a", page: 1, limit: 5, type: "courses" }, userAdmin1);
  assert(Object.keys(typeSearch.data).length === 1 && typeSearch.data.courses !== undefined, "Search filtered with type='courses' only returns course module data");
  assert(typeSearch.pagination !== undefined && !Array.isArray(typeSearch.pagination), "Returns direct paginated metadata object for single type searches");

  // ----------------------------------------------------
  // TEST 8: Navigation Link Generators
  // ----------------------------------------------------
  console.log("\n--- TEST 8: Navigation Route Resolution ---");
  
  // Test course link for student
  if (studentCourses.length > 0) {
    const link = getEntityLink(studentCourses[0], "courses", "STUDENT");
    assert(link.includes("/learn"), "Student course navigation routes to course learn player", `Got path: ${link}`);
  } else {
    console.log("⚠️ [SKIP] Student course link test (no enrolled courses returned)");
  }

  // Test course link for admin
  if (coursesAdmin1.length > 0) {
    const link = getEntityLink(coursesAdmin1[0], "courses", "ADMIN");
    assert(!link.includes("/learn") && link.includes("/courses/"), "Admin course navigation routes to details/management page", `Got path: ${link}`);
  } else {
    console.log("⚠️ [SKIP] Admin course link test (no courses returned)");
  }

  // Test video watch link for student
  const studentVideos = studentSearch.data.videos || [];
  if (studentVideos.length > 0) {
    const link = getEntityLink(studentVideos[0], "videos", "STUDENT");
    assert(link.includes("/learn/videos/"), "Student video navigation routes directly to watch player page", `Got path: ${link}`);
  } else {
    console.log("⚠️ [SKIP] Student video watch link test (no videos returned)");
  }

  // Test assignment link
  const studentAssignments = studentSearch.data.assignments || [];
  if (studentAssignments.length > 0) {
    const link = getEntityLink(studentAssignments[0], "assignments", "STUDENT");
    assert(link.includes("/assignments/"), "Assignment navigation routes directly to assignment details page", `Got path: ${link}`);
  } else {
    console.log("⚠️ [SKIP] Assignment link test (no assignments returned)");
  }

  console.log("\n=========================================================");
  console.log(`TEST RUN COMPLETED. Passed: ${passCount}, Failed: ${failCount}`);
  console.log("=========================================================");

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests()
  .catch(err => {
    console.error("Test execution failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
