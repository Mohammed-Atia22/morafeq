import { useState, useRef, useEffect } from "react";
import { paymentsApi } from "../services/paymentsApi";
import { bookingsApi } from "../../bookings/services/bookingsApi";
import toast from "react-hot-toast";

export function usePayment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const pollIntervalRef = useRef(null);

  const createPaymentSession = async (bookingId) => {
    setLoading(true);
    setError(null);
    setIframeUrl(null);
    try {
      const res = await paymentsApi.createPaymentSession(bookingId);
      if (res && res.iframeUrl) {
        setIframeUrl(res.iframeUrl);
        return res;
      } else {
        throw new Error("No payment session URL returned");
      }
    } catch (err) {
      setError(err.message || "Failed to create payment session");
      toast.error(err.message || "تعذر بدء عملية الدفع");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (bookingId, onSuccess) => {
    // Clear any existing polling interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const booking = await bookingsApi.getBookingDetail(bookingId);
        // Once status transitions from PENDING_PAYMENT to CHECK_IN_PENDING, payment has succeeded.
        if (booking && booking.status === "CHECK_IN_PENDING") {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setIframeUrl(null);
          toast.success("تم الدفع بنجاح!");
          if (onSuccess) onSuccess();
        }
      } catch (err) {
        console.error("Error polling booking status:", err);
      }
    }, 3000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  return {
    loading,
    error,
    iframeUrl,
    setIframeUrl,
    createPaymentSession,
    startPolling,
    stopPolling,
  };
}
