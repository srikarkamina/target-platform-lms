import Link from "next/link";

export default function Sidebar() {
  return (
    <div className="h-screen w-64 border-r p-4">
      <ul className="space-y-4">
        <li>
          <Link href="/dashboard">Dashboard</Link>
        </li>

        <li>
          <Link href="/dashboard/students">
            Students
          </Link>
        </li>

        <li>
          <Link href="/dashboard/courses">
            Courses
          </Link>
        </li>

        <li>
          <Link href="/dashboard/videos">Videos</Link>
        </li>

        <li>
          <Link href="/dashboard/materials">
            Materials
          </Link>
        </li>
      </ul>
    </div>
  );
}