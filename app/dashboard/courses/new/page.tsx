"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewCoursePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [courseCode, setCourseCode] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/courses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title,
        description,
        courseCode,
        instituteId: "99c501ce-88ac-4611-92b3-17e7fea8374a",
      }),
    });

    if (res.ok) {
      alert("Course created successfully");
      router.push("/dashboard/courses");
    } else {
      const error = await res.json();
      console.log(error);
      alert("Failed to create course");
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">
        Create Course
      </h1>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-lg"
      >
        <div>
          <label className="block mb-2">
            Course Title
          </label>

          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-2">
            Course Code
          </label>

          <input
            type="text"
            value={courseCode}
            onChange={(e) => setCourseCode(e.target.value)}
            className="w-full border p-2 rounded"
            placeholder="JAVA102"
            required
          />
        </div>

        <div>
          <label className="block mb-2">
            Description
          </label>

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border p-2 rounded"
            rows={4}
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          Create Course
        </button>
      </form>
    </div>
  );
}