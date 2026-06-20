import { apiRequest } from "../../../shared/services/api";

export const adminApi = {
  // Stats
  getStats: () => apiRequest("/admin/stats"),

  // Listings
  getListings: (query = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.append("status", query.status);
    if (query.page) params.append("page", query.page);
    if (query.limit) params.append("limit", query.limit);
    const queryString = params.toString();
    return apiRequest(`/admin/listings${queryString ? `?${queryString}` : ""}`);
  },

  getListingDetail: (id) => apiRequest(`/admin/listings/${id}`),

  approveListing: (id, note = "") =>
    apiRequest(`/admin/listings/${id}/approve`, {
      method: "PATCH",
      body: JSON.stringify({ note: note || undefined }),
    }),

  rejectListing: (id, reason) =>
    apiRequest(`/admin/listings/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  suspendListing: (id, reason) =>
    apiRequest(`/admin/listings/${id}/suspend`, {
      method: "PATCH",
      body: JSON.stringify({ reason }),
    }),

  // Users
  getUsers: (page = 1, limit = 20) =>
    apiRequest(`/admin/users?page=${page}&limit=${limit}`),

  updateUser: (id, data) =>
    apiRequest(`/admin/users/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  deactivateUser: (id) =>
    apiRequest(`/admin/users/${id}/deactivate`, {
      method: "PATCH",
    }),

  getComplaints: () =>
    apiRequest("/admin/complaints"),

  // Disputes
  getDisputes: (query = {}) => {
    const params = new URLSearchParams();
    if (query.status) params.append("status", query.status);
    if (query.page) params.append("page", query.page);
    if (query.limit) params.append("limit", query.limit);
    const queryString = params.toString();
    return apiRequest(`/admin/disputes${queryString ? `?${queryString}` : ""}`);
  },

  getDisputeDetail: (bookingId) =>
    apiRequest(`/admin/disputes/${bookingId}`),

  getOriginalDisputeMessages: (bookingId, query = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page);
    if (query.limit) params.append("limit", query.limit);
    const queryString = params.toString();
    return apiRequest(
      `/admin/disputes/${bookingId}/messages${queryString ? `?${queryString}` : ""}`,
    );
  },

  openDisputeConversation: (bookingId, participantType) =>
    apiRequest(`/admin/disputes/${bookingId}/conversations`, {
      method: "POST",
      body: JSON.stringify({ participantType }),
    }),

  getPrivateDisputeMessages: (conversationId, query = {}) => {
    const params = new URLSearchParams();
    if (query.page) params.append("page", query.page);
    if (query.limit) params.append("limit", query.limit);
    const queryString = params.toString();
    return apiRequest(
      `/admin/dispute-conversations/${conversationId}/messages${queryString ? `?${queryString}` : ""}`,
    );
  },

  sendPrivateDisputeMessage: (conversationId, content) =>
    apiRequest(`/admin/dispute-conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),

  closeDisputeConversation: (conversationId) =>
    apiRequest(`/admin/dispute-conversations/${conversationId}/close`, {
      method: "PATCH",
    }),

  // Verifications
  approveVerification: (id) =>
    apiRequest(`/verification/${id}/approve`, {
      method: "PATCH",
    }),

  rejectVerification: (id, rejectionReason) =>
    apiRequest(`/verification/${id}/reject`, {
      method: "PATCH",
      body: JSON.stringify({ rejectionReason }),
    }),
};
