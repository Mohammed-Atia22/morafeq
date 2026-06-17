import { useCallback, useEffect, useState } from "react";
import { usersApi } from "../services/usersApi";

export function useUser() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadUser = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await usersApi.getMe();
      setUser(data);
      return data;
    } catch (err) {
      setError(err.message || "Failed to load user");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  return { user, loading, error, loadUser };
}
