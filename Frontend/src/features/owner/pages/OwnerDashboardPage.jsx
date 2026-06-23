import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import toast from "react-hot-toast";
import { AddListingForm } from "../../listings/components";
import { DashboardState } from "../components/dashboard/DashboardState";
import { MobileOwnerNav } from "../components/dashboard/MobileOwnerNav";
import { OwnerApartmentsList } from "../components/dashboard/OwnerApartmentsList";
import { OwnerStats } from "../components/dashboard/OwnerStats";
import { OwnerWelcomeCard } from "../components/dashboard/OwnerWelcomeCard";
import { StatusTabs } from "../components/dashboard/StatusTabs";
import { DeleteListingDialog } from "../components/listing-card/DeleteListingDialog";
import { ListingCard } from "../components/listing-card/ListingCard";
import { useHostReviews } from "../../reviews/hooks/useHostReviews";
import { fallbackImages } from "../constants/ownerDashboard";
import { useOwnerListings } from "../hooks/useOwnerListings";
import { useOwnerRequests } from "../hooks/useOwnerRequests";
import { useWallet } from "../hooks/useWallet";

export function OwnerPage() {
  const { user, logout } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleUnauthorized = useCallback(() => {
    logout();
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  const {
    activeFilter,
    addListing,
    deleteListing,
    deletingId,
    error,
    filteredListings,
    listings,
    loading,
    setActiveFilter,
    stats,
  } = useOwnerListings({ onUnauthorized: handleUnauthorized });

  const { wallet, loading: walletLoading, fetchWallet } = useWallet();
  const {
    requests,
    loading: requestsLoading,
    fetchRequests,
  } = useOwnerRequests();
  const {
    meta: hostReviewMeta,
    loading: reviewsLoading,
  } = useHostReviews(user?.id);

  const dashboardMetrics = buildDashboardMetrics(
    listings,
    requests,
    hostReviewMeta,
  );

  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchWallet();
      fetchRequests();
    }
  }, [activeSection, fetchRequests, fetchWallet]);

  useEffect(() => {
    if (location.state?.ownerSection) {
      setActiveSection(location.state.ownerSection);
    }
  }, [location.state]);

  const handleDeleteListing = async () => {
    if (!deleteTarget) return;

    try {
      await deleteListing(deleteTarget.id);
      toast.success("تم حذف العقار بنجاح");
      setDeleteTarget(null);
    } catch (caughtError) {
      toast.error(caughtError.message || "تعذر حذف العقار");
    }
  };

  const handleCreatedListing = (result) => {
    if (result?.listing) {
      addListing(result.listing);
    }

    setActiveSection("listings");
    navigate("/owner", { state: { ownerSection: "listings" }, replace: true });
  };

  const showAddListing = () => {
    setActiveSection("add");
    navigate("/owner", {
      state: { ownerSection: "add", ownerSectionKey: Date.now() },
      replace: true,
    });
  };

  return (
    <div className="min-h-screen bg-[#eef3ff] text-[#172033]" dir="rtl">
      <div className="min-h-screen">
        <main className="min-h-screen px-4 pb-24 pt-5 sm:px-6 lg:px-7 lg:pb-10">
          {activeSection === "add" ? (
            <AddListingForm embedded onCreated={handleCreatedListing} />
          ) : activeSection === "dashboard" ? (
            <div className="space-y-6">
              <DashboardTop
                user={user}
                metrics={dashboardMetrics}
                requestsLoading={requestsLoading}
              />

              <VerificationNotice
                status={user?.verificationStatus}
                onOpenProfile={() => navigate("/owner/profile")}
              />

              <SummaryCards metrics={dashboardMetrics} />

              <section className="grid gap-5 xl:grid-cols-[0.95fr_1.45fr]">
                <FinancialSection wallet={wallet} loading={walletLoading} />
                <OccupancySection metrics={dashboardMetrics} />
              </section>

              <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
                <ReviewsSection
                  metrics={dashboardMetrics}
                  loading={reviewsLoading}
                />
                <BookingSection
                  metrics={dashboardMetrics}
                  loading={requestsLoading}
                />
              </section>

              {loading ? (
                <DashboardState title="جاري تحميل عقاراتك..." />
              ) : error ? (
                <DashboardState title="تعذر تحميل العقارات" text={error} />
              ) : (
                <OwnerApartmentsList
                  listings={listings}
                  fallbackImages={fallbackImages}
                  onAdd={showAddListing}
                  onEdit={(listingId) =>
                    navigate(`/owner/listings/${listingId}/edit`)
                  }
                />
              )}
            </div>
          ) : (
            <>
              <OwnerStats stats={stats} />
              <StatusTabs
                activeFilter={activeFilter}
                onChange={setActiveFilter}
              />

              {loading ? (
                <DashboardState title="جاري تحميل عقاراتك..." />
              ) : error ? (
                <DashboardState title="تعذر تحميل العقارات" text={error} />
              ) : filteredListings.length ? (
                <section className="mt-4 grid gap-4 xl:grid-cols-2">
                  {filteredListings.map((listing, index) => (
                    <ListingCard
                      key={listing.id}
                      listing={listing}
                      fallbackImage={
                        fallbackImages[index % fallbackImages.length]
                      }
                      onEdit={() =>
                        navigate(`/owner/listings/${listing.id}/edit`)
                      }
                      onDelete={() => setDeleteTarget(listing)}
                    />
                  ))}
                </section>
              ) : (
                <DashboardState
                  title="لا توجد عقارات في هذا القسم"
                  text="ابدأ بإضافة شقة جديدة أو جرّب فلتر آخر."
                />
              )}
            </>
          )}
        </main>

        {deleteTarget ? (
          <DeleteListingDialog
            listing={deleteTarget}
            deleting={deletingId === deleteTarget.id}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={handleDeleteListing}
          />
        ) : null}

        <MobileOwnerNav
          activeSection={activeSection}
          onSectionChange={(section) => {
            if (section === "add") {
              showAddListing();
              return;
            }

            setActiveSection(section);
          }}
          onSettings={() => navigate("/owner/settings")}
        />
      </div>
    </div>
  );
}

