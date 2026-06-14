export const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export const listingToForm = (listing) => ({
  title: listing.title || "",
  description: listing.description || "",
  propertyType: listing.propertyType || "APARTMENT",
  roomType: listing.roomType || "PRIVATE_ROOM",
  streetName: listing.streetName || "",
  buildingNumber: listing.buildingNumber || "",
  floorNumber: listing.floorNumber || "",
  apartmentNumber: listing.apartmentNumber || "",
  nearbyLandmark: listing.nearbyLandmark || "",
  city: listing.city || "",
  governorate: listing.governorate || "",
  country: listing.country || "Egypt",
  areaName: listing.area?.name || listing.areaName || "",
  lat: listing.lat ?? "",
  lng: listing.lng ?? "",
  googleFormattedAddress: listing.googleFormattedAddress || "",
  googlePlaceId: listing.googlePlaceId || "",
  locationPrivacy: listing.locationPrivacy || "APPROXIMATE",
  monthlyRent: listing.monthlyRent ?? "",
  depositAmount: listing.depositAmount ?? 0,
  currency: listing.currency || "EGP",
  maxTenants: listing.maxTenants ?? "",
  bedrooms: listing.bedrooms ?? "",
  beds: listing.beds ?? "",
  bathrooms: listing.bathrooms ?? "",
  furnished: Boolean(listing.furnished),
  utilitiesIncluded: Boolean(listing.utilitiesIncluded),
  internetIncluded: Boolean(listing.internetIncluded),
  minimumStayMonths: listing.minimumStayMonths ?? 1,
  maximumStayMonths: listing.maximumStayMonths ?? "",
  availableFrom: formatDateForInput(listing.availableFrom),
  genderPreference: listing.genderPreference || "ANY",
  smokingPolicy: listing.smokingPolicy || "NOT_ALLOWED",
  status: listing.status || "DRAFT",
});
