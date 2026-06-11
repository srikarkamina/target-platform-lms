"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      console.log("Login clicked");

      const res = await api.post("/auth/login", {
        email,
        password,
      });

      console.log("API Response:", res.data);

      localStorage.setItem("token", res.data.token);

      console.log("Token stored successfully");

      router.push("/dashboard");
    } catch (error) {
      console.error("Login Error:", error);
      alert("Invalid credentials");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-96 rounded-lg border p-6">
        <h1 className="mb-4 text-2xl font-bold">
          Login
        </h1>

        <input
          type="email"
          className="mb-3 w-full border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="mb-3 w-full border p-2"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="button"
          onClick={handleLogin}
          className="w-full bg-black p-2 text-white"
        >
          Login
        </button>
      </div>
    </div>
  );
}