function buildDashboardMetrics(listings, requests, hostReviewMeta = {}) {
  const approvedStatuses = ["ACTIVE", "APPROVED"];
  const pendingStatuses = ["DRAFT", "PENDING_APPROVAL"];
  const rejectedStatuses = ["REJECTED", "SUSPENDED"];
  const bookedStatuses = ["PENDING_PAYMENT", "CHECK_IN_PENDING", "COMPLETED"];
  const cancelledStatuses = [
    "REJECTED",
    "CANCELLED_BY_GUEST",
    "CANCELLED_BY_HOST",
    "CANCELED",
    "EXPIRED",
    "REFUNDED",
  ];

  const totalCapacity = listings.reduce(
    (sum, listing) => sum + Number(listing.maxTenants || 0),
    0,
  );
  const reservedPlaces = listings.reduce(
    (sum, listing) => sum + Number(listing.reservedPlaces || 0),
    0,
  );
  const remainingPlaces = listings.reduce((sum, listing) => {
    const available = listing.availablePlaces;
    return (
      sum +
      Number(
        available ?? Math.max(0, Number(listing.maxTenants || 0) - Number(listing.reservedPlaces || 0)),
      )
    );
  }, 0);
  const reviewCount = Number(hostReviewMeta.total || 0);
  const averageRating = Number(hostReviewMeta.averageRating || 0);
  const rooms = listings
    .flatMap((listing) =>
      (listing.rooms || []).map((room) => ({
        id: `${listing.id}-${room.id}`,
        name: room.roomName || "غرفة",
        listingTitle: listing.title,
        occupied: Number(room.occupiedCount || 0),
        capacity: Number(room.capacity || 0),
      })),
    )
    .slice(0, 5);

  return {
    listingsTotal: listings.length,
    approvedListings: listings.filter((listing) =>
      approvedStatuses.includes(listing.status),
    ).length,
    pendingListings: listings.filter((listing) =>
      pendingStatuses.includes(listing.status),
    ).length,
    rejectedListings: listings.filter((listing) =>
      rejectedStatuses.includes(listing.status),
    ).length,
    totalCapacity,
    reservedPlaces,
    remainingPlaces,
    occupancyPercent: totalCapacity
      ? Math.round((reservedPlaces / totalCapacity) * 100)
      : 0,
    reviewCount,
    averageRating,
    rooms,
    requestsTotal: requests.length,
    newRequests: requests.filter(
      (request) => request.status === "PENDING_HOST_APPROVAL",
    ).length,
    pendingRequests: requests.filter((request) =>
      ["PENDING_HOST_APPROVAL", "PENDING_PAYMENT"].includes(request.status),
    ).length,
    acceptedRequests: requests.filter((request) =>
      bookedStatuses.includes(request.status),
    ).length,
    rejectedRequests: requests.filter((request) =>
      cancelledStatuses.includes(request.status),
    ).length,
  };
}

