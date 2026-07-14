import { useState, useEffect, useRef } from "react";
import api from "@/lib/axios";

export function useGlobalSearch(delay = 300) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Session cache mapping query string to search results
  const cacheRef = useRef<Record<string, Record<string, any[]>>>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      setResults({});
      setLoading(false);
      setError(null);
      return;
    }

    // Check Cache
    if (cacheRef.current[trimmed]) {
      setResults(cacheRef.current[trimmed]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const handler = setTimeout(async () => {
      // Abort previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      try {
        const response = await api.get("/search", {
          params: { q: trimmed },
          signal: abortControllerRef.current.signal,
        });

        if (response.data?.success) {
          const data = response.data.data;
          cacheRef.current[trimmed] = data;
          setResults(data);
        } else {
          setError("Failed to resolve search results.");
        }
      } catch (err: any) {
        if (err.name !== "CanceledError" && err.message !== "canceled") {
          console.error("Search API error:", err);
          setError("An error occurred while searching. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [query, delay]);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch: () => {
      setQuery("");
      setResults({});
      setError(null);
    },
  };
}
