"use client";

import {
  Users,
  GraduationCap,
  BookOpen,
  Play,
  FileQuestion,
  FileText,
  ClipboardList,
  Award,
  BarChart3,
  TrendingUp,
  Landmark,
  ShieldCheck,
} from "lucide-react";
import FeatureCard from "./FeatureCard";

export default function FeatureGrid() {
  const features = [
    {
      icon: Users,
      title: "Student Management",
      description: "Manage student profiles, batches, course enrollments, and academic progress seamlessly.",
    },
    {
      icon: GraduationCap,
      title: "Faculty Portal",
      description: "Empower teachers to manage syllabus uploads, answer doubts, and grade student attempts.",
    },
    {
      icon: BookOpen,
      title: "Online Courses",
      description: "Organize educational content, downloadables, and structured modules sequentially.",
    },
    {
      icon: Play,
      title: "Video Learning",
      description: "Interactive video tracking with automated progress logging to ensure student completion.",
    },
    {
      icon: FileQuestion,
      title: "Mock Tests & Quizzes",
      description: "Create timed online exams with instant scoring, passing marks, and detailed explanations.",
    },
    {
      icon: FileText,
      title: "Assignments",
      description: "Distribute homework, collect file uploads, provide custom feedback, and track deadlines.",
    },
    {
      icon: ClipboardList,
      title: "Attendance & Logs",
      description: "Trace log records, user activities, and active student learning engagement metrics.",
    },
    {
      icon: Award,
      title: "Auto Certificates",
      description: "Design custom templates and issue automatically generated completion credentials.",
    },
    {
      icon: BarChart3,
      title: "Detailed Reports",
      description: "Generate instant PDF/CSV reports for progress audits, enrollment rates, and grades.",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Visual charts for administrators tracking platform resource utilization and storage.",
    },
    {
      icon: Landmark,
      title: "Multi-Institute Support",
      description: "Multi-tenant cloud architecture supporting isolated dashboards for different coaching brands.",
    },
    {
      icon: ShieldCheck,
      title: "Role Based Access",
      description: "Strict isolation between Super Admins, Institute Admins, Faculty, and Student users.",
    },
  ];

  return (
    <section id="features" className="py-12 scroll-mt-20">
      <div className="text-left mb-10">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white sm:text-2xl tracking-tight">
          Everything Your Institute Needs In One Platform
        </h2>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
          Target LMS simplifies administrative, teaching, and learning workflows so you can focus on academic success.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <FeatureCard
            key={feature.title}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
          />
        ))}
      </div>
    </section>
  );
}
