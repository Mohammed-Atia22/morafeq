export const propertyTypeOptions = [
  { value: "APARTMENT", label: "شقة" },
  { value: "HOUSE", label: "منزل" },
  { value: "VILLA", label: "فيلا" },
  { value: "CABIN", label: "كوخ" },
  { value: "STUDIO", label: "استوديو" },
  { value: "OTHER", label: "أخرى" },
];

export const roomTypeOptions = [
  { value: "ENTIRE_PLACE", label: "مكان كامل" },
  { value: "PRIVATE_ROOM", label: "غرفة خاصة" },
  { value: "SHARED_ROOM", label: "غرفة مشتركة" },
];

export const genderPreferenceOptions = [
  { value: "ANY", label: "أي نوع" },
  { value: "MALE", label: "ذكور فقط" },
  { value: "FEMALE", label: "إناث فقط" },
];

export const smokingPolicyOptions = [
  { value: "NOT_ALLOWED", label: "غير مسموح" },
  { value: "ALLOWED", label: "مسموح" },
];

export const locationPrivacyOptions = [
  { value: "APPROXIMATE", label: "تقريبي" },
  { value: "EXACT", label: "دقيق" },
];

export const statusOptions = [
  { value: "DRAFT", label: "مسودة" },
  { value: "ACTIVE", label: "نشط" },
  { value: "INACTIVE", label: "مؤجر" },
  { value: "SUSPENDED", label: "مؤرشف" },
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
