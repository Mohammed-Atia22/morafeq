import { apiRequest } from "../../../shared/services/api";

/**
 * Search listings with all supported filters
 * Mirrors GET /api/v1/listings query params from SearchListingDto
 */
export const expatriateListingsApi = {
  findOne: (id) => apiRequest(`/listings/${id}`),

  search: (filters = {}) => {
    const params = new URLSearchParams();

    const append = (key, value) => {
      if (value !== undefined && value !== null && value !== "") {
        params.set(key, value);
      }
    };

    append("city", filters.city);
    append("governorate", filters.governorate);
    append("country", filters.country);
    append("minPrice", filters.minPrice);
    append("maxPrice", filters.maxPrice);
    append("q", filters.q);
    append("roomType", filters.roomType);
    append("propertyType", filters.propertyType);
    append("genderPreference", filters.genderPreference);
    append("guests", filters.guests);
    append("nearLat", filters.nearLat);
    append("nearLng", filters.nearLng);
    append("radiusKm", filters.radiusKm);
    append("sortBy", filters.sortBy);
    append("page", filters.page);
    append("limit", filters.limit);

    if (filters.amenities && filters.amenities.length > 0) {
      filters.amenities.forEach((a) => params.append("amenities", a));
    }

    const qs = params.toString();
    return apiRequest(`/search/listings${qs ? `?${qs}` : ""}`);
  },
};