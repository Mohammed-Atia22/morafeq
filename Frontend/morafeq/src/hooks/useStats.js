// src/hooks/useStats.js
// --------------------------------------------------
// Fetches platform stats for the landing page stats bar.
// usage: const { stats, loading, error } = useStats();
// --------------------------------------------------

import { useState, useEffect } from "react";
import statsService from "../services/statsService";

const useStats = () => {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    let cancelled = false;

    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await statsService.getPlatformStats();
        if (!cancelled) setStats(response.data);
      } catch (err) {
        if (!cancelled) setError(err.message || "فشل تحميل الإحصائيات");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    return () => { cancelled = true; };
  }, []);  // runs once on mount

  // Provide fallback display values while loading
  const display = {
    properties:   stats?.properties_count   ?? "...",
    students:     stats?.students_count     ?? "...",
    universities: stats?.universities_count ?? "...",
    satisfaction: stats?.satisfaction_rate  ?? "...",
  };

  return { stats, display, loading, error };
};

export default useStats;