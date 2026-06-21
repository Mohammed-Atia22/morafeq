import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useListings } from "../hooks/useListings";
import { WelcomeCard } from "../components/home/WelcomeCard";
import { ListingsGrid } from "../components/home/ListingsGrid";
import { useFavoriteToggle } from "../../favorites/hooks/useFavoriteToggle";

export function ExpatriateHomePage() {
  const { user } = useAuth();
  const { listings, meta, loading, error, fetchListings } = useListings();
  const [displayListings, setDisplayListings] = useState([]);

  useEffect(() => {
    setDisplayListings(listings);
  }, [listings]);

  const handleFavoriteChanged = useCallback((listingId, isFavorited) => {
    setDisplayListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, isFavorited } : listing,
      ),
    );
  }, []);

  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    onChanged: handleFavoriteChanged,
  });

  // Fetch latest listings on mount — no filters, sorted by newest
  useEffect(() => {
    fetchListings({ limit: 6 });
  }, [fetchListings]);

  return (
    <div dir="rtl" className="space-y-8 max-w-5xl">
      {/* Welcome hero card */}
      <WelcomeCard firstName={user?.firstName} totalListings={meta?.total} />

      {/* Listings section */}
      <ListingsGrid
        listings={displayListings}
        loading={loading}
        error={error}
        title="العقارات المتاحة"
        subtitle="أحدث الوحدات المضافة على المنصة"
        onFavoriteToggle={toggleFavorite}
        pendingFavoriteIds={pendingIds}
      />
    </div>
  );
}
