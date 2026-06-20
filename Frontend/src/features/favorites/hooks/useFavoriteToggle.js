import { useCallback, useState } from "react";
import { favoritesApi } from "../services/favoritesApi";

export function useFavoriteToggle({ onChanged } = {}) {
  const [pendingIds, setPendingIds] = useState(() => new Set());

  const toggleFavorite = useCallback(
    async (listing) => {
      if (!listing?.id || pendingIds.has(listing.id)) return;

      const listingId = listing.id;
      const nextValue = !listing.isFavorited;
      setPendingIds((prev) => new Set(prev).add(listingId));
      onChanged?.(listingId, nextValue, listing);

      try {
        if (nextValue) {
          await favoritesApi.addFavorite(listingId);
        } else {
          await favoritesApi.removeFavorite(listingId);
        }
      } catch (err) {
        onChanged?.(listingId, !nextValue, listing);
        console.error(err);
      } finally {
        setPendingIds((prev) => {
          const next = new Set(prev);
          next.delete(listingId);
          return next;
        });
      }
    },
    [onChanged, pendingIds],
  );

  return {
    pendingIds,
    toggleFavorite,
  };
}
