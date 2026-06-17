import { useState, useEffect } from "react";
import { locationInsightsApi } from "../services/locationInsightsApi";

/**
 * Fetches location insight for a listing.
 * If not yet generated, the backend auto-generates it.
 * This can take a few seconds on first load.
 */
export function useLocationInsight(listingId) {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!listingId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await locationInsightsApi.getForListing(listingId);
        if (!cancelled) setInsight(data.insight ?? data);
      } catch (err) {
        if (!cancelled)
          setError(err.message || "فشل في تحميل تحليل المنطقة");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [listingId]);

  return { insight, loading, error };
}