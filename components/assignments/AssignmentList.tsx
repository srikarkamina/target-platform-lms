"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/axios";
import AssignmentCard from "./AssignmentCard";
import AssignmentForm from "./AssignmentForm";
import toast from "react-hot-toast";
import { Plus, ClipboardList, Loader2, AlertTriangle } from "lucide-react";

interface Assignment {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | Date | null;
  courseId: string;
  createdAt: string;
  course: {
    id: string;
    title: string;
    courseCode: string;
  };
}

interface Course {
  id: string;
  title: string;
  courseCode: string;
}

interface AssignmentListProps {
  courseId?: string;
}

export default function AssignmentList({ courseId }: AssignmentListProps) {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string>("STUDENT");

  // Modal States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);

  // Dependency-free client-side JWT parser to determine roles
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = parseJwt(token);
      if (payload && payload.role) {
        setTimeout(() => {
          setUserRole(payload.role);
        }, 0);
      }
    }
  }, []);

  const isManagementRole = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || userRole === "FACULTY";

  const fetchAssignments = async () => {
    try {
      setLoading(true);
      const url = courseId ? `/assignments?courseId=${courseId}` : "/assignments";
      const res = await api.get(url);
      setAssignments(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load assignments:", err);
      toast.error("Failed to load assignments. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    if (courseId) {
      // If course is fixed, we don't need a list of all courses
      setCourses([{ id: courseId, title: "Current Course", courseCode: "" }]);
      return;
    }
    try {
      const res = await api.get("/courses");
      setCourses(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load courses:", err);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      fetchAssignments();
      fetchCourses();
    }, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Handle CRUD operations
  const handleCreate = async (data: {
    title: string;
    description: string | null;
    dueDate: Date | null;
    courseId: string;
  }) => {
    try {
      setSaving(true);
      await api.post("/assignments", data);
      toast.success("Assignment created successfully!");
      setIsCreateOpen(false);
      fetchAssignments();
    } catch (err) {
      console.error("Failed to create assignment:", err);
      toast.error("Failed to create assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async (data: {
    title: string;
    description: string | null;
    dueDate: Date | null;
    courseId: string;
  }) => {
    if (!selectedAssignment) return;
    try {
      setSaving(true);
      await api.put(`/assignments/${selectedAssignment.id}`, data);
      toast.success("Assignment updated successfully!");
      setIsEditOpen(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      console.error("Failed to update assignment:", err);
      toast.error("Failed to update assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment) return;
    try {
      setSaving(true);
      await api.delete(`/assignments/${selectedAssignment.id}`);
      toast.success("Assignment deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedAssignment(null);
      fetchAssignments();
    } catch (err) {
      console.error("Failed to delete assignment:", err);
      toast.error("Failed to delete assignment.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with Create Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">
          Assignments ({assignments.length})
        </h2>

        {isManagementRole && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-extrabold text-white shadow hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Create Assignment</span>
          </button>
        )}
      </div>

      {/* Skeletons Loading State */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="bg-white rounded-2xl border border-slate-150 p-6 flex flex-col space-y-4 animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="h-5 w-16 bg-slate-200 rounded-lg"></div>
                <div className="h-5 w-16 bg-slate-200 rounded-full"></div>
              </div>
              <div className="h-6 w-3/4 bg-slate-200 rounded-md"></div>
              <div className="space-y-2 flex-1">
                <div className="h-4 w-full bg-slate-200 rounded-md"></div>
                <div className="h-4 w-5/6 bg-slate-200 rounded-md"></div>
              </div>
              <div className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <div className="h-4 w-28 bg-slate-200 rounded-md"></div>
                <div className="flex gap-2">
                  <div className="h-7 w-7 bg-slate-200 rounded-lg"></div>
                  <div className="h-7 w-7 bg-slate-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        /* Empty State */
        <div className="text-center p-12 bg-white border border-slate-150 rounded-2xl shadow-sm">
          <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No assignments posted</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
            {isManagementRole
              ? "Click 'Create Assignment' to start posting curriculum tasks."
              : "No coursework assignments have been assigned to you yet."}
          </p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onEdit={(a) => {
                setSelectedAssignment(a);
                setIsEditOpen(true);
              }}
              onDelete={(a) => {
                setSelectedAssignment(a);
                setIsDeleteOpen(true);
              }}
              isManagementRole={isManagementRole}
            />
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Create New Assignment</h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <AssignmentForm
                courses={courses}
                courseIdFixed={courseId}
                onSubmit={handleCreate}
                onCancel={() => setIsCreateOpen(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800">Edit Assignment</h3>
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedAssignment(null);
                }}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>
            <div className="p-6">
              <AssignmentForm
                initialData={selectedAssignment}
                courses={courses}
                courseIdFixed={courseId}
                onSubmit={handleEdit}
                onCancel={() => {
                  setIsEditOpen(false);
                  setSelectedAssignment(null);
                }}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && selectedAssignment && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-800">Delete Assignment</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <span className="font-semibold text-slate-800">&quot;{selectedAssignment.title}&quot;</span>? This action cannot be undone and will delete related student submissions.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsDeleteOpen(false);
                    setSelectedAssignment(null);
                  }}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-extrabold text-white shadow hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
