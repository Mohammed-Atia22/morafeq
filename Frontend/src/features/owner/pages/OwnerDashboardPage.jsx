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
import { fallbackImages } from "../constants/ownerDashboard";
import { useOwnerListings } from "../hooks/useOwnerListings";
import { useWallet } from "../hooks/useWallet";

export function OwnerPage() {
  const { user, logout } = useOutletContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeSection, setActiveSection] = useState("listings");
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

  useEffect(() => {
    if (activeSection === "dashboard") {
      fetchWallet();
    }
  }, [activeSection, fetchWallet]);

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
              <OwnerWelcomeCard
                user={user}
                listingsCount={listings.length}
              />

              <FinancialSection wallet={wallet} loading={walletLoading} />

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

function FinancialSection({ wallet, loading }) {
  if (loading && !wallet) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-24 animate-pulse rounded-xl bg-slate-100" />
      </div>
    );
  }

  const pendingVal = wallet?.summary?.pendingBalance ?? 0;
  const availableVal = wallet?.summary?.availableBalance ?? 0;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Pending Balance Card */}
      <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">الأموال قيد الانتظار</p>
            <h4 className="mt-1 text-2xl font-black text-amber-600">
              {pendingVal.toLocaleString("ar-EG")} ج.م
            </h4>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-semibold text-slate-400">
          أموال الحجوزات النشطة المعلقة حتى انتهاء فترة المعاينة وتأكيد المستأجر
        </p>
      </div>

      {/* Available Balance Card */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-white to-emerald-50/20 p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400">الرصيد المتاح</p>
            <h4 className="mt-1 text-2xl font-black text-emerald-600">
              {availableVal.toLocaleString("ar-EG")} ج.م
            </h4>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-3 text-[10px] font-semibold text-slate-400">
          الأموال المحررة والجاهزة للسحب في محفظتك الإلكترونية
        </p>
      </div>
    </div>
  );
}
