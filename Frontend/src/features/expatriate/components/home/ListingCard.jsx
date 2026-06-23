import { useNavigate } from "react-router-dom";
import { VerificationBadge } from "../../../verification/components/VerificationBadge";
import { RatingSummary } from "../../../reviews/components/RatingSummary";

const ROOM_TYPE_LABELS = {
  ENTIRE_PLACE: "شقة كاملة",
  PRIVATE_ROOM: "غرفة خاصة",
  SHARED_ROOM: "غرفة مشتركة",
};

const PROPERTY_TYPE_LABELS = {
  APARTMENT: "شقة",
  VILLA: "فيلا",
  STUDIO: "ستوديو",
  ROOM: "غرفة",
  DORM: "سكن طلابي",
};

function AmenityTag({ label }) {
  return (
    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600">
      {label}
    </span>
  );
}

export function ListingCard({
  listing,
  onFavoriteToggle,
  favoritePending = false,
}) {
  const navigate = useNavigate();

  const coverPhoto = listing.photos?.[0]?.url;
  const reviewCount = listing._count?.reviews ?? 0;
  const averageRating = listing.averageRating ?? 0;
  const amenities = listing.amenities?.slice(0, 3) ?? [];
  const availablePlaces =
    listing.availablePlaces ?? Math.max(0, (listing.maxTenants ?? 0) - (listing.reservedPlaces ?? 0));

  const roomLabel =
    ROOM_TYPE_LABELS[listing.roomType] ??
    PROPERTY_TYPE_LABELS[listing.propertyType] ??
    "وحدة";

  const location = [listing.city, listing.governorate]
    .filter(Boolean)
    .join(" – ");

  const handleClick = () => navigate(`/expatriate/listings/${listing.id}`);
  const handleFavoriteClick = (event) => {
    event.stopPropagation();
    onFavoriteToggle?.(listing);
  };

  return (
    <div
      dir="rtl"
      onClick={handleClick}
      className="group cursor-pointer overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:ring-slate-200"
    >
      {/* Photo */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {coverPhoto ? (
          <img
            src={coverPhoto}
            alt={listing.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-12 w-12">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3 9.75L12 3l9 6.75V21H3V9.75z" />
            </svg>
          </div>
        )}

        {/* Type badge */}
        <span className="absolute right-2 top-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-slate-700 shadow backdrop-blur">
          {roomLabel}
        </span>

        <span className="absolute right-2 bottom-2">
          <VerificationBadge
            status={listing.host?.verificationStatus}
            compact
          />
        </span>

        {/* Distance badge */}
        {listing.distanceKm !== undefined && (
          <span className="absolute left-2 top-2 rounded-full bg-[#1752F0]/90 px-2.5 py-1 text-[11px] font-bold text-white shadow backdrop-blur">
            {listing.distanceKm} كم
          </span>
        )}

        {onFavoriteToggle && (
          <button
            type="button"
            onClick={handleFavoriteClick}
            disabled={favoritePending}
            aria-label={
              listing.isFavorited
                ? "إزالة من الشقق المحفوظة"
                : "حفظ الشقة"
            }
            title={
              listing.isFavorited
                ? "إزالة من الشقق المحفوظة"
                : "حفظ الشقة"
            }
            className="absolute left-2 bottom-2 grid h-10 w-10 place-items-center rounded-full bg-white/95 text-xl shadow-md ring-1 ring-slate-200 transition hover:scale-105 disabled:cursor-wait disabled:opacity-70"
          >
            {listing.isFavorited ? "❤️" : "♡"}
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="truncate text-sm font-bold text-[#0f172a]">
          {listing.title}
        </h3>

        {location && (
          <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-3 w-3 shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11z" />
              <circle cx="12" cy="10" r="2" />
            </svg>
            {location}
          </p>
        )}

        {/* Amenities */}
        {amenities.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {amenities.map((a) => (
              <AmenityTag key={a.amenityKey} label={a.amenityKey} />
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 grid grid-cols-1 gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 sm:grid-cols-2">
          <span>الأماكن المتبقية: {availablePlaces.toLocaleString("ar-EG")}</span>
          <span className="text-left">السعة الكاملة: {Number(listing.maxTenants ?? 0).toLocaleString("ar-EG")}</span>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <RatingSummary
            averageRating={averageRating}
            reviewCount={reviewCount}
            size="sm"
          />

          <div className="text-left">
            <span className="text-base font-black text-[#1752F0]">
              {Number(listing.monthlyRent).toLocaleString("ar-EG")}
            </span>
            <span className="text-xs text-slate-400"> ج.م/شهر</span>
          </div>
        </div>
      </div>
    </div>
  );
}
