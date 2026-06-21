import { apiRequest } from "../../../shared/services/api";

export const bookingsApi = {
  createBooking: (payload) =>
    apiRequest("/bookings", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getMyBookings: () =>
    apiRequest("/bookings/my"),

  getBookingDetail: (id) =>
    apiRequest(`/bookings/${id}`),

  getHostBookings: (status) =>
    apiRequest(`/bookings/host${status ? `?status=${status}` : ""}`),

  respondToBooking: (id, action, note) =>
    apiRequest(`/bookings/${id}/respond`, {
      method: "PATCH",
      body: JSON.stringify({ action, note: note || undefined }),
    }),

  cancelBooking: (id, reason) =>
    apiRequest(`/bookings/${id}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  confirmReceipt: (id) =>
    apiRequest(`/bookings/${id}/confirm-receipt`, {
      method: "PATCH",
    }),

  reportProblem: (id, reason, description) =>
    apiRequest(`/bookings/${id}/report-problem`, {
      method: "POST",
      body: JSON.stringify({ reason, description }),
    }),

  continueAfterDispute: (id) =>
    apiRequest(`/bookings/${id}/dispute/continue`, {
      method: "PATCH",
    }),
};
