import { useEffect } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { useListings } from "../hooks/useListings";
import { WelcomeCard } from "../components/home/WelcomeCard";
import { ListingsGrid } from "../components/home/ListingsGrid";

export function ExpatriateHomePage() {
  const { user } = useAuth();
  const { listings, meta, loading, error, fetchListings } = useListings();

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
        listings={listings}
        loading={loading}
        error={error}
        title="العقارات المتاحة"
        subtitle="أحدث الوحدات المضافة على المنصة"
      />
    </div>
  );
}
