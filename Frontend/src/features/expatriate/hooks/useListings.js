import { useState, useCallback } from "react";
import { expatriateListingsApi } from "../services/expatriateListingsApi";
import { favoritesApi } from "../../favorites/services/favoritesApi";

/**
 * Manages fetching listings with optional filters.
 * Used by both the home page (no filters) and search page (with filters).
 */
export function useListings() {
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchListings = useCallback(async (filters = {}) => {
    setLoading(true);
    setError(null);

    try {
      const result = await expatriateListingsApi.search(filters);
      const nextListings = result.data ?? [];
      const statuses =
        nextListings.length > 0
          ? await favoritesApi.getStatuses(nextListings.map((listing) => listing.id))
          : { data: {} };

      setListings(
        nextListings.map((listing) => ({
          ...listing,
          isFavorited: Boolean(statuses.data?.[listing.id]),
        })),
      );
      setMeta(result.meta ?? null);
    } catch (err) {
      setError(err.message || "فشل في تحميل العقارات");
      setListings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  return { listings, meta, loading, error, fetchListings };
}
