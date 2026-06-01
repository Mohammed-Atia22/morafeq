// src/components/landing/FeaturedListings.jsx
// UPDATED: removed hardcoded LISTINGS array, now uses useListings hook
import { useListings } from "../../hooks";
import { LoadingSpinner, ErrorMessage } from "../../components/ui";

// ── Type label map ────────────────────────────────────
const TYPE_LABELS = {
  studio:    "استوديو",
  apartment: "شقة",
  room:      "غرفة",
};

// ── Property card ─────────────────────────────────────
const PropertyCard = ({ listing }) => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-card card-lift border border-gray-100">
    {/* Image */}
    <div className="relative overflow-hidden h-48">
      <img
        src={listing.images?.[0]}
        alt={listing.title}
        className="w-full h-full object-cover property-img"
      />
      {/* Badges */}
      <div className="absolute top-3 right-3 flex gap-2">
        {listing.is_verified && (
          <span className="tag-badge bg-emerald-100 text-emerald-700 shadow-sm">
            ✓ موثق
          </span>
        )}
      </div>
      <div className="absolute top-3 left-3">
        <span className="tag-badge bg-primary-600 text-white border-transparent">
          {TYPE_LABELS[listing.type] ?? listing.type}
        </span>
      </div>
      {/* Wishlist */}
      <button className="absolute bottom-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-sm">
        <svg className="w-4 h-4 text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>
    </div>

    {/* Content */}
    <div className="p-4">
      {/* Price */}
      <div className="flex items-baseline gap-1 mb-2 flex-row-reverse justify-end">
        <span className="text-2xl font-black text-primary-700">
          {listing.price?.toLocaleString()}
        </span>
        <span className="text-gray-400 text-sm font-medium">ج.م / شهر</span>
      </div>

      {/* Title */}
      <h3 className="font-bold text-gray-900 text-base mb-2 text-right leading-snug">
        {listing.title}
      </h3>

      {/* Location */}
      <div className="flex items-center gap-1 text-gray-500 text-sm mb-3 flex-row-reverse">
        <svg className="w-4 h-4 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{listing.location?.area} – {listing.location?.city}</span>
        {listing.note && (
          <span className="text-primary-500 font-semibold mr-1">· {listing.note}</span>
        )}
      </div>

      {/* Amenities tags */}
      <div className="flex flex-wrap gap-1.5 mb-4 justify-end">
        {listing.amenities?.map((tag) => (
          <span key={tag} className="bg-blue-50 text-primary-600 text-xs font-semibold px-2.5 py-1 rounded-lg">
            {tag}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-50 pt-3">
        <button className="text-primary-600 font-bold text-sm hover:text-primary-800 transition-colors flex items-center gap-1">
          عرض التفاصيل
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-1">
          <span className="text-gray-400 text-xs">({listing.reviews_count} تقييم)</span>
          <span className="font-bold text-gray-800 text-sm">{listing.rating}</span>
          <span className="text-amber-400">⭐</span>
        </div>
      </div>
    </div>
  </div>
);

// ── Skeleton card shown while loading ─────────────────
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
    <div className="h-48 bg-gray-100" />
    <div className="p-4 space-y-3">
      <div className="h-6 bg-gray-100 rounded-lg w-1/3" />
      <div className="h-5 bg-gray-100 rounded-lg w-2/3" />
      <div className="h-4 bg-gray-100 rounded-lg w-1/2" />
      <div className="flex gap-2 justify-end">
        <div className="h-6 bg-gray-100 rounded-lg w-16" />
        <div className="h-6 bg-gray-100 rounded-lg w-16" />
      </div>
    </div>
  </div>
);

// ── Main component ─────────────────────────────────────
const FeaturedListings = () => {
  const { listings, loading, error, refetch } = useListings({ featured: true });

  return (
    <section id="listings" className="py-20 bg-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-10 flex-row-reverse">
          <div className="text-right">
            <p className="text-primary-600 font-bold text-sm mb-1">🏷️ أحدث الإضافات</p>
            <h2 className="text-3xl font-black text-gray-900">عقارات مميزة بالقرب منك</h2>
          </div>
          <button className="flex items-center gap-2 text-primary-600 font-bold border border-primary-200 hover:bg-blue-50 px-4 py-2 rounded-xl transition-colors text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            عرض الكل
          </button>
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <ErrorMessage message={error} onRetry={refetch} />
        )}

        {/* Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {listings.map((listing) => (
              <PropertyCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}

      </div>
    </section>
  );
};

export default FeaturedListings;