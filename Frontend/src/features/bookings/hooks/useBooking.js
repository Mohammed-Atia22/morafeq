import { useState, useCallback } from "react";
import { bookingsApi } from "../services/bookingsApi";
import { paymentsApi } from "../../payments/services/paymentsApi";
import toast from "react-hot-toast";

export function useBooking() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getMyBookings();
      setBookings(data || []);
      return data;
    } catch (err) {
      setError(err.message || "Failed to load bookings");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createBooking = async (listingId, preferredMoveInDate, guestMessage, roomId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.createBooking({
        listingId,
        preferredMoveInDate,
        guestMessage,
        roomId,
      });
      toast.success("تم إرسال طلب الحجز بنجاح");
      // Update list dynamically
      setBookings((prev) => [res, ...prev]);
      return res;
    } catch (err) {
      setError(err.message || "Failed to create booking");
      toast.error(err.message || "فشل إرسال طلب الحجز");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const confirmReceipt = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.confirmReceipt(bookingId);
      toast.success("تم تأكيد الاستلام بنجاح!");
      // Optimistic update of local status
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "COMPLETED" } : b))
      );
      return res;
    } catch (err) {
      setError(err.message || "Failed to confirm receipt");
      toast.error(err.message || "فشل تأكيد الاستلام");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reportProblem = async (bookingId, reason, description) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.reportProblem(bookingId, reason, description);
      toast.success("تم تقديم الشكوى بنجاح وجاري مراجعتها");
      // Optimistic update of local status
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: "DISPUTED" } : b))
      );
      return res;
    } catch (err) {
      setError(err.message || "Failed to report problem");
      toast.error(err.message || "فشل تقديم الشكوى");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelBooking = async (bookingId, reason) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.cancelBooking(bookingId, reason);
      toast.success("تم إلغاء الحجز بنجاح");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED_BY_GUEST" } : b
        )
      );
      return res;
    } catch (err) {
      setError(err.message || "Failed to cancel booking");
      toast.error(err.message || "فشل إلغاء الحجز");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const continueAfterDispute = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookingsApi.continueAfterDispute(bookingId);
      toast.success("تمت متابعة الحجز بنجاح");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CHECK_IN_PENDING" } : b
        )
      );
      return res;
    } catch (err) {
      setError(err.message || "Failed to continue booking");
      toast.error(err.message || "فشل متابعة الحجز");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelAfterDispute = async (bookingId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await paymentsApi.cancelAfterDispute(bookingId);
      toast.success("تم إلغاء الحجز واسترداد المبلغ المستحق");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, status: "CANCELLED_AFTER_DISPUTE" } : b
        )
      );
      return res;
    } catch (err) {
      setError(err.message || "Failed to cancel after dispute");
      toast.error(err.message || "فشل إلغاء الحجز");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    bookings,
    loading,
    error,
    fetchBookings,
    createBooking,
    confirmReceipt,
    reportProblem,
    cancelBooking,
    continueAfterDispute,
    cancelAfterDispute,
  };
}
