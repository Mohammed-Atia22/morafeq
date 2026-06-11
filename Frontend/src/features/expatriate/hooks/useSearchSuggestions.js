import { useState, useRef, useEffect, useCallback } from "react";
import { apiRequest } from "../../../shared/services/api";

// Debounce helper
function useDebouncedCallback(fn, wait) {
  const timeout = useRef(null);

  return useCallback((...args) => {
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => fn(...args), wait);
  }, [fn, wait]);
}

export function useSearchSuggestions({ initial = [], limit = 8 } = {}) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSuggestions = useCallback(async (q) => {
    if (!q || !q.trim()) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await apiRequest(`/search/suggestions?q=${encodeURIComponent(q)}&limit=${limit}`);
      setSuggestions(res.data || []);
    } catch (err) {
      setError(err.message || "فشل في الحصول على اقتراحات");
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  const debouncedFetch = useDebouncedCallback(fetchSuggestions, 250);

  useEffect(() => {
    debouncedFetch(query);
  }, [query, debouncedFetch]);

  return {
    query,
    setQuery,
    suggestions,
    loading,
    error,
  };
}
