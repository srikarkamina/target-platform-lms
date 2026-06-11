"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

interface Student {
  id: string;
  name: string;
  email: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [editingId, setEditingId] =
    useState<string | null>(null);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/students");
      setStudents(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const addOrUpdateStudent = async () => {
    try {
      if (editingId) {
        await api.put(`/students/${editingId}`, {
          name,
          email,
        });

        setEditingId(null);
      } else {
        await api.post("/students", {
          name,
          email,
        });
      }

      setName("");
      setEmail("");

      fetchStudents();
    } catch (error) {
      console.error(error);
      alert("Operation failed");
    }
  };

  const deleteStudent = async (id: string) => {
    try {
      await api.delete(`/students/${id}`);
      fetchStudents();
    } catch (error) {
      console.error(error);
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
    <div>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="flex-1 p-6">
          <h1 className="mb-6 text-3xl font-bold">
            Students
          </h1>

          <div className="mb-8 space-y-3">
            <input
              className="w-full border p-2"
              placeholder="Student Name"
              value={name}
              onChange={(e) =>
                setName(e.target.value)
              }
            />

            <input
              className="w-full border p-2"
              placeholder="Student Email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
            />

            <button
              onClick={addOrUpdateStudent}
              className="bg-green-500 px-4 py-2 text-white"
            >
              {editingId
                ? "Update Student"
                : "Add Student"}
            </button>
          </div>

          <table className="w-full border">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left">
                  Name
                </th>

                <th className="p-3 text-left">
                  Email
                </th>

                <th className="p-3">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr
                  key={student.id}
                  className="border-b"
                >
                  <td className="p-3">
                    {student.name}
                  </td>

                  <td className="p-3">
                    {student.email}
                  </td>

                  <td className="space-x-2 p-3">
                    <button
                      onClick={() =>
                        editStudent(student)
                      }
                      className="bg-blue-500 px-3 py-1 text-white"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() =>
                        deleteStudent(student.id)
                      }
                      className="bg-red-500 px-3 py-1 text-white"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}