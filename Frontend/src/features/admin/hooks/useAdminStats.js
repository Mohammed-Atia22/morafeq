import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";

export function useAdminStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      setError(err.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refreshStats: fetchStats };
}
