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

const GENDER_LABELS = {
  MALE: "للذكور فقط",
  FEMALE: "للإناث فقط",
  ANY: "مختلط",
};

function StatBadge({ icon, label }) {
  return (
    <div className="flex items-center gap-1.5 text-sm text-slate-600">
      <span className="text-[#1752F0]">{icon}</span>
      <span>{label}</span>
    </div>
  );
}

export function ListingInfo({ listing }) {
  const location = [listing.city, listing.governorate]
    .filter(Boolean)
    .join(" – ");

  const typeLabel =
    ROOM_TYPE_LABELS[listing.roomType] ??
    PROPERTY_TYPE_LABELS[listing.propertyType] ??
    "وحدة";

  const availableFrom = listing.availableFrom
    ? new Date(listing.availableFrom).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;
  const reservedPlaces = Number(listing.reservedPlaces ?? 0);
  const availablePlaces = Number(
    listing.availablePlaces ?? Math.max(0, (listing.maxTenants ?? 0) - reservedPlaces),
  );

  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      {/* Type tag */}
      <span className="inline-block rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-bold text-[#1752F0]">
        {typeLabel}
      </span>

      {/* Title */}
      <h1 className="mt-2 text-xl font-black text-[#0f172a]">{listing.title}</h1>

      {/* Location */}
      {location && (
        <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 shrink-0 text-[#1752F0]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4-4-7-7.5-7-11a7 7 0 1 1 14 0c0 3.5-3 7-7 11z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
          {location}
        </p>
      )}

      {/* Price */}
      <div className="mt-3 flex items-baseline gap-1">
        <span className="text-2xl font-black text-[#1752F0]">
          {Number(listing.monthlyRent).toLocaleString("ar-EG")}
        </span>
        <span className="text-sm text-slate-400">ج.م / شهر</span>
      </div>

      {/* Stats row */}
      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-slate-100 pt-4">
        {listing.bedrooms != null && (
          <StatBadge icon="🛏" label={`${listing.bedrooms} غرف نوم`} />
        )}
        {listing.beds != null && (
          <StatBadge icon="🛌" label={`${listing.beds} أسرّة`} />
        )}
        {listing.bathrooms != null && (
          <StatBadge icon="🚿" label={`${listing.bathrooms} حمام`} />
        )}
        {listing.maxTenants != null && (
          <StatBadge icon="👥" label={`الحد الأقصى للأشخاص ${listing.maxTenants}`} />
        )}
        {listing.maxTenants != null && (
          <StatBadge icon="🔒" label={`الأماكن المحجوزة ${reservedPlaces}`} />
        )}
        {listing.maxTenants != null && (
          <StatBadge icon="✅" label={`الأماكن المتبقية ${availablePlaces}`} />
        )}
        {listing.genderPreference && listing.genderPreference !== "ANY" && (
          <StatBadge icon="🚻" label={GENDER_LABELS[listing.genderPreference] ?? listing.genderPreference} />
        )}
        {availableFrom && (
          <StatBadge icon="📅" label={`متاح من ${availableFrom}`} />
        )}
        {listing.minimumStayMonths != null && (
          <StatBadge icon="📆" label={`أدنى إقامة ${listing.minimumStayMonths} شهر`} />
        )}
      </div>

      {/* Description */}
      {listing.description && (
        <p className="mt-4 border-t border-slate-100 pt-4 text-sm leading-relaxed text-slate-600">
          {listing.description}
        </p>
      )}

      {/* Nearby landmark */}
      {listing.nearbyLandmark && (
        <p className="mt-2 text-xs text-slate-400">
          📍 قريب من: {listing.nearbyLandmark}
        </p>
      )}
    </div>
  );
}
