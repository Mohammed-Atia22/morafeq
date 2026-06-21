import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../services/adminApi";

export function useAdminDisputeDetail(bookingId) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDetail = useCallback(async () => {
    if (!bookingId) return;

    setLoading(true);
    setError("");

    try {
      const result = await adminApi.getDisputeDetail(bookingId);
      setDetail(result);
    } catch (err) {
      setError(err.message || "تعذر تحميل تفاصيل النزاع");
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { detail, loading, error, refresh: fetchDetail };
}
