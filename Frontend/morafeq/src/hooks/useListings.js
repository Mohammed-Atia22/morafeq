// src/hooks/useListings.js
// --------------------------------------------------
// Fetches property listings.
// Pass filters object to trigger filtered search.
// Pass featured=true to get only featured listings.
// --------------------------------------------------

import { useState, useEffect, useCallback } from "react";
import propertyService from "../services/propertyService";

// ── Featured listings (landing page) ──────────────────
// usage: const { listings, loading, error } = useListings({ featured: true });
//
// ── All listings with filters (browse page) ───────────
// usage: const { listings, loading, error, refetch } = useListings({ city: "القاهرة" });

const useListings = (options = {}) => {
  const { featured = false, ...filters } = options;

  const [listings, setListings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = featured
        ? await propertyService.getFeatured()
        : await propertyService.getAll(filters);

      // Both endpoints return { data: [...] }
      setListings(response.data);
    } catch (err) {
      setError(err.message || "فشل تحميل العقارات");
    } finally {
      setLoading(false);
    }
  }, [featured, filters]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = featured
          ? await propertyService.getFeatured()
          : await propertyService.getAll(filters);

        if (!cancelled) setListings(response.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "فشل تحميل العقارات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => { cancelled = true; };   // cleanup: ignore stale responses
  }, [featured, JSON.stringify(filters)]);

  return {
    listings,
    loading,
    error,
    refetch: fetchListings,   // call this to manually re-fetch
    isEmpty: !loading && !error && listings.length === 0,
  };
};

export default useListings;