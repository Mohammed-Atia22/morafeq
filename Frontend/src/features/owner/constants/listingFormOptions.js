export const propertyTypeOptions = [
  { value: "APARTMENT", label: "Apartment" },
  { value: "HOUSE", label: "House" },
  { value: "VILLA", label: "Villa" },
  { value: "CABIN", label: "Cabin" },
  { value: "STUDIO", label: "Studio" },
  { value: "OTHER", label: "Other" },
];

export const roomTypeOptions = [
  { value: "ENTIRE_PLACE", label: "Entire place" },
  { value: "PRIVATE_ROOM", label: "Private room" },
  { value: "SHARED_ROOM", label: "Shared room" },
];

export const genderPreferenceOptions = [
  { value: "ANY", label: "Any" },
  { value: "MALE", label: "Male only" },
  { value: "FEMALE", label: "Female only" },
];

export const smokingPolicyOptions = [
  { value: "NOT_ALLOWED", label: "Not allowed" },
  { value: "ALLOWED", label: "Allowed" },
];

export const locationPrivacyOptions = [
  { value: "APPROXIMATE", label: "Approximate" },
  { value: "EXACT", label: "Exact" },
];

export const statusOptions = [
  { value: "DRAFT", label: "Draft" },
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Rented" },
  { value: "SUSPENDED", label: "Archived" },
];

export const numericListingFields = [
  "lat",
  "lng",
  "monthlyRent",
  "depositAmount",
  "maxTenants",
  "bedrooms",
  "beds",
  "bathrooms",
  "minimumStayMonths",
  "maximumStayMonths",
];
