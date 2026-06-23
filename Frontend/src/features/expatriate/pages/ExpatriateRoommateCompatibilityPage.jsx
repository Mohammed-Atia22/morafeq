import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usersApi } from "../../profile/services/usersApi";
import { useAuth } from "../../auth/hooks/useAuth";

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
        توافق الزملاء
      </span>
    </nav>
  );
}

function getCompatibilityBadgeText(score) {
  if (score >= 90) return "توافق ممتاز";
  if (score >= 80) return "مناسب جدًا لك";
  if (score >= 65) return "مناسب إلى حد جيد";
  if (score >= 50) return "توافق متوسط";
  return "قد تحتاج لمراجعة التفاصيل قبل الحجز";
}

function getCompatibilityColor(score) {
  if (score >= 90) return "bg-[#18C57A] text-white shadow-emerald-200";
  if (score >= 80) return "bg-[#1557E6] text-white shadow-blue-200";
  if (score >= 50) return "bg-[#F5A400] text-white shadow-amber-200";
  return "bg-[#EF4444] text-white shadow-red-200";
}

function RoommateCard({ roommate }) {
  const compatibility = roommate.compatibility || {};
  const score = compatibility.score || 0;
  const level = compatibility.level || getCompatibilityBadgeText(score);
  const reasons = compatibility.topMatchReasons || [];
  const warnings = compatibility.topWarnings || [];

  const displayName =
    roommate.displayName ||
    `${roommate.firstName || ""} ${roommate.lastName || ""}`.trim() ||
    "زميل سكن";

  return (
    <article className="relative flex min-h-[294px] flex-col overflow-hidden rounded-[22px] border border-[#E4EAF5] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_34px_rgba(15,23,42,0.12)]">
      <div
        className={`absolute left-5 top-5 z-10 flex h-[50px] w-[50px] flex-col items-center justify-center rounded-full border-[3px] border-white text-center text-[10px] font-black leading-[1.05] shadow-lg ${getCompatibilityColor(
          score,
        )}`}
      >
        <span className="text-[13px]">{score}%</span>
        <span>توافق</span>
      </div>

      {/* Roommate Info */}
      <div className="flex flex-1 flex-col px-5 pb-4 pt-5">
        <div className="flex items-start gap-4 pl-14">
          {/* Avatar */}
          {roommate.avatarUrl ? (
            <img
              src={roommate.avatarUrl}
              alt={displayName}
              className="h-[62px] w-[62px] shrink-0 rounded-2xl object-cover shadow-sm ring-1 ring-slate-100"
            />
          ) : (
            <div className="grid h-[62px] w-[62px] shrink-0 place-items-center rounded-2xl bg-[#1752F0] text-xl font-black text-white shadow-sm">
              {displayName.charAt(0)?.toUpperCase() || "ز"}
            </div>
          )}

          {/* Name and Info */}
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="truncate text-lg font-black leading-6 text-[#0B1B35]">
              {displayName}
            </h3>

            {/* University & Faculty */}
            <div className="mt-1 text-xs text-slate-500">
              {roommate.university && (
                <span className="font-semibold">{roommate.university}</span>
              )}
              {roommate.faculty && roommate.university && <span> · </span>}
              {roommate.faculty && (
                <span className="font-semibold">{roommate.faculty}</span>
              )}
            </div>

            {/* Academic Year */}
            {roommate.academicYear && (
              <p className="mt-1 text-xs text-slate-500">
                {roommate.academicYear}
              </p>
            )}

            {/* Verification */}
            {roommate.verificationStatus === "APPROVED" && (
              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-black text-emerald-700">
                تم التحقق ✓
              </div>
            )}
          </div>
        </div>

        {/* Interests */}
        {roommate.interests && roommate.interests.length > 0 && (
          <div className="mt-5 flex min-h-[82px] flex-col">
            <p className="mb-2 text-xs font-black text-[#0B1B35]">الاهتمامات</p>
            <div className="flex flex-wrap gap-1.5">
              {roommate.interests.slice(0, 5).map((interest, index) => (
                <span
                  key={index}
                  className="rounded-full bg-[#EEF3FA] px-2.5 py-1 text-[11px] font-bold leading-5 text-slate-600"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Match Reasons */}
        {reasons.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-black text-[#0B1B35]">أسباب التوافق</p>
            {reasons.slice(0, 3).map((reason, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs font-semibold text-emerald-700"
              >
                <span>✅</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="mt-4 space-y-1.5">
            <p className="text-xs font-black text-[#0B1B35]">تنبيهات</p>
            {warnings.slice(0, 2).map((warning, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-xs font-semibold text-amber-700"
              >
                <span>⚠️</span>
                <span>{warning}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View Profile Button */}
      <div className="border-t border-[#EEF2F7] bg-[#FBFCFE] px-4 py-3">
        {roommate.user?.id ? (
          <Link
            to={`/expatriate/guests/${roommate.user.id}`}
            className="block rounded-xl bg-[#1752F0] px-4 py-2.5 text-center text-sm font-black text-white shadow-[0_8px_18px_rgba(23,82,240,0.22)] transition hover:bg-[#1240C4]"
          >
            عرض الملف الشخصي
          </Link>
        ) : (
          <button
            disabled
            className="block w-full rounded-xl bg-slate-300 px-4 py-2.5 text-center text-sm font-black text-slate-500 cursor-not-allowed"
          >
            عرض الملف الشخصي
          </button>
        )}
      </div>
    </article>
  );
}

export function ExpatriateRoommateCompatibilityPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      if (!user?.id) {
        setError("يجب تسجيل الدخول لعرض توافق الزملاء");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const resp = await usersApi.getListingRoommateMatches(id);
        if (!mounted) return;
        setData(resp);
      } catch (e) {
        if (mounted) {
          setError(e.message || "فشل في تحميل بيانات التوافق");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => {
      mounted = false;
    };
  }, [id, user]);

  const listingCompatibility = data?.listingCompatibility;
  const roommates = data?.roommates || [];

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
          <div className="h-64 rounded-2xl bg-slate-200" />
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[294px] rounded-[22px] bg-slate-200" />
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      {!loading && data && (
        <>
          {/* Header */}
          <section className="space-y-5">
            <div className="mx-auto max-w-xl text-center">
              <h1 className="text-2xl font-black text-[#0B1B35]">
                توافق الزملاء
              </h1>
              <p className="mt-2 text-sm font-medium text-slate-500">
                تعرف على نسبة توافقك مع الشقة والزملاء الحاليين.
              </p>
            </div>

            {/* Listing Compatibility Summary */}
            {listingCompatibility && (
              <div className="rounded-2xl border border-[#E4EAF5] bg-white px-6 py-6 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-black text-[#0B1B35]">
                    توافق الشقة معك
                  </h2>
                  <div
                    className={`flex h-16 w-16 flex-col items-center justify-center rounded-full text-center text-sm font-black leading-tight shadow-lg ${getCompatibilityColor(
                      listingCompatibility.score,
                    )}`}
                  >
                    <span className="text-xl">
                      {listingCompatibility.score}%
                    </span>
                    <span className="text-[10px]">توافق</span>
                  </div>
                </div>

                <p className="mb-4 text-sm font-semibold text-slate-600">
                  {listingCompatibility.summary ||
                    getCompatibilityBadgeText(listingCompatibility.score)}
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">
                      توافق مواصفات الشقة
                    </p>
                    <p className="mt-1 text-lg font-black text-[#0B1B35]">
                      {listingCompatibility.propertyScore || 0}%
                    </p>
                  </div>
                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-xs text-slate-400">
                      متوسط توافق الزملاء
                    </p>
                    <p className="mt-1 text-lg font-black text-[#0B1B35]">
                      {listingCompatibility.roommatesAverageScore || 0}%
                    </p>
                  </div>
                </div>

                {/* Top Match Reasons */}
                {listingCompatibility.topMatchReasons &&
                  listingCompatibility.topMatchReasons.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-black text-[#0B1B35]">
                        أسباب التوافق
                      </p>
                      {listingCompatibility.topMatchReasons
                        .slice(0, 4)
                        .map((reason, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700"
                          >
                            <span>✅</span>
                            <span>{reason}</span>
                          </div>
                        ))}
                    </div>
                  )}

                {/* Top Warnings */}
                {listingCompatibility.topWarnings &&
                  listingCompatibility.topWarnings.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-black text-[#0B1B35]">
                        تنبيهات
                      </p>
                      {listingCompatibility.topWarnings
                        .slice(0, 3)
                        .map((warning, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700"
                          >
                            <span>⚠️</span>
                            <span>{warning}</span>
                          </div>
                        ))}
                    </div>
                  )}
              </div>
            )}
          </section>

          {/* Empty State */}
          {roommates.length === 0 ? (
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
                لا يوجد زملاء مؤكدين في هذا السكن حتى الآن
              </p>
              <p className="mt-2 text-sm text-slate-500">
                لكن هذه هي نسبة توافق الشقة مع تفضيلاتك السكنية.
              </p>
            </div>
          ) : (
            /* Roommate Cards Grid */
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-[#0B1B35]">
                  الزملاء الحاليون ({roommates.length})
                </h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {roommates.map((roommate) => (
                  <RoommateCard key={roommate.userId} roommate={roommate} />
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
