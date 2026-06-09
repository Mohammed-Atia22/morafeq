import { apiRequest } from "../../../shared/services/api";

export const listingsApi = {
  findMyListings: () => apiRequest("/listings/my"),
  updateListing: (id, payload) =>
    apiRequest(`/listings/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};
