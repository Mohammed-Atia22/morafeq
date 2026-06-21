import { ListingCard } from "./ListingCard";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100">
      <div className="h-44 animate-pulse bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-3/4 animate-pulse rounded bg-slate-200" />
        <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 flex justify-between">
          <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

export function ListingsGrid({
  listings,
  loading,
  error,
  title,
  subtitle,
  emptyMessage = "لا توجد عقارات متاحة حالياً",
  emptyHint = "جرّب تغيير معايير البحث",
  onFavoriteToggle,
  pendingFavoriteIds,
}) {
  return (
    <div dir="rtl">
      {/* Section header */}
      {(title || subtitle) && (
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h2 className="text-base font-black text-[#0f172a]">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && listings.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 py-16 text-center">
          <span className="text-4xl">🏠</span>
          <p className="mt-3 text-sm font-semibold text-slate-600">
            {emptyMessage}
          </p>
          {emptyHint && <p className="mt-1 text-xs text-slate-400">{emptyHint}</p>}
        </div>
      )}

      {/* Listings grid */}
      {!loading && listings.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onFavoriteToggle={onFavoriteToggle}
              favoritePending={pendingFavoriteIds?.has?.(listing.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