function DashboardTop({ user, metrics, requestsLoading }) {
  return (
    <section className="grid gap-5 xl:grid-cols-[2.1fr_1fr_1fr]">
      <OwnerWelcomeCard
        user={user}
        approvedListingsCount={metrics.approvedListings}
        pendingRequestsCount={metrics.newRequests}
      />
      <KpiCard
        label="العقارات المرفوضة"
        value={metrics.rejectedListings.toLocaleString("ar-EG")}
        hint="مرفوضة أو معلقة"
        tone="orange"
      />
      <KpiCard
        label={requestsLoading ? "جاري تحميل الطلبات" : "طلبات الإيجار"}
        value={metrics.newRequests.toLocaleString("ar-EG")}
        hint="طلبات بانتظار موافقتك"
        tone="emerald"
      />
    </section>
  );
}

function SummaryCards({ metrics }) {
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <KpiCard
        label="عدد العقارات"
        value={metrics.listingsTotal.toLocaleString("ar-EG")}
        hint={`${metrics.approvedListings.toLocaleString("ar-EG")} معتمد`}
        tone="blue"
      />
      <KpiCard
        label="قيد المراجعة"
        value={metrics.pendingListings.toLocaleString("ar-EG")}
        hint="مسودات أو بانتظار الموافقة"
        tone="amber"
      />
      <KpiCard
        label="الأماكن المحجوزة"
        value={metrics.reservedPlaces.toLocaleString("ar-EG")}
        hint={`من أصل ${metrics.totalCapacity.toLocaleString("ar-EG")} مكان`}
        tone="violet"
      />
    </section>
  );
}

function KpiCard({ label, value, hint, tone = "blue" }) {
  const toneClass = {
    blue: "bg-blue-50 text-[#1f5bd7]",
    emerald: "bg-emerald-50 text-emerald-600",
    amber: "bg-amber-50 text-amber-600",
    violet: "bg-violet-50 text-violet-600",
    orange: "bg-orange-50 text-orange-600",
  }[tone];

  return (
    <div className="rounded-[22px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-slate-400">{label}</p>
          <p className="mt-4 text-2xl font-black text-[#111D35]">{value}</p>
        </div>
        <span className={`grid h-10 w-10 place-items-center rounded-2xl ${toneClass}`}>
          <span className="h-2.5 w-2.5 rounded-full bg-current" />
        </span>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-500">{hint}</p>
    </div>
  );
}

function VerificationNotice({ status, onOpenProfile }) {
  if (status === "APPROVED") return null;

  const label =
    status === "PENDING"
      ? "حسابك قيد المراجعة"
      : status === "REJECTED"
        ? "يرجى مراجعة توثيق حسابك"
        : "أكمل توثيق حسابك";

  return (
    <section className="flex flex-col gap-3 rounded-[22px] border border-amber-200 bg-amber-50/70 px-5 py-4 text-amber-800 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-sm font-black">{label}</h2>
        <p className="mt-1 text-xs font-semibold">
          التوثيق يساعد على ظهور عقاراتك بثقة أكبر للطلاب والمغتربين.
        </p>
      </div>
      <button
        type="button"
        onClick={onOpenProfile}
        className="h-10 rounded-xl bg-amber-500 px-4 text-sm font-black text-white transition hover:bg-amber-600"
      >
        توثيق الحساب
      </button>
    </section>
  );
}

function FinancialSection({ wallet, loading }) {
  if (loading && !wallet) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <div className="h-32 animate-pulse rounded-[22px] bg-slate-100" />
        <div className="h-32 animate-pulse rounded-[22px] bg-slate-100" />
      </div>
    );
  }

  const pendingVal = wallet?.summary?.pendingBalance ?? 0;
  const availableVal = wallet?.summary?.availableBalance ?? 0;

  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="الأموال" subtitle="ملخص المحفظة" />
      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
        <MoneyCard
          label="الأموال المعلقة"
          value={pendingVal}
          className="border-amber-100 bg-amber-50/50 text-amber-600"
        />
        <MoneyCard
          label="الأموال المستلمة"
          value={availableVal}
          className="border-emerald-100 bg-emerald-50/60 text-emerald-600"
        />
      </div>
    </section>
  );
}

