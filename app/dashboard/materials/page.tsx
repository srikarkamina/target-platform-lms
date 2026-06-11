"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Material {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string;
  materialType: string;
  sortOrder: number;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

const MATERIAL_TYPE_COLORS: Record<string, string> = {
  PDF: "bg-red-100 text-red-700",
  DOC: "bg-blue-100 text-blue-700",
  DOCX: "bg-blue-100 text-blue-700",
  PPT: "bg-orange-100 text-orange-700",
  PPTX: "bg-orange-100 text-orange-700",
  XLSX: "bg-green-100 text-green-700",
  OTHER: "bg-gray-100 text-gray-700",
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/materials");
      setMaterials(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load materials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (
    courseId: string,
    materialId: string
  ) => {
    const confirmed = confirm(
      "Are you sure you want to delete this material?"
    );

    if (!confirmed) return;

    try {
      await api.delete(
        `/courses/${courseId}/materials/${materialId}`
      );
      fetchMaterials();
    } catch (err) {
      console.error(err);
      alert("Failed to delete material.");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <div>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-3xl font-bold">
              Study Materials
            </h1>

            <p className="text-sm text-gray-500">
              Manage materials from each Course page
            </p>
          </div>

          {loading && (
            <p className="text-gray-500">
              Loading materials...
            </p>
          )}

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-red-700">
              {error}
            </div>
          )}

          {!loading && !error && materials.length === 0 && (
            <div className="rounded border p-8 text-center text-gray-500">
              <p className="text-lg font-medium">
                No materials found.
              </p>
              <p className="mt-2 text-sm">
                Go to a Course page to add study materials.
              </p>
              <Link
                href="/dashboard/courses"
                className="mt-4 inline-block rounded bg-blue-600 px-4 py-2 text-sm text-white"
              >
                Go to Courses
              </Link>
            </div>
          )}

          {!loading && materials.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border text-sm">
                <thead className="bg-gray-50">
                  <tr className="border-b">
                    <th className="p-3 text-left font-semibold">
                      Title
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Type
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Course
                    </th>

                    <th className="p-3 text-left font-semibold">
                      Order
                    </th>

                    <th className="p-3 text-left font-semibold">
                      File URL
                    </th>

                    <th className="p-3 text-center font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {materials.map((material) => (
                    <tr
                      key={material.id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="p-3 font-medium">
                        {material.title}
                      </td>

                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                            MATERIAL_TYPE_COLORS[
                              material.materialType
                            ] || MATERIAL_TYPE_COLORS.OTHER
                          }`}
                        >
                          {material.materialType}
                        </span>
                      </td>

                      <td className="p-3">
                        <Link
                          href={`/dashboard/courses/${material.courseId}`}
                          className="text-blue-600 hover:underline"
                        >
                          {material.course.title}
                        </Link>
                      </td>

                      <td className="p-3 text-gray-600">
                        {material.sortOrder}
                      </td>

                      <td className="max-w-xs p-3">
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate text-blue-600 hover:underline"
                        >
                          {material.fileUrl}
                        </a>
                      </td>

                      <td className="space-x-2 p-3 text-center">
                        <Link
                          href={`/dashboard/courses/${material.courseId}`}
                          className="rounded bg-blue-500 px-3 py-1 text-white"
                        >
                          Edit
                        </Link>

                        <button
                          onClick={() =>
                            handleDelete(
                              material.courseId,
                              material.id
                            )
                          }
                          className="rounded bg-red-500 px-3 py-1 text-white"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
