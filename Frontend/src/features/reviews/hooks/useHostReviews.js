import { useCallback, useEffect, useState } from "react";
import { reviewsApi } from "../services/reviewsApi";

const DEFAULT_LIMIT = 10;

export function useHostReviews(hostId) {
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({
    total: 0,
    page: 1,
    totalPages: 0,
    averageRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  const fetchPage = useCallback(
    async (page = 1, append = false) => {
      if (!hostId) {
        setLoading(false);
        setReviews([]);
        setMeta({ total: 0, page: 1, totalPages: 0, averageRating: 0 });
        return;
      }

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const result = await reviewsApi.getHostReviews(hostId, {
          page,
          limit: DEFAULT_LIMIT,
        });

        setReviews((prev) =>
          append ? [...prev, ...(result.data ?? [])] : result.data ?? [],
        );
        setMeta(result.meta ?? {});
      } catch (err) {
        setError(err.message || "تعذر تحميل التقييمات");
        if (!append) {
          setReviews([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [hostId],
  );

  useEffect(() => {
    fetchPage(1, false);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    fetchPage(meta.page + 1, true);
  }, [fetchPage, loadingMore, meta.page, meta.totalPages]);

  return {
    reviews,
    meta,
    loading,
    loadingMore,
    error,
    loadMore,
    hasMore: meta.page < meta.totalPages,
    refetch: () => fetchPage(1, false),
  };
}
