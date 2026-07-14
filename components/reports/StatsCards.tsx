import React from "react";
import AdminStatsCard from "./AdminStatsCard";
import { Users, Users2, BookOpen, GraduationCap, Medal, Award, ClipboardList, CheckSquare } from "lucide-react";

interface Statistics {
  totalStudents: number;
  totalFaculty: number;
  totalCourses: number;
  totalEnrollments: number;
  totalCertificates: number;
  activeCertificates: number;
  revokedCertificates: number;
  totalQuizAttempts: number;
  averageQuizScore: number;
  // Faculty specific
  assignedCourses?: number;
  assignments?: number;
  pendingAssignments?: number;
  completedAssignments?: number;
  certificatesIssued?: number;
}

interface StatsCardsProps {
  statistics: Statistics;
  role?: string;
}

export default function StatsCards({ statistics, role }: StatsCardsProps) {
  const isFaculty = role === "FACULTY";

  if (isFaculty) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <AdminStatsCard
          title="Total Students"
          value={statistics.totalStudents}
          icon={Users}
          color="blue"
        />
        <AdminStatsCard
          title="Assigned Courses"
          value={statistics.assignedCourses ?? statistics.totalCourses}
          icon={BookOpen}
          color="indigo"
        />
        <AdminStatsCard
          title="Assignments"
          value={statistics.assignments ?? 0}
          icon={ClipboardList}
          color="violet"
        />
        <AdminStatsCard
          title="Quiz Attempts"
          value={statistics.totalQuizAttempts}
          icon={Award}
          color="rose"
        />
        <AdminStatsCard
          title="Average Quiz Score"
          value={`${statistics.averageQuizScore}%`}
          icon={Award}
          color="emerald"
        />
        <AdminStatsCard
          title="Certificates Issued"
          value={statistics.certificatesIssued ?? statistics.totalCertificates}
          icon={Medal}
          color="orange"
        />
        <AdminStatsCard
          title="Pending Submissions"
          value={statistics.pendingAssignments ?? 0}
          icon={Users2}
          color="orange"
        />
        <AdminStatsCard
          title="Completed Submissions"
          value={statistics.completedAssignments ?? 0}
          icon={CheckSquare}
          color="emerald"
        />
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6`}>
      <AdminStatsCard
        title="Total Students"
        value={statistics.totalStudents}
        icon={Users}
        color="blue"
      />
      <AdminStatsCard
        title="Total Faculty"
        value={statistics.totalFaculty}
        icon={Users2}
        color="violet"
      />
      <AdminStatsCard
        title="Total Courses"
        value={statistics.totalCourses}
        icon={BookOpen}
        color="indigo"
      />
      <AdminStatsCard
        title="Total Enrollments"
        value={statistics.totalEnrollments}
        icon={GraduationCap}
        color="orange"
      />
      <AdminStatsCard
        title="Total Certificates"
        value={statistics.totalCertificates}
        icon={Medal}
        color="emerald"
        subMetrics={[
          { label: "Active", value: statistics.activeCertificates },
          { label: "Revoked", value: statistics.revokedCertificates },
        ]}
      />
      <AdminStatsCard
        title="Quiz Average"
        value={`${statistics.averageQuizScore}%`}
        icon={Award}
        color="rose"
        subMetrics={[
          { label: "Total Attempts", value: statistics.totalQuizAttempts },
        ]}
      />
    </div>
  );
}