function MoneyCard({ label, value, className }) {
  return (
    <div className={`rounded-2xl border p-4 ${className}`}>
      <p className="text-xs font-black opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-black">
        {Number(value || 0).toLocaleString("ar-EG")} ج.م
      </p>
    </div>
  );
}

function OccupancySection({ metrics }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle title="نسبة الإشغال" subtitle="السعة والأماكن المتاحة" />
      <div className="mt-6">
        <div className="flex items-end justify-between">
          <p className="text-4xl font-black text-[#111D35]">
            {metrics.occupancyPercent}%
          </p>
          <p className="text-xs font-bold text-slate-500">
            {metrics.reservedPlaces.toLocaleString("ar-EG")} /{" "}
            {metrics.totalCapacity.toLocaleString("ar-EG")}
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-[#EEF3FB]">
          <div
            className="h-full rounded-full bg-[#1f5bd7]"
            style={{ width: `${Math.min(100, metrics.occupancyPercent)}%` }}
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <MiniStat label="السعة الكلية" value={metrics.totalCapacity} />
          <MiniStat label="محجوز" value={metrics.reservedPlaces} />
          <MiniStat label="متبقي" value={metrics.remainingPlaces} />
        </div>
      </div>
      <RoomOverview rooms={metrics.rooms} />
    </section>
  );
}

function RoomOverview({ rooms }) {
  if (!rooms.length) return null;

  return (
    <div className="mt-5 grid gap-2">
      {rooms.map((room) => (
        <div
          key={room.id}
          className="flex items-center justify-between rounded-2xl bg-[#F5F8FE] px-4 py-3"
        >
          <div className="min-w-0">
            <p className="truncate text-xs font-black text-[#111D35]">
              {room.name}
            </p>
            <p className="mt-0.5 truncate text-[11px] font-semibold text-slate-400">
              {room.listingTitle}
            </p>
          </div>
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-[#1f5bd7] shadow-sm">
            {room.occupied.toLocaleString("ar-EG")} /{" "}
            {room.capacity.toLocaleString("ar-EG")}
          </span>
        </div>
      ))}
    </div>
  );
}

function ReviewsSection({ metrics, loading }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle
        title="التقييمات"
        subtitle={
          loading ? "جاري تحميل التقييمات" : "آراء المستأجرين"
        }
      />
      <div className="mt-6 flex items-center justify-between rounded-2xl bg-[#F7F9FE] px-5 py-5">
        <div>
          <p className="text-4xl font-black text-[#111D35]">
            {metrics.averageRating.toFixed(1)}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            متوسط التقييم
          </p>
        </div>
        <div className="text-left">
          <p className="text-2xl font-black text-[#1f5bd7]">
            {metrics.reviewCount.toLocaleString("ar-EG")}
          </p>
          <p className="mt-1 text-xs font-bold text-slate-500">تقييم</p>
        </div>
      </div>
    </section>
  );
}

function BookingSection({ metrics, loading }) {
  return (
    <section className="rounded-[24px] border border-[#E5EBF6] bg-white p-5 shadow-[0_14px_32px_rgba(31,57,104,0.08)]">
      <SectionTitle
        title="طلبات الحجز"
        subtitle={loading ? "جاري تحميل الطلبات" : "ملخص حالات الطلبات"}
      />
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <MiniStat label="الطلبات الجديدة" value={metrics.newRequests} />
        <MiniStat label="الطلبات المعلقة" value={metrics.pendingRequests} />
        <MiniStat label="الطلبات المقبولة" value={metrics.acceptedRequests} />
        <MiniStat label="الطلبات المرفوضة" value={metrics.rejectedRequests} />
      </div>
    </section>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F5F8FE] px-4 py-3">
      <p className="text-lg font-black text-[#111D35]">
        {Number(value || 0).toLocaleString("ar-EG")}
      </p>
      <p className="mt-1 text-xs font-bold text-slate-500">{label}</p>
    </div>
  );
}

function SectionTitle({ title, subtitle }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="text-xl font-black text-[#111D35]">{title}</h2>
        <p className="mt-1 text-xs font-semibold text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
