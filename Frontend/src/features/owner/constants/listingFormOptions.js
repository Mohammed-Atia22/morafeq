export const propertyTypeOptions = [
  { value: "APARTMENT", label: "شقة" },
  { value: "HOUSE", label: "منزل" },
  { value: "VILLA", label: "فيلا" },
  { value: "CABIN", label: "كوخ" },
  { value: "STUDIO", label: "ستوديو" },
  { value: "OTHER", label: "أخرى" },
];

export const roomTypeOptions = [
  { value: "ENTIRE_PLACE", label: "الوحدة كاملة" },
  { value: "PRIVATE_ROOM", label: "غرفة خاصة" },
  { value: "SHARED_ROOM", label: "غرفة مشتركة" },
];

export const genderPreferenceOptions = [
  { value: "ANY", label: "أي" },
  { value: "MALE", label: "للرجال فقط" },
  { value: "FEMALE", label: "للنساء فقط" },
];

export const smokingPolicyOptions = [
  { value: "NOT_ALLOWED", label: "ممنوع" },
  { value: "ALLOWED", label: "مسموح" },
];

export const locationPrivacyOptions = [
  { value: "APPROXIMATE", label: "تقريبي" },
  { value: "EXACT", label: "دقيق" },
];

export const statusOptions = [
  { value: "ACTIVE", label: "متاحة" },
  { value: "INACTIVE", label: "مؤجرة" },
  { value: "PENDING_APPROVAL", label: "قيد المعاينة" },
  { value: "DRAFT", label: "مسودة" },
  { value: "APPROVED", label: "معتمدة" },
  { value: "REJECTED", label: "مرفوضة" },
  { value: "SUSPENDED", label: "موقوفة" },
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
