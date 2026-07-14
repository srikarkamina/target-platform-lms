"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useGlobalSearch } from "./hooks/useGlobalSearch";
import SearchInput from "./SearchInput";
import SearchResults from "./SearchResults";
import { getEntityLink } from "./SearchResultItem";
import { CornerDownLeft } from "lucide-react";

interface SearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchDialog({ isOpen, onClose }: SearchDialogProps) {
  const router = useRouter();
  const modalRef = useRef<HTMLDivElement>(null);
  const [role, setRole] = useState<string>("STUDENT");
  const [activeIndex, setActiveIndex] = useState(0);

  const { query, setQuery, results, loading, error, clearSearch } = useGlobalSearch(300);

  // Client-side JWT parse helper to fetch user role
  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split(".")[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = parseJwt(token);
        if (payload?.role) {
          setRole(payload.role);
        }
      }
    }
  }, [isOpen]);

  // Reset activeIndex when query or results change
  useEffect(() => {
    setActiveIndex(0);
  }, [results, query]);

  // Extract flat list of items to simplify Arrow up/down selection
  const categories = useMemo(() => {
    return Object.keys(results).filter(
      (key) => results[key] && results[key].length > 0
    );
  }, [results]);

  const flatItems = useMemo(() => {
    const items: { item: any; type: string }[] = [];
    categories.forEach((category) => {
      results[category].forEach((item) => {
        items.push({ item, type: category });
      });
    });
    return items;
  }, [results, categories]);

  const totalItemsCount = flatItems.length;

  // Keyboard navigation listener (ArrowDown, ArrowUp, Enter)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) => 
          totalItemsCount > 0 ? (prev + 1) % totalItemsCount : 0
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => 
          totalItemsCount > 0 ? (prev - 1 + totalItemsCount) % totalItemsCount : 0
        );
      } else if (e.key === "Enter") {
        if (totalItemsCount > 0 && activeIndex >= 0 && activeIndex < totalItemsCount) {
          e.preventDefault();
          const target = flatItems[activeIndex];
          const href = getEntityLink(target.item, target.type, role);
          router.push(href);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, totalItemsCount, activeIndex, flatItems, role, router, onClose]);

  // Escape key listener to close dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  // Focus Trap logic
  useEffect(() => {
    if (!isOpen) return;

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !modalRef.current) return;

      const focusableElements = modalRef.current.querySelectorAll(
        'input, select, textarea, button, a[href], [tabindex="0"]'
      );
      if (focusableElements.length === 0) return;

      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    window.addEventListener("keydown", handleFocusTrap);
    return () => window.removeEventListener("keydown", handleFocusTrap);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 md:p-10 pt-[10vh] font-sans">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in" 
      />

      {/* Modal Dialog Content */}
      <div 
        ref={modalRef}
        className="relative bg-white w-full max-w-2xl rounded-3xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden max-h-[75vh] animate-in fade-in zoom-in-95 duration-200"
      >
        <SearchInput
          value={query}
          onChange={setQuery}
          onClear={clearSearch}
          loading={loading}
        />

        {query.trim().length > 0 && (
          <SearchResults
            results={results}
            loading={loading}
            error={error}
            userRole={role}
            activeIndex={activeIndex}
            onItemHover={setActiveIndex}
            onItemClick={onClose}
          />
        )}

        {/* Footer shortcuts helper */}
        <div className="border-t border-slate-150 px-4 py-3 shrink-0 flex items-center justify-between text-[10px] font-bold text-slate-400 select-none bg-slate-50/50">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white">↑↓</kbd> Navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-white flex items-center gap-0.5">
                <CornerDownLeft className="h-2 w-2" /> Enter
              </kbd> Select
            </span>
          </div>
          <div>
            <span>ESC to Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}
