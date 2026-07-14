"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/axios";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DashboardPageContainer from "@/components/layout/DashboardPageContainer";
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
    <DashboardLayout>
      <DashboardPageContainer>
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
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              {/* Desktop Table View */}
              <div className="overflow-x-auto hidden md:block">
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

              {/* Mobile Stacked Card View */}
              <div className="block md:hidden divide-y divide-slate-100 bg-white">
                {materials.map((material) => (
                  <div key={material.id} className="p-5 space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 text-sm truncate">{material.title}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">Sequence Order: {material.sortOrder}</p>
                      </div>
                      <span className={`shrink-0 rounded-lg px-2 py-1 text-[10px] uppercase font-bold tracking-wider ${
                        MATERIAL_TYPE_COLORS[material.materialType] || MATERIAL_TYPE_COLORS.OTHER
                      }`}>
                        {material.materialType}
                      </span>
                    </div>

                    {material.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {material.description}
                      </p>
                    )}

                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-100 text-xs">
                      <div className="space-y-1 col-span-2">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Academic Course</p>
                        <Link href={`/dashboard/courses/${material.courseId}`} className="font-bold text-indigo-650 hover:underline leading-tight block truncate">
                          {material.course.title}
                        </Link>
                      </div>
                      <div className="space-y-1 col-span-2">
                        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Attachment Link</p>
                        <a
                          href={material.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 text-xs font-bold"
                        >
                          Open Study Material ↗
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/dashboard/courses/${material.courseId}`}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 py-2.5 text-xs font-bold text-slate-700 shadow-xs transition-colors"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        <span>Edit</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(material.courseId, material.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DashboardPageContainer>
    </DashboardLayout>
  );
}
