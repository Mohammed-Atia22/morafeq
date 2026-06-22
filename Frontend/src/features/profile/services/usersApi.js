import { apiRequest } from "../../../shared/services/api";

export const usersApi = {
  /**
   * GET /users/me
   * Returns full profile including onboardingCompleted, gender, phone fields
   */
  getMe: () => apiRequest("/users/me"),

  /**
   * PATCH /users/me
   * Updates firstName, lastName, bio, phone, phoneCountry, phoneCountryCode, gender
   */
  updateProfile: (payload) =>
    apiRequest("/users/me", {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),

  /**
   * POST /users/me/avatar
   * Multipart form upload — does NOT use JSON
   */
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append("avatar", file);
    return apiRequest("/users/me/avatar", {
      method: "POST",
      body: form,
      headers: {}, // let browser set Content-Type with boundary
    });
  },

  /**
   * POST /users/me/change-password
   */
  changePassword: (payload) =>
    apiRequest("/users/me/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  /**
   * GET /users/:id
   * Public profile — no private fields
   */
  getPublicProfile: (userId) => apiRequest(`/users/${userId}`),
  /**
   * Preferences endpoints
   */
  getPreferencesOptions: () => apiRequest(`/users/preferences/options`),
  getMyPreferences: () => apiRequest(`/users/me/preferences`),
  updateMyPreferences: (payload) =>
    apiRequest(`/users/me/preferences`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getUserPreferences: (userId) => apiRequest(`/users/${userId}/preferences`),

  /**
   * Roommate Profile endpoints
   */
  getMyRoommateProfile: () => apiRequest(`/roommate-profile/me`),
  updateMyRoommateProfile: (payload) =>
    apiRequest(`/roommate-profile/me`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getListingRoommateMatches: (listingId) =>
    apiRequest(`/roommate-matching/listings/${listingId}/roommates`),
};
