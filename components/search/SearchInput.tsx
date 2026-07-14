import React, { useRef, useEffect } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  loading: boolean;
}

export default function SearchInput({
  value,
  onChange,
  onClear,
  loading,
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Automatically focus search input when dialog mounts
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <div className="relative flex items-center border-b border-slate-200 px-4 py-4 shrink-0 bg-slate-50/20">
      <Search className="h-5 w-5 text-slate-400 absolute left-4 shrink-0" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Search students, courses, assignments, quizzes..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent pl-8 pr-12 text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-hidden"
        role="combobox"
        aria-expanded={true}
        aria-autocomplete="list"
        aria-controls="global-search-results"
      />
      
      <div className="absolute right-4 flex items-center gap-1.5 shrink-0">
        {value.length > 0 && !loading && (
          <button
            onClick={onClear}
            className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
            aria-label="Clear search input"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400 shadow-3xs">
          ESC
        </kbd>
      </div>
    </div>
  );
}
