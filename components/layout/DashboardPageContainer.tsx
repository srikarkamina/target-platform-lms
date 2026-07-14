"use client";

import React from "react";

interface DashboardPageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: string;
}

export default function DashboardPageContainer({
  children,
  className = "",
  maxWidth = "max-w-7xl"
}: DashboardPageContainerProps) {
  return (
    <main className={`flex-1 p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8 font-sans w-full mx-auto ${maxWidth} ${className}`}>
      {children}
    </main>
  );
}
