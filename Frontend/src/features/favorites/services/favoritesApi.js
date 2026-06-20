import { apiRequest } from "../../../shared/services/api";

export const favoritesApi = {
  getFavorites: () => apiRequest("/favorites"),

  addFavorite: (listingId) =>
    apiRequest(`/favorites/${listingId}`, {
      method: "POST",
    }),

  removeFavorite: (listingId) =>
    apiRequest(`/favorites/${listingId}`, {
      method: "DELETE",
    }),

  getStatus: (listingId) => apiRequest(`/favorites/${listingId}/status`),

  getStatuses: (listingIds = []) => {
    const ids = listingIds.filter(Boolean).join(",");
    return apiRequest(`/favorites/status${ids ? `?listingIds=${ids}` : ""}`);
  },
};
