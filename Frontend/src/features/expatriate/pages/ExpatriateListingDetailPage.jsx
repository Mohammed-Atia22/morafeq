import { useParams, Link } from "react-router-dom";
import { useListingDetail } from "../hooks/useListingDetail";
import { PhotoGallery } from "../components/listing-detail/PhotoGallery";
import { ListingInfo } from "../components/listing-detail/ListingInfo";
import { HostCard } from "../components/listing-detail/HostCard";
import { AmenitiesSection } from "../components/listing-detail/AmenitiesSection";
import { ReviewsSection } from "../components/listing-detail/ReviewsSection";
import { BookingCard } from "../components/listing-detail/BookingCard";
import { LocationInsightButton } from "../components/listing-detail/LocationInsightButton";

// ─── Breadcrumb ───────────────────────────────
function Breadcrumb({ title }) {
  return (
    <nav dir="rtl" className="flex items-center gap-1.5 text-xs text-slate-400">
      <Link to="/expatriate" className="transition hover:text-[#1752F0]">
        الرئيسية
      </Link>
      <span>/</span>
      <Link to="/expatriate/search" className="transition hover:text-[#1752F0]">
        البحث
      </Link>
      <span>/</span>
      <span className="truncate font-semibold text-slate-600">
        {title ?? "..."}
      </span>
    </nav>
  );
}

// ─── Skeleton loader ──────────────────────────
function DetailSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-[340px] rounded-2xl bg-slate-200" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-slate-200" />
        ))}
      </div>
      <div className="h-40 rounded-2xl bg-slate-200" />
      <div className="h-28 rounded-2xl bg-slate-200" />
    </div>
  );
}

// ─── Page ─────────────────────────────────────
export function ExpatriateListingDetailPage() {
  const { id } = useParams();
  const { listing, loading, error } = useListingDetail(id);

  return (
    <div dir="rtl" className="max-w-6xl space-y-5">
      {/* Breadcrumb */}
      <Breadcrumb title={listing?.title} />

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && <DetailSkeleton />}

      {/* Content */}
      {!loading && listing && (
        <div className="flex flex-col gap-6 lg:flex-row items-start">
          {/* ── Left column: booking card (sticky) ── */}
          <aside className="w-[260px] shrink-0">
            <BookingCard
              monthlyRent={listing.monthlyRent}
              depositAmount={listing.depositAmount}
              currency={listing.currency}
              listingId={listing.id}
              listingStatus={listing.status}
            />
          </aside>

          {/* ── Right column: all detail sections ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Photos */}
            <PhotoGallery photos={listing.photos ?? []} />

            {listing.status === "RESERVED" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
                هذا العقار محجوز حاليا بانتظار إتمام الدفع، لذلك لا يظهر في نتائج البحث العامة.
              </div>
            )}

            {/* Info: title, location, price, stats, description */}
            <ListingInfo listing={listing} />

            {/* Host */}
            <HostCard
  host={listing.host}
  listingId={listing.id}
/>

            {/* Amenities */}
            <AmenitiesSection amenities={listing.amenities ?? []} />

            {/* Location Insight */}
            <LocationInsightButton listingId={listing.id} />

            {/* Reviews */}
            <ReviewsSection
              reviews={listing.reviews ?? []}
              averageRating={listing.averageRating ?? 0}
              reviewCount={listing._count?.reviews ?? 0}
            />
          </div>
        </div>
      )}
    </div>
  );
}
