import { useEffect, useMemo, useState } from "react";
import { listingsApi } from "../../listings/services/listingsApi";
import { statusMeta } from "../constants/ownerDashboard";

export function useOwnerListings({ onUnauthorized } = {}) {
  const [listings, setListings] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadListings = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await listingsApi.findMyListings();

        if (!ignore) {
          setListings(Array.isArray(data) ? data : []);
        }
      } catch (caughtError) {
        if (!ignore) {
          if (
            /unauthorized|session expired|jwt expired/i.test(
              caughtError.message,
            )
          ) {
            onUnauthorized?.();
            return;
          }

          setError(caughtError.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadListings();

    return () => {
      ignore = true;
    };
  }, [onUnauthorized]);

  const stats = useMemo(() => {
    const available = listings.filter((listing) =>
      ["ACTIVE", "APPROVED"].includes(listing.status),
    ).length;
    const rented = listings.filter(
      (listing) => listing.status === "INACTIVE",
    ).length;
    const income = listings.reduce(
      (total, listing) => total + Number(listing.monthlyRent || 0),
      0,
    );

    return [
      { label: "الإجمالي", value: listings.length },
      { label: "مؤجرة", value: rented },
      { label: "متاحة", value: available },
      { label: "الدخل", value: income.toLocaleString("en-US") },
    ];
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (activeFilter === "all") return listings;

    return listings.filter((listing) => {
      const meta = statusMeta[listing.status] || statusMeta.DRAFT;
      return meta.filter === activeFilter;
    });
  }, [activeFilter, listings]);

  const addListing = (listing) => {
    setListings((current) => [listing, ...current]);
  };

  const deleteListing = async (listingId) => {
    setDeletingId(listingId);

    try {
      await listingsApi.deleteListing(listingId);
      setListings((current) =>
        current.filter((listing) => listing.id !== listingId),
      );
    } finally {
      setDeletingId(null);
    }
  };

  return {
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
  };
}
