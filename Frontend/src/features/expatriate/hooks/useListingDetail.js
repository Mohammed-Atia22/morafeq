import { useState, useEffect } from "react";
import { expatriateListingsApi } from "../services/expatriateListingsApi";

/**
 * Fetches a single listing by id.
 * Called once on mount when the detail page loads.
 */
export function useListingDetail(id) {
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await expatriateListingsApi.findOne(id);
        if (!cancelled) setListing(data);
      } catch (err) {
        if (!cancelled) setError(err.message || "فشل في تحميل بيانات العقار");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return { listing, loading, error };
}