import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../services/adminApi";

export function useAdminDisputes(initialStatus = "") {
  const [disputes, setDisputes] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const result = await adminApi.getDisputes({ status, page, limit: 10 });
      setDisputes(result.data ?? []);
      setMeta(result.meta ?? { page: 1, limit: 10, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.message || "تعذر تحميل النزاعات");
      setDisputes([]);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => {
    fetchDisputes();
  }, [fetchDisputes]);

  return {
    disputes,
    meta,
    loading,
    error,
    status,
    setStatus: (value) => {
      setStatus(value);
      setPage(1);
    },
    page,
    setPage,
    refresh: fetchDisputes,
  };
}
