import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useListingDetail } from "../hooks/useListingDetail";
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
      <Link
        to={`/expatriate/listings/${title}`}
        className="transition hover:text-[#1752F0]"
      >
        تفاصيل العقار
      </Link>
      <span>/</span>
      <span className="truncate font-semibold text-slate-600">
        السكان الحاليون
      </span>
    </nav>
  );
}

// ─── Preference labels ─────────────────────────
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

function getCompatibilityColor(percent) {
  if (percent >= 90) return "bg-[#18C57A] text-white shadow-emerald-200";
  if (percent >= 80) return "bg-[#1557E6] text-white shadow-blue-200";
  if (percent >= 50) return "bg-[#F5A400] text-white shadow-amber-200";
  return "bg-[#EF4444] text-white shadow-red-200";
}

// ─── Tenant Card Component ─────────────────────
function TenantCard({ booking, compatibilityPercent }) {
  const guestPrefs = getGuestPreferences(booking.guest);
  const guestName =
    `${booking.guest.firstName || ""} ${booking.guest.lastName || ""}`.trim() ||
    "مستأجر";
  const reviewCount = booking.guest.reviewCount ?? 0;

  return (
    <article className="relative flex min-h-[294px] flex-col overflow-hidden rounded-[22px] border border-[#E4EAF5] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]">
      <div
        className={`absolute right-78 top-5 z-10 flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full border-[3px] border-white text-center text-[10px] font-black leading-[1.05] shadow-lg ${getCompatibilityColor(
          compatibilityPercent
        )}`}
      >
        <span className="text-[13px]">{compatibilityPercent}%</span>
        <span>توافق</span>
      </div>

      {/* Tenant Info */}
      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <div className="flex items-start gap-4 pl-10">
        {/* Avatar */}
        {booking.guest.avatarUrl ? (
          <img
            src={booking.guest.avatarUrl}
            alt={guestName}
            className="h-[62px] w-[62px] shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-slate-100"
          />
        ) : (
          <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-2xl bg-[#1752F0] text-xl font-black text-white shadow-sm">
            {booking.guest.firstName?.charAt(0)?.toUpperCase() || "م"}
          </div>
        )}

        {/* Name and Rating */}
        <div className="min-w-0 flex-1 pt-1">
          <h3 className="truncate text-lg font-black leading-6 text-[#0B1B35]">
            {guestName}
          </h3>
          
          {/* Rating */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4 text-amber-400"
              >
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <span className="font-black text-[#0B1B35]">
                {booking.guest.averageRating?.toFixed(1) ?? "0.0"}
              </span>
            </div>
            <span className="text-slate-300">·</span>
            <span>{reviewCount} تقييم</span>
          </div>

          {/* Current Room */}
          {booking.room?.roomName || booking.selectedRoomName ? (
            <p className="mt-2 line-clamp-1 text-xs font-medium text-slate-500">
              الغرفة الحالية:{" "}
              {booking.room?.roomName || booking.selectedRoomName || "غير محدد"}
            </p>
          ) : null}
        </div>
      </div>

      {/* Preferences */}
        <div className="mt-5 flex min-h-[82px] flex-col">
          <p className="mb-2 text-xs font-black text-[#0B1B35]">التفضيلات</p>
          {guestPrefs.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {guestPrefs.map((key) => (
              <span
                key={key}
                className="rounded-full bg-[#EEF3FA] px-2.5 py-1 text-[11px] font-bold leading-5 text-slate-600"
              >
                {getPreferenceLabel(key)}
              </span>
            ))}
          </div>
          ) : (
            <p className="rounded-full bg-[#F4F7FB] px-3 py-1.5 text-xs font-bold text-slate-400">
              لا توجد تفضيلات مضافة
            </p>
          )}
        </div>
      </div>

      {/* View Profile Button */}
      <div className="border-t border-[#EEF2F7] bg-[#FBFCFE] px-4 py-3">
        <Link
          to={`/expatriate/guests/${booking.guest.id}`}
          className="block rounded-xl bg-[#1752F0] px-4 py-2.5 text-center text-sm font-black text-white shadow-[0_8px_18px_rgba(23,82,240,0.22)] transition hover:bg-[#1240C4]"
        >
          عرض الملف الشخصي
        </Link>
      </div>
    </article>
  );
}

// ─── Main Page Component ───────────────────────
export function ExpatriateCurrentTenantsPage() {
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
      currentTenants.map((booking) => {
        const guestPrefs = getGuestPreferences(booking.guest);
        const score = calculateCompatibilityScore(mySet, guestPrefs);
        const percent = guestPrefs.length > 0
          ? Math.round((score / guestPrefs.length) * 100)
          : 0;
        return [booking.id, percent];
      }),
    );
  }, [currentTenants, myPreferences]);

  const averageCompatibility = useMemo(() => {
    if (!currentTenants.length) return 0;
    const total = currentTenants.reduce(
      (sum, booking) => sum + (compatibilityMap.get(booking.id) ?? 0),
      0,
    );
    return Math.round(total / currentTenants.length);
  }, [compatibilityMap, currentTenants]);

  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb title={id} />

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-50 px-5 py-4 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="animate-pulse space-y-6">
          <div className="mx-auto h-20 max-w-md rounded-3xl bg-slate-200" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[294px] rounded-[22px] bg-slate-200" />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && listing && (
        <>
          {/* Header */}
          <section className="space-y-5">
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-2xl font-black text-[#0B1B35]">
                السكان الحاليون
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                تعرف على المستأجرين الحاليين ونسبة التوافق معهم قبل الحجز.
              </p>
              {listing.title && (
                <p className="mx-auto mt-2 max-w-md truncate text-xs font-bold text-[#1752F0]">
                  {listing.title}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-[#E4EAF5] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                <p className="text-2xl font-black text-[#0B1B35]">
                  {currentTenants.length}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  ساكن حالي
                </p>
              </div>
              <div className="rounded-2xl border border-[#E4EAF5] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                <p className="text-2xl font-black text-[#0B1B35]">
                  {averageCompatibility}%
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  متوسط التوافق
                </p>
              </div>
              <div className="rounded-2xl border border-[#E4EAF5] bg-white px-5 py-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                <p className="text-2xl font-black text-[#0B1B35]">
                  {myPreferences.length}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  تفضيلاتك للمطابقة
                </p>
              </div>
            </div>
          </section>

          {/* Empty State */}
          {currentTenants.length === 0 ? (
            <div className="rounded-[22px] border border-[#E4EAF5] bg-white px-6 py-12 text-center shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#EEF3FA]">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="h-8 w-8 text-slate-400"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <p className="mt-4 text-base font-bold text-slate-700">
                لا يوجد مستأجرون حاليون
              </p>
              <p className="mt-2 text-sm text-slate-500">
                لا يوجد مستأجرون حاليون في هذا العقار حتى الآن.
              </p>
            </div>
          ) : (
            /* Tenant Cards Grid */
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {currentTenants.map((booking) => (
                <TenantCard
                  key={booking.id}
                  booking={booking}
                  compatibilityPercent={compatibilityMap.get(booking.id) ?? 0}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
