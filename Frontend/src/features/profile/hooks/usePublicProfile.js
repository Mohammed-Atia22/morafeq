import { useEffect, useState } from "react";
import { usersApi } from "../services/usersApi";

export function usePublicProfile(userId) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadProfile = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await usersApi.getPublicProfile(userId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || "تعذر تحميل الملف الشخصي");
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  return { profile, loading, error };
}
