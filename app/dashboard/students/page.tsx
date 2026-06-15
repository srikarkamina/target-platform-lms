"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { User, Mail, Plus, Edit2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load students.");
    }
  };

  const addOrUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) {
      toast.error("Please fill in all fields.");
      return;
    }
    try {
      setLoading(true);
      if (editingId) {
        await api.put(`/students/${editingId}`, { name, email });
        toast.success("Student updated successfully.");
        setEditingId(null);
      } else {
        await api.post("/students", { name, email });
        toast.success("Student added successfully.");
      }
      setName("");
      setEmail("");
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Operation failed.");
    } finally {
      setLoading(false);
    }
  };

  const deleteStudent = async (id: string) => {
    const confirmed = confirm("Are you sure you want to delete this student?");
    if (!confirmed) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success("Student deleted successfully.");
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete student.");
    }
  };

  const editStudent = (student: Student) => {
    setEditingId(student.id);
    setName(student.name);
    setEmail(student.email);
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-8 space-y-6 font-sans">
          <div className="mb-4">
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Students</h1>
            <p className="text-sm text-slate-500 mt-1">Manage student directory, add new records or update details</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Input Form Panel */}
            <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-800">
                {editingId ? "Update Student Record" : "Add New Student"}
              </h2>

              <form onSubmit={addOrUpdateStudent} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Student Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <User className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                      placeholder="e.g. John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Student Email
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Mail className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="email"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-xs"
                      placeholder="e.g. john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-60"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{editingId ? "Update Record" : "Add Record"}</span>
                  </button>
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setName("");
                        setEmail("");
                      }}
                      className="rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2.5 text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List Table Panel */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-150">
                <h3 className="text-sm font-bold text-slate-800">Student Directory ({students.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-150">
                    <tr>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Name</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500">Email</th>
                      <th className="px-6 py-3.5 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 bg-white">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">
                          No students in the directory.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">{student.name}</td>
                          <td className="px-6 py-4 font-medium text-slate-500 font-mono text-xs">{student.email}</td>
                          <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                            <button
                              onClick={() => editStudent(student)}
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 text-xs font-bold text-slate-700 shadow-xs transition-colors cursor-pointer"
                            >
                              <Edit2 className="h-3 w-3" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => deleteStudent(student.id)}
                              className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1.5 text-xs font-bold text-rose-700 shadow-xs transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3 w-3" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}