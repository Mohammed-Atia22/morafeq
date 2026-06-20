import { useCallback, useEffect, useMemo, useState } from "react";
import { favoritesApi } from "../services/favoritesApi";

export function useFavorites({ autoLoad = true, limit } = {}) {
  const [favorites, setFavorites] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(autoLoad);
  const [error, setError] = useState(null);

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await favoritesApi.getFavorites();
      setFavorites(result.data ?? []);
      setTotal(result.meta?.total ?? result.data?.length ?? 0);
      return result.data ?? [];
    } catch (err) {
      setError(err.message || "فشل في تحميل الشقق المحفوظة");
      setFavorites([]);
      setTotal(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) {
      loadFavorites();
    }
  }, [autoLoad, loadFavorites]);

  const visibleFavorites = useMemo(() => {
    if (!limit) return favorites;
    return favorites.slice(0, limit);
  }, [favorites, limit]);

  const setFavoriteState = useCallback((listingId, isFavorited, listing) => {
    setFavorites((prev) => {
      if (isFavorited) {
        if (!prev.some((item) => item.id === listingId) && listing) {
          return [{ ...listing, isFavorited: true }, ...prev];
        }

        return prev.map((listing) =>
          listing.id === listingId ? { ...listing, isFavorited: true } : listing,
        );
      }

      return prev.filter((listing) => listing.id !== listingId);
    });

    if (!isFavorited) {
      setTotal((prev) => Math.max(0, prev - 1));
    } else if (listing) {
      setTotal((prev) => prev + 1);
    }
  }, []);

  return {
    favorites,
    visibleFavorites,
    total,
    loading,
    error,
    loadFavorites,
    setFavoriteState,
  };
}
