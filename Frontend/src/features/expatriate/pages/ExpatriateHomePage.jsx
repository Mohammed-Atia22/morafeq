import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { useListings } from "../hooks/useListings";
import { ListingsGrid } from "../components/home/ListingsGrid";
import { useFavoriteToggle } from "../../favorites/hooks/useFavoriteToggle";
import { useFavorites } from "../../favorites/hooks/useFavorites";
import { useBooking } from "../../bookings/hooks/useBooking";
import { useProfile } from "../../profile/hooks/useProfile";
import { useGuestReviews } from "../../reviews/hooks/useGuestReviews";
import { useChatContext } from "../../chat/context/ChatContext";

export function ExpatriateHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { listings, meta, loading, error, fetchListings } = useListings();
  const { total: favoritesTotal } = useFavorites({ limit: 3 });
  const {
    bookings,
    loading: bookingsLoading,
    fetchBookings,
  } = useBooking();
  const { profile, completeness } = useProfile();
  const { meta: reviewMeta } = useGuestReviews(user?.id);
  const { conversations, isLoading: messagesLoading } = useChatContext();
  const [displayListings, setDisplayListings] = useState([]);

  useEffect(() => {
    setDisplayListings(listings);
  }, [listings]);

  const handleFavoriteChanged = useCallback((listingId, isFavorited) => {
    setDisplayListings((prev) =>
      prev.map((listing) =>
        listing.id === listingId ? { ...listing, isFavorited } : listing,
      ),
    );
  }, []);

  const { pendingIds, toggleFavorite } = useFavoriteToggle({
    onChanged: handleFavoriteChanged,
  });

  // Fetch latest listings on mount — no filters, sorted by newest
  useEffect(() => {
    fetchListings({ limit: 6 });
    fetchBookings();
  }, [fetchBookings, fetchListings]);

  const metrics = useMemo(
    () => buildDashboardMetrics(bookings, profile, completeness),
    [bookings, completeness, profile],
  );

  return (
    <div dir="rtl" className="mx-auto max-w-6xl space-y-6">
      <section className="grid gap-5 xl:grid-cols-[2.1fr_1fr_1fr]">
        <DashboardWelcome
          firstName={user?.firstName}
          totalListings={meta?.total ?? 0}
          activeBookings={metrics.activeBookings}
        />
        <StatCard
          title="الشقق المحفوظة"
          value={favoritesTotal.toLocaleString("ar-EG")}
          subtitle="وصول سريع للمفضلة"
          tone="emerald"
          to="/expatriate/favorites"
        />
        <StatCard
          title={bookingsLoading ? "جاري تحميل الحجوزات" : "طلبات الحجز"}
          value={metrics.pendingBookings.toLocaleString("ar-EG")}
          subtitle="طلبات معلقة"
          tone="amber"
          to="/expatriate/bookings"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-1">
        <CurrentBookingCard booking={metrics.currentBooking} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <BookingsOverview metrics={metrics} />
        <ReviewsCard meta={reviewMeta} />
      </section>

      <QuickActions onNavigate={navigate} />

      <MessagesAndAiCard conversations={conversations} loading={messagesLoading} />

      {/* Listings section */}
      <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
        <ListingsGrid
          listings={displayListings}
          loading={loading}
          error={error}
          title="ترشيحات السكن"
          subtitle="أحدث الوحدات المتاحة من بيانات المنصة"
          onFavoriteToggle={toggleFavorite}
          pendingFavoriteIds={pendingIds}
        />
      </section>
    </div>
  );
}

function buildDashboardMetrics(bookings, profile, completeness) {
  const activeStatuses = ["PENDING_PAYMENT", "CHECK_IN_PENDING", "COMPLETED"];
  const rejectedStatuses = [
    "REJECTED",
    "CANCELLED_BY_GUEST",
    "CANCELLED_BY_HOST",
    "CANCELED",
    "EXPIRED",
    "REFUNDED",
    "CANCELLED_AFTER_DISPUTE",
  ];

  return {
    activeBookings: bookings.filter((booking) =>
      activeStatuses.includes(booking.status),
    ).length,
    pendingBookings: bookings.filter((booking) =>
      ["PENDING_HOST_APPROVAL", "PENDING_PAYMENT"].includes(booking.status),
    ).length,
    acceptedBookings: bookings.filter((booking) =>
      activeStatuses.includes(booking.status),
    ).length,
    rejectedBookings: bookings.filter((booking) =>
      rejectedStatuses.includes(booking.status),
    ).length,
    currentBooking:
      bookings.find((booking) => activeStatuses.includes(booking.status)) ??
      bookings[0] ??
      null,
    roommateProfileCompleted: profile?.roommateProfileCompleted || false,
    profileFactors: [
      { label: "الصورة الشخصية", complete: Boolean(profile?.avatarUrl) },
      {
        label: "التحقق",
        complete: profile?.verificationStatus === "APPROVED",
      },
      { label: "بيانات التوافق", complete: profile?.roommateProfileCompleted || false },
      {
        label: "المعلومات الأساسية",
        complete: Boolean(profile?.firstName && profile?.lastName && profile?.phone),
      },
    ],
    completeness,
  };
}

