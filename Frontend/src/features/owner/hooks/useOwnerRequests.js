import { useState, useCallback } from "react";
import { bookingsApi } from "../../bookings/services/bookingsApi";
import toast from "react-hot-toast";

export function useOwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchRequests = useCallback(async (status) => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookingsApi.getHostBookings(status);
      setRequests(data || []);
      return data;
    } catch (err) {
      setError(err.message || "Failed to load requests");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const respondToRequest = async (bookingId, action, note) => {
    setLoading(true);
    setError(null);
    try {
      const updatedBooking = await bookingsApi.respondToBooking(
        bookingId,
        action,
        note
      );
      toast.success(
        action === "ACCEPT"
          ? "تم قبول طلب الإيجار بنجاح"
          : "تم رفض طلب الإيجار بنجاح"
      );

      // Optimistic update
      setRequests((prev) =>
        prev.map((req) => (req.id === bookingId ? updatedBooking : req))
      );
      return updatedBooking;
    } catch (err) {
      setError(err.message || "Failed to respond to request");
      toast.error(err.message || "تعذر إرسال الرد على طلب الإيجار");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    requests,
    loading,
    error,
    fetchRequests,
    respondToRequest,
  };
}
