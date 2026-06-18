import { apiRequest } from "../../../shared/services/api";

export const paymentsApi = {
  createPaymentSession: (bookingId) =>
    apiRequest("/payments", {
      method: "POST",
      body: JSON.stringify({ bookingId }),
    }),

  getHostEarnings: () =>
    apiRequest("/payments/earnings"),

  getPaymentByBooking: (bookingId) =>
    apiRequest(`/payments/booking/${bookingId}`),

  refundPayment: (paymentId, reason) =>
    apiRequest(`/payments/${paymentId}/refund`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  releasePayment: (paymentId, note) =>
    apiRequest(`/payments/${paymentId}/release`, {
      method: "PATCH",
      body: JSON.stringify({ note }),
    }),
};
