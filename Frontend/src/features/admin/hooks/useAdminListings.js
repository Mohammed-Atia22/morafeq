import { useState, useEffect, useCallback } from "react";
import { adminApi } from "../services/adminApi";
import { toast } from "react-hot-toast";

export function useAdminListings(initialStatus = "") {
  const [listings, setListings] = useState([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(initialStatus);
  const [page, setPage] = useState(1);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await adminApi.getListings({ status, page, limit: 10 });
      setListings(res.data);
      setMeta(res.meta);
    } catch (err) {
      setError(err.message || "تعذر تحميل العقارات");
    } finally {
      setLoading(false);
    }
  }, [status, page]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const approveListing = async (id, note = "") => {
    try {
      await adminApi.approveListing(id, note);
      toast.success("تمت الموافقة على العقار بنجاح");
      fetchListings();
      return true;
    } catch (err) {
      toast.error(err.message || "فشلت عملية الموافقة");
      return false;
    }
  };

  const rejectListing = async (id, reason) => {
    try {
      await adminApi.rejectListing(id, reason);
      toast.success("تم رفض العقار بنجاح");
      fetchListings();
      return true;
    } catch (err) {
      toast.error(err.message || "فشلت عملية الرفض");
      return false;
    }
  };

  const suspendListing = async (id, reason) => {
    try {
      await adminApi.suspendListing(id, reason);
      toast.success("تم تعليق العقار بنجاح");
      fetchListings();
      return true;
    } catch (err) {
      toast.error(err.message || "فشلت عملية تعليق العقار");
      return false;
    }
  };

  const unsuspendListing = async (id) => {
    try {
      await adminApi.unsuspendListing(id);
      toast.success("تم إعادة تفعيل العقار بنجاح");
      fetchListings();
      return true;
    } catch (err) {
      toast.error(err.message || "فشلت عملية إعادة تفعيل العقار");
      return false;
    }
  };

  const deleteListing = async (id) => {
    try {
      await adminApi.deleteListing(id);
      toast.success("تم حذف العقار بنجاح");
      fetchListings();
      return true;
    } catch (err) {
      toast.error(err.message || "فشل حذف العقار");
      return false;
    }
  };

  return {
    listings,
    meta,
    loading,
    error,
    status,
    setStatus: (newStatus) => {
      setStatus(newStatus);
      setPage(1); // Reset page to 1 on filter change
    },
    page,
    setPage,
    approveListing,
    rejectListing,
    suspendListing,
    unsuspendListing,
    deleteListing,
    refreshListings: fetchListings,
  };
}
