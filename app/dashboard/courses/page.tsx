"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => setCourses(data));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Courses</h1>

        <Link
          href="/dashboard/courses/new"
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Add Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <p>No courses found.</p>
      ) : (
        <div className="space-y-4">
          {courses.map((course: any) => (
            <div
              key={course.id}
              className="border rounded p-4 shadow-sm"
            >
              <h3 className="text-lg font-semibold">
                {course.title}
              </h3>

              <p className="text-gray-600 mb-3">
                {course.description}
              </p>

              <Link
                href={`/dashboard/courses/${course.id}`}
                className="bg-yellow-500 text-white px-3 py-1 rounded"
              >
                Edit
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}