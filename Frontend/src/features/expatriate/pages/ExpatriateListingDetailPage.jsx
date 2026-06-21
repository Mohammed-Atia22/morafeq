import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useListingDetail } from "../hooks/useListingDetail";
import { PhotoGallery } from "../components/listing-detail/PhotoGallery";
import { ListingInfo } from "../components/listing-detail/ListingInfo";
import { HostCard } from "../components/listing-detail/HostCard";
import { AmenitiesSection } from "../components/listing-detail/AmenitiesSection";
import { ListingReviewsSection } from "../../reviews/components/ListingReviewsSection";
import { BookingCard } from "../components/listing-detail/BookingCard";
import { LocationInsightButton } from "../components/listing-detail/LocationInsightButton";
import { usersApi } from "../../profile/services/usersApi";
import { useAuth } from "../../auth/hooks/useAuth";

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
const ROOMMATE_PREFERENCE_LABELS = {
  non_smoker: "غير مدخن",
  smoker: "مدخن",
  early_riser: "يستيقظ مبكراً",
  night_owl: "يسهر ليلاً",
  quiet: "هادئ",
  social: "اجتماعي",
  clean_freak: "يحب النظافة",
  pet_friendly: "محب للحيوانات",
  no_pets: "لا يفضل الحيوانات",
  studies_at_home: "يدرس في المنزل",
  studies_at_library: "يدرس في المكتبة",
  group_study: "يفضل الدراسة الجماعية",
  football: "كرة القدم",
  gaming: "الألعاب الإلكترونية",
  reading: "القراءة",
  gym: "الجيم",
  music: "الموسيقى",
  cooking: "الطبخ",
  traveling: "السفر",
  cairo_university: "جامعة القاهرة",
  ain_shams_university: "جامعة عين شمس",
  helwan_university: "جامعة حلوان",
  german_university_cairo: "الجامعة الألمانية بالقاهرة",
  american_university_cairo: "الجامعة الأمريكية بالقاهرة",
};

function getRoommateBadgeText(status) {
  switch (status) {
    case "CHECK_IN_PENDING":
    case "COMPLETED":
      return "زميل سكن مؤكد";
    case "PENDING_PAYMENT":
      return "محجوز بانتظار الدفع";
    default:
      return "زميل سكن";
  }
}

function getGuestPreferences(guest) {
  if (!guest?.preferences || !Array.isArray(guest.preferences)) return [];
  return guest.preferences
    .map((pref) => pref.preferenceKey || pref)
    .filter(Boolean);
}

function getPreferenceLabel(key) {
  return ROOMMATE_PREFERENCE_LABELS[key] || key.replace(/_/g, " ");
}

function calculateCompatibilityScore(myPrefs, guestPrefs) {
  if (!myPrefs?.size || !guestPrefs?.length) return 0;
  let score = 0;
  guestPrefs.forEach((pref) => {
    if (myPrefs.has(pref)) score += 1;
  });
  return score;
}

function formatCompatibilityText(score, total) {
  if (!total) return "0%";
  const percent = Math.round((score / total) * 100);
  return `${score} من ${total} خيارات · ${percent}%`;
}

