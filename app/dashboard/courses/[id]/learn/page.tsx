"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLearn } from "./layout";
import { Play, Loader2 } from "lucide-react";

export default function StudentLearnPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;

  const { videos, loading } = useLearn();

  useEffect(() => {
    if (!loading && videos.length > 0) {
      router.replace(`/dashboard/courses/${courseId}/learn/videos/${videos[0].id}`);
    }
  }, [loading, videos, courseId, router]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Loader2 className="h-8 w-8 text-indigo-650 animate-spin mb-3" />
        <p className="text-sm text-slate-500 font-medium">Entering your learning space...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center min-h-[50vh] bg-slate-50 font-sans">
      <Play className="h-12 w-12 text-slate-400 mb-3" />
      <h3 className="text-base font-bold text-slate-800">No video lessons available</h3>
      <p className="text-sm text-slate-550 mt-1 max-w-sm mx-auto leading-relaxed">
        This course does not have any video lessons uploaded yet.
      </p>
    </div>
  );
}
