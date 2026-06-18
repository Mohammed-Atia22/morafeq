import { useState, useCallback } from "react";
import { paymentsApi } from "../../payments/services/paymentsApi";

export function useWallet() {
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWallet = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentsApi.getHostEarnings();
      setWallet(data);
      return data;
    } catch (err) {
      setError(err.message || "Failed to load wallet data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    wallet,
    loading,
    error,
    fetchWallet,
  };
}
