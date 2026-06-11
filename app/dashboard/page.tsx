"use client";

import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export default function Dashboard() {
  return (
    <div>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <div className="p-6">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <p className="mt-4">
            Welcome to TARGET Platform 🚀
          </p>
        </div>
      </div>
    </div>
  );
}