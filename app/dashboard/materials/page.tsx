"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { FileText, Plus, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

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
  PDF: "bg-rose-50 text-rose-700 border border-rose-200",
  DOC: "bg-blue-50 text-blue-700 border border-blue-200",
  DOCX: "bg-blue-50 text-blue-700 border border-blue-200",
  PPT: "bg-amber-50 text-amber-700 border border-amber-200",
  PPTX: "bg-amber-50 text-amber-700 border border-amber-200",
  XLSX: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  OTHER: "bg-slate-50 text-slate-700 border border-slate-200",
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

  const handleDelete = async (courseId: string, materialId: string) => {
    const confirmed = confirm("Are you sure you want to delete this material?");
    if (!confirmed) return;
    try {
      await api.delete(`/courses/${courseId}/materials/${materialId}`);
      toast.success("Material deleted successfully!");
      fetchMaterials();
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete material.");
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText className="h-8 w-8 text-indigo-600" />
                <span>Study Materials</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Curriculum resources, documents, and reference sheets uploaded across courses
              </p>
            </div>
            <Link
              href="/dashboard/courses"
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow hover:bg-indigo-700 transition-colors cursor-pointer self-start sm:self-auto"
            >
              <Plus className="h-4.5 w-4.5" />
              <span>Upload via Courses</span>
            </Link>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-250 bg-rose-50 p-4 text-sm font-semibold text-rose-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <FileText className="h-8 w-8 text-indigo-500 animate-spin mb-3" />
              <p className="text-sm text-slate-500">Loading materials list...</p>
            </div>
          ) : materials.length === 0 ? (
            <div className="text-center p-12 bg-white border border-slate-200 rounded-2xl shadow-sm">
              <FileText className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <h3 className="text-base font-semibold text-slate-800">No study materials uploaded</h3>
              <p className="text-sm text-slate-550 mt-1 max-w-sm mx-auto">
                Navigate to a specific Course page to add study materials or lecture notes.
              </p>
              <Link
                href="/dashboard/courses"
                className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition-colors"
              >
                Go to Courses
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Title</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Type</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Course</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Sequence</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Download</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {materials.map((material) => (
                      <tr key={material.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{material.title}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-lg px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${
                              MATERIAL_TYPE_COLORS[material.materialType] || MATERIAL_TYPE_COLORS.OTHER
                            }`}
                          >
                            {material.materialType}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-semibold text-indigo-650">
                          <Link href={`/dashboard/courses/${material.courseId}`} className="hover:underline">
                            {material.course.title}
                          </Link>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono font-bold text-slate-500">{material.sortOrder}</td>
                        <td className="px-6 py-4 max-w-xs truncate font-medium">
                          <a
                            href={material.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 text-xs font-bold"
                          >
                            Open Material ↗
                          </a>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                          <Link
                            href={`/dashboard/courses/${material.courseId}`}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                            <span>Edit</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(material.courseId, material.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Delete</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
