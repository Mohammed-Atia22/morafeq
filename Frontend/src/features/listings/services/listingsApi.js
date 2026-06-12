import { apiRequest } from "../../../shared/services/api";

export const listingsApi = {
  findMyListings: () => apiRequest("/listings/my"),
  findListing: (id) => apiRequest(`/listings/${id}`),
  updateListing: (id, payload) =>
    apiRequest(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteListing: (id) =>
    apiRequest(`/listings/${id}`, {
      method: "DELETE",
    }),
};
