import React from "react";
import SearchResultItem from "./SearchResultItem";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";

interface SearchResultsProps {
  results: Record<string, any[]>;
  loading: boolean;
  error: string | null;
  userRole: string;
  activeIndex: number;
  onItemHover: (index: number) => void;
  onItemClick: () => void;
}

const CATEGORY_NAMES: Record<string, string> = {
  students: "Students",
  faculty: "Faculty Staff",
  courses: "Courses",
  assignments: "Assignments",
  quizzes: "Quizzes",
  certificates: "Certificates",
  certificateTemplates: "Certificate Templates",
  videos: "Lessons & Videos",
  studyMaterials: "Study Materials",
  reports: "Performance Reports",
  notifications: "Notifications",
};

export default function SearchResults({
  results,
  loading,
  error,
  userRole,
  activeIndex,
  onItemHover,
  onItemClick,
}: SearchResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 font-sans">
        <Loader2 className="h-6 w-6 text-indigo-650 animate-spin mb-2" />
        <span className="text-xs font-bold font-mono uppercase tracking-wider">Searching curriculum...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500 px-4 text-center">
        <AlertCircle className="h-8 w-8 text-rose-500 mb-2" />
        <p className="text-sm font-semibold text-slate-800">{error}</p>
      </div>
    );
  }

  const categories = Object.keys(results).filter(
    (key) => results[key] && results[key].length > 0
  );

  if (categories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-400 font-sans select-none">
        <Inbox className="h-8 w-8 text-slate-300 mb-2" />
        <span className="text-xs font-semibold">No results found matching query</span>
      </div>
    );
  }

  // Pre-calculate globalIndex mapping for Arrow up/down selection
  let currentGlobalIndex = 0;
  const groupedResults = categories.map((category) => {
    const items = results[category].map((item) => {
      const globalIndex = currentGlobalIndex++;
      return { item, globalIndex };
    });
    return { category, items };
  });

  return (
    <div 
      id="global-search-results"
      className="overflow-y-auto max-h-[55vh] divide-y divide-slate-100 scroll-smooth"
    >
      {groupedResults.map(({ category, items }) => (
        <div key={category} className="py-2">
          <h4 className="px-4 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans select-none">
            {CATEGORY_NAMES[category] || category}
          </h4>
          <div className="mt-1 divide-y divide-slate-50">
            {items.map(({ item, globalIndex }) => (
              <SearchResultItem
                key={item.id}
                item={item}
                type={category}
                userRole={userRole}
                isActive={activeIndex === globalIndex}
                onMouseEnter={() => onItemHover(globalIndex)}
                onClick={onItemClick}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
