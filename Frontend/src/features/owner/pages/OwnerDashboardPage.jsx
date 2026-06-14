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
            <div className="space-y-4">
              <OwnerWelcomeCard
                user={user}
                listingsCount={listings.length}
              />

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