export function ExpatriateListingDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { listing, loading, error } = useListingDetail(id);
  const [myPreferences, setMyPreferences] = useState([]);

  useEffect(() => {
    let mounted = true;
    const loadMyPreferences = async () => {
      if (!user?.id) return;
      try {
        const data = await usersApi.getMyPreferences();
        if (!mounted) return;
        setMyPreferences(
          Array.isArray(data) ? data : data?.preferenceKeys || [],
        );
      } catch {
        if (mounted) setMyPreferences([]);
      }
    };

    loadMyPreferences();
    return () => {
      mounted = false;
    };
  }, [user]);

  const currentTenants = useMemo(
    () =>
      (listing?.bookings || [])
        .filter((booking) => booking?.guest && booking.status)
        .map((booking) => ({
          ...booking,
          guest: {
            ...booking.guest,
            preferences: booking.guest.preferences || [],
          },
        })),
    [listing],
  );

  const compatibilityMap = useMemo(() => {
    const mySet = new Set(myPreferences);
    return new Map(
      currentTenants.map((booking) => [
        booking.id,
        calculateCompatibilityScore(mySet, getGuestPreferences(booking.guest)),
      ]),
    );
  }, [currentTenants, myPreferences]);

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
          <aside className="w-full max-w-[260px] shrink-0 lg:w-[260px]">
            <BookingCard
              monthlyRent={listing.monthlyRent}
              depositAmount={listing.depositAmount}
              currency={listing.currency}
              listingId={listing.id}
              listingStatus={listing.status}
              rooms={
                listing.roomType !== "ENTIRE_PLACE" ? (listing.rooms ?? []) : []
              }
            />
          </aside>

          {/* ── Right column: all detail sections ── */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* Photos */}
            <PhotoGallery photos={listing.photos ?? []} />

            {listing.status === "RESERVED" && (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-5 py-4 text-sm font-bold text-blue-800">
                هذا العقار محجوز حاليا بانتظار إتمام الدفع، لذلك لا يظهر في
                نتائج البحث العامة.
              </div>
            )}

            {/* Info: title, location, price, stats, description */}
            <ListingInfo listing={listing} />

            {/* Host */}
            <HostCard host={listing.host} listingId={listing.id} />

            {/* Current tenants */}
            <section className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
              <h2 className="text-lg font-black text-[#0f172a]">
                السكان الحاليون
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                هذه المعلومات تُظهر المستأجرين الذين تم تأكيدهم أو يتم الاحتفاظ
                بمكان لهم حالياً.
              </p>

              {currentTenants.length > 0 ? (
                <div className="mt-4 grid gap-3">
                  {currentTenants.map((booking) => (
                    <Link
                      key={booking.id}
                      to={`/expatriate/guests/${booking.guest.id}`}
                      aria-label={`عرض الملف العام لـ ${booking.guest.firstName || "المستأجر"}`}
                      className="group"
                    >
                      <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 transition hover:border-slate-200 hover:bg-slate-100 cursor-pointer">
                        {booking.guest.avatarUrl ? (
                          <img
                            src={booking.guest.avatarUrl}
                            alt={`${booking.guest.firstName} ${booking.guest.lastName}`}
                            className="h-14 w-14 rounded-full object-cover"
                          />
                        ) : (
                          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1752F0] text-base font-black text-white">
                            {booking.guest.firstName
                              ?.charAt(0)
                              ?.toUpperCase() || "م"}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-[#0f172a] truncate">
                            {`${booking.guest.firstName || ""} ${booking.guest.lastName || ""}`.trim() ||
                              "مستأجر"}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {booking.room?.roomName ||
                              booking.selectedRoomName ||
                              "غير محدد"}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-2">
                            {getGuestPreferences(booking.guest)
                              .slice(0, 3)
                              .map((key) => (
                                <span
                                  key={`${booking.id}-${key}`}
                                  className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-600"
                                >
                                  {getPreferenceLabel(key)}
                                </span>
                              ))}
                          </div>

                          {myPreferences.length > 0 && (
                            <div className="mt-3 rounded-2xl bg-slate-100 px-3 py-2 text-xs text-slate-600">
                              <div className="font-black text-[11px] text-slate-900">
                                توافق التفضيلات:
                              </div>
                              <div className="mt-1 text-[11px]">
                                {formatCompatibilityText(
                                  compatibilityMap.get(booking.id) ?? 0,
                                  getGuestPreferences(booking.guest).length,
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="rounded-full bg-[#EEF3FF] px-3 py-1 text-xs font-black text-[#1752F0]">
                            {getRoommateBadgeText(booking.status)}
                          </div>
                          <div className="rounded-2xl bg-slate-100 px-3 py-2 text-right text-xs text-slate-600">
                            <div className="font-black text-[11px] text-slate-900">
                              تقييم:{" "}
                              {booking.guest.averageRating?.toFixed(1) ?? "0.0"}
                            </div>
                            <div className="text-[11px]">
                              {booking.guest.reviewCount ?? 0} مراجعة
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-5 text-sm text-slate-500">
                  لا يوجد سكان حاليون في هذا العقار حتى الآن.
                </div>
              )}
            </section>

            {/* Amenities */}
            <AmenitiesSection amenities={listing.amenities ?? []} />

            {/* Location Insight */}
            <LocationInsightButton listingId={listing.id} />

            {/* Reviews */}
            <ListingReviewsSection listingId={listing.id} />
          </div>
        </div>
      )}
    </div>
  );
}