function DashboardWelcome({ firstName, totalListings, activeBookings }) {
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative min-h-[150px] overflow-hidden rounded-[24px] bg-[#1f5bd7] px-6 py-6 text-white shadow-[0_18px_36px_rgba(31,91,215,0.22)]">
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute bottom-0 left-8 h-24 w-24 rounded-full bg-[#0b4779]/30" />
      <div className="relative">
        <h1 className="text-2xl font-black">مساء الخير، {firstName ?? "مرحباً"}!</h1>
        <p className="mt-2 text-sm font-semibold text-white/75">
          ابحث عن سكنك المثالي بسهولة وأمان - {today}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/10 backdrop-blur">
            {Number(totalListings || 0).toLocaleString("ar-EG")} شقة متاحة
          </span>
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/10 backdrop-blur">
            {activeBookings.toLocaleString("ar-EG")} حجوزات حالية
          </span>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value, subtitle, tone, to }) {
  const toneClass = {
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-[#1f5bd7]",
  }[tone];

  return (
    <Link
      to={to}
      className="rounded-[22px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(31,57,104,0.12)]"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400">{title}</p>
          <p className="mt-4 text-3xl font-black text-[#111D35]">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${toneClass}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{subtitle}</p>
    </Link>
  );
}

function CurrentBookingCard({ booking }) {
  const listing = booking?.listing;

  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="حجزي الحالي" subtitle="آخر حالة حجز متاحة" />
      {booking ? (
        <div className="mt-5 rounded-2xl bg-[#F6F8FE] p-4">
          <p className="text-sm font-black text-[#111D35]">
            {listing?.title || "حجز سكن"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {getBookingStatusLabel(booking.status)}
          </p>
          <Link
            to={`/expatriate/bookings/${booking.id}`}
            className="mt-4 block h-10 rounded-xl border border-[#C9D8FF] px-4 py-2 text-center text-sm font-black text-[#1f5bd7]"
          >
            عرض التفاصيل
          </Link>
        </div>
      ) : (
        <EmptyHint text="لا توجد حجوزات حالية حتى الآن." />
      )}
    </section>
  );
}

function ProfileCompletionCard({ completeness, factors, verificationStatus }) {
  const isVerified = verificationStatus === "APPROVED";

  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="ملفي" subtitle="اكتمال الملف الشخصي" />
      <div className="mt-5">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-black text-[#111D35]">{completeness}%</p>
          <span
            className={`rounded-full px-3 py-1 text-xs font-black ${
              isVerified
                ? "bg-emerald-50 text-emerald-600"
                : "bg-amber-50 text-amber-600"
            }`}
          >
            {isVerified ? "موثق" : "بحاجة للتوثيق"}
          </span>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF3FB]">
          <div
            className="h-full rounded-full bg-[#1f5bd7]"
            style={{ width: `${Math.min(100, completeness)}%` }}
          />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {factors.map((factor) => (
            <span
              key={factor.label}
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                factor.complete
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {factor.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function RoommateProfileCard({ isComplete }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="مطابقة الزملاء" subtitle="بيانات التوافق" />
      <div className="mt-5 rounded-2xl bg-[#F6F8FE] p-4">
        <p className="text-2xl font-black text-[#111D35]">
          {isComplete ? "مكتملة" : "غير مكتملة"}
        </p>
        <p className="mt-1 text-xs font-bold text-slate-500">
          {isComplete ? "بيانات التوافق جاهزة للمطابقة" : "أكمل بيانات التوافق لتحسين المطابقة"}
        </p>
        <Link
          to="/expatriate/profile/roommate-profile"
          className="mt-4 block h-10 rounded-xl bg-[#1f5bd7] px-4 py-2 text-center text-sm font-black text-white"
        >
          {isComplete ? "تعديل بيانات التوافق" : "إكمال بيانات التوافق"}
        </Link>
      </div>
    </section>
  );
}

function BookingsOverview({ metrics }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="الحجوزات" subtitle="ملخص الطلبات" />
      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MiniStat label="الحالية" value={metrics.activeBookings} />
        <MiniStat label="المعلقة" value={metrics.pendingBookings} />
        <MiniStat label="المقبولة" value={metrics.acceptedBookings} />
        <MiniStat label="المرفوضة" value={metrics.rejectedBookings} />
      </div>
    </section>
  );
}

function ReviewsCard({ meta }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="التقييمات" subtitle="تقييمات حسابك" />
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F6F8FE] px-5 py-5">
        <div>
          <p className="text-4xl font-black text-[#111D35]">
            {Number(meta?.averageRating || 0).toFixed(1)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">متوسط التقييم</p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-black text-[#1f5bd7]">
            {Number(meta?.total || 0).toLocaleString("ar-EG")}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">تقييم</p>
        </div>
      </div>
    </section>
  );
}

function MessagesAndAiCard({ conversations, loading }) {
  const conversationCount = Array.isArray(conversations) ? conversations.length : 0;

  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="التواصل ورفيق" subtitle="رسائلك والمساعد الذكي" />
      <div className="mt-5 grid gap-3">
        <Link
          to="/expatriate/messages"
          className="rounded-2xl bg-[#F6F8FE] px-4 py-3"
        >
          <p className="text-lg font-black text-[#111D35]">
            {loading
              ? "الرسائل"
              : conversationCount.toLocaleString("ar-EG")}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {conversationCount === 0 ? "انتقل إلى صفحة الرسائل" : "محادثات"}
          </p>
        </Link>
        <div className="rounded-2xl bg-blue-50 px-4 py-3 text-[#1f5bd7]">
          <p className="text-sm font-black">رفيق جاهز لمساعدتك</p>
          <p className="mt-1 text-xs font-bold opacity-80">
            افتح المساعد من الزر العائم أسفل الصفحة.
          </p>
        </div>
      </div>
    </section>
  );
}

function QuickActions({ onNavigate }) {
  const actions = [
    { label: "تصفح الشقق", path: "/expatriate/search" },
    { label: "الشقق المحفوظة", path: "/expatriate/favorites" },
    { label: "حجوزاتي", path: "/expatriate/bookings" },
    { label: "الرسائل", path: "/expatriate/messages" },
    { label: "الملف الشخصي", path: "/expatriate/profile" },
    { label: "بيانات التوافق", path: "/expatriate/profile/roommate-profile" },
  ];

  return (
    <section>
      <h2 className="mb-4 text-xl font-black text-[#111D35]">خدمات سريعة</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={() => onNavigate(action.path)}
            className="rounded-[22px] border border-[#E5EBF6] bg-white px-4 py-5 text-sm font-black text-[#111D35] shadow-[0_14px_32px_rgba(31,57,104,0.08)] transition hover:-translate-y-0.5 hover:text-[#1f5bd7]"
          >
            {action.label}
          </button>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F6F8FE] px-4 py-3">
      <p className="text-lg font-black text-[#111D35]">
        {Number(value || 0).toLocaleString("ar-EG")}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div>
      <h2 className="text-xl font-black text-[#111D35]">{title}</h2>
      <p className="mt-1 text-xs font-semibold text-slate-400">{subtitle}</p>
    </div>
  );
}

function EmptyHint({ text }) {
  return (
    <div className="mt-5 rounded-2xl bg-[#F6F8FE] px-4 py-8 text-center text-sm font-bold text-slate-500">
      {text}
    </div>
  );
}

function getBookingStatusLabel(status) {
  const labels = {
    PENDING_HOST_APPROVAL: "بانتظار موافقة المالك",
    PENDING_PAYMENT: "بانتظار الدفع",
    CHECK_IN_PENDING: "تم الدفع - بانتظار الانتقال",
    COMPLETED: "مكتمل",
    REJECTED: "مرفوض",
    CANCELLED_BY_GUEST: "ملغي من قبلك",
    CANCELLED_BY_HOST: "ملغي من المالك",
    CANCELED: "ملغي",
    EXPIRED: "انتهت المهلة",
    REFUNDED: "تم الاسترداد",
    DISPUTED: "نزاع قائم",
  };

  return labels[status] || status || "غير محدد";
}
