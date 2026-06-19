import { useCallback, useEffect, useState } from "react";
import { reviewsApi } from "../services/reviewsApi";

export function useCanReview(bookingId, enabled = true) {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const refetch = useCallback(async () => {
    if (!bookingId || !enabled) {
      setEligibility(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const data = await reviewsApi.canReview(bookingId);
      setEligibility(data);
    } catch (err) {
      setError(err.message || "تعذر التحقق من إمكانية التقييم");
      setEligibility(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId, enabled]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { eligibility, loading, error, refetch };
}
