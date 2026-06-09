import { apiRequest } from "./api";

export const locationsApi = {
  /**
   * Search for a place by name to get coordinates
   * @param {string} q - place name e.g. "كلية تجارة جامعة الإسكندرية"
   * @param {string} [city]
   * @param {string} [governorate]
   * @param {string} [country="Egypt"]
   * @returns {{ message, places: [{ name, formattedAddress, lat, lng, placeId }] }}
   */
  searchPlace: ({ q, city, governorate, country = "Egypt" }) => {
    const params = new URLSearchParams({ q, country });
    if (city) params.set("city", city);
    if (governorate) params.set("governorate", governorate);

    return apiRequest(`/locations/search-place?${params.toString()}`);
  },
};