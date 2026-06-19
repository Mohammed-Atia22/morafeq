import { apiRequest } from "../../../shared/services/api";

export const reviewsApi = {
  getListingReviews: (listingId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest(`/listings/${listingId}/reviews${qs ? `?${qs}` : ""}`);
  },

  getHostReviews: (hostId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest(`/reviews/host/${hostId}${qs ? `?${qs}` : ""}`);
  },

  getGuestReviews: (guestId, params = {}) => {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.limit) query.set("limit", String(params.limit));
    const qs = query.toString();
    return apiRequest(`/reviews/guest/${guestId}${qs ? `?${qs}` : ""}`);
  },

  deleteReview: (reviewId) =>
    apiRequest(`/reviews/${reviewId}`, { method: "DELETE" }),

  canReview: (bookingId) => apiRequest(`/reviews/can-review/${bookingId}`),

  createReview: (payload) =>
    apiRequest("/reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};
