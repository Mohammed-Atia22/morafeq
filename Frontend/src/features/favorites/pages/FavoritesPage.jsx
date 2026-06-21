import { useCallback } from "react";
import { Navigate } from "react-router-dom";
import { ListingsGrid } from "../../expatriate/components/home/ListingsGrid";
import { useFavoriteToggle } from "../hooks/useFavoriteToggle";
import { useFavorites } from "../hooks/useFavorites";
import { useAuth } from "../../auth/hooks/useAuth";

export function FavoritesPage() {
  const { user } = useAuth();

  // Redirect owners away from favorites page
  if (user?.role === "HOST") {
    return <Navigate to="/owner" replace />;
  }

  const {
    favorites,
    total,
    loading,
    error,
    setFavoriteState,
  } = useFavorites();

  const handleFavoriteChanged = useCallback(
    (listingId, isFavorited, listing) => {
      setFavoriteState(listingId, isFavorited, listing);
    },
    [setFavoriteState],
  );

  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    onChanged: handleFavoriteChanged,
  });

  return (
    <div dir="rtl" className="max-w-6xl space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-black text-[#0f172a]">
            الشقق المحفوظة
          </h1>
          <p className="mt-0.5 text-sm text-slate-400">
            {total > 0
              ? `${total.toLocaleString("ar-EG")} شقة محفوظة`
              : "كل الشقق التي تحفظها ستظهر هنا"}
          </p>
        </div>
      </div>

      <ListingsGrid
        listings={favorites}
        loading={loading}
        error={error}
        emptyMessage="لا توجد شقق محفوظة حالياً."
        emptyHint="احفظ الشقق المناسبة من نتائج البحث لتعود إليها لاحقاً."
        onFavoriteToggle={toggleFavorite}
        pendingFavoriteIds={pendingIds}
      />
    </div>
  );
}
