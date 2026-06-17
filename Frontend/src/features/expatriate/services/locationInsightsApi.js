import { apiRequest } from "../../../shared/services/api";

/**
 * GET /location-insights/listings/:listingId
 * Returns existing insight or generates one automatically.
 * No auth required.
 */
export const locationInsightsApi = {
  getForListing: (listingId) =>
    apiRequest(`/location-insights/listings/${listingId}`),
};