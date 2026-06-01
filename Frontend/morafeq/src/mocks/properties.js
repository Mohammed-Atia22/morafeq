// src/mocks/properties.js
// --------------------------------------------------
// Mock data for property listings.
// Field names here = exact field names backend must return.
// --------------------------------------------------

// ── Property list item shape ──────────────────────────
// This is what GET /properties and GET /properties/featured return
export const MOCK_PROPERTIES = [
  {
    id: "prop_001",
    title: "استوديو مجهز بالمهندسين",
    description: "استوديو حديث التجهيز بالكامل، مناسب لطالب أو موظف. قريب من المترو والخدمات.",
    price: 2700,
    deposit: 5400,
    type: "studio",              // "studio" | "apartment" | "room"
    furnished: true,
    location: {
      city: "الجيزة",
      area: "المهندسين",
      coordinates: { lat: 30.057, lng: 31.199 },
    },
    rooms: 1,
    beds: 1,
    images: [
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80",
    ],
    available_from: "2026-07-01",
    min_rental_months: 3,
    preferences: {
      gender: "any",             // "male" | "female" | "any"
      smoking_allowed: false,
    },
    amenities: ["مطبخ مجهز", "مكيف", "أمن 24 ساعة"],
    rating: 4.7,
    reviews_count: 12,
    owner_id: "user_002",
    is_featured: true,
    is_verified: true,
    created_at: "2026-05-01T10:00:00Z",
  },
  {
    id: "prop_002",
    title: "غرفة في سكن بنات نصر",
    description: "غرفة مشتركة في سكن بنات آمن ومجهز، 5 دقائق من جامعة عين شمس.",
    price: 1800,
    deposit: 1800,
    type: "room",
    furnished: true,
    location: {
      city: "القاهرة",
      area: "مدينة نصر",
      coordinates: { lat: 30.065, lng: 31.335 },
    },
    rooms: 1,
    beds: 1,
    images: [
      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&q=80",
    ],
    available_from: "2026-07-01",
    min_rental_months: 1,
    preferences: {
      gender: "female",
      smoking_allowed: false,
    },
    amenities: ["إناث فقط", "واي فاي"],
    rating: 4.9,
    reviews_count: 41,
    owner_id: "user_002",
    is_featured: true,
    is_verified: true,
    note: "5 دقائق من شمس",
    created_at: "2026-04-20T08:00:00Z",
  },
  {
    id: "prop_003",
    title: "شقة مفروشة بالدقي",
    description: "شقة 2 غرفة مفروشة بالكامل في قلب الدقي، قريبة من جامعة القاهرة والمترو.",
    price: 3200,
    deposit: 6400,
    type: "apartment",
    furnished: true,
    location: {
      city: "الجيزة",
      area: "الدقي",
      coordinates: { lat: 30.038, lng: 31.211 },
    },
    rooms: 2,
    beds: 2,
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&q=80",
    ],
    available_from: "2026-06-15",
    min_rental_months: 3,
    preferences: {
      gender: "any",
      smoking_allowed: false,
    },
    amenities: ["واي فاي", "مكيف", "قريب جامعة القاهرة"],
    rating: 4.8,
    reviews_count: 23,
    owner_id: "user_002",
    is_featured: true,
    is_verified: true,
    created_at: "2026-05-10T12:00:00Z",
  },
];

// ── List response wrapper ─────────────────────────────
// GET /properties → returns this shape
export const MOCK_PROPERTIES_RESPONSE = {
  data: MOCK_PROPERTIES,
  meta: {
    total: 3,
    page: 1,
    per_page: 10,
    total_pages: 1,
  },
};

// ── Featured response ─────────────────────────────────
// GET /properties/featured → returns this shape
export const MOCK_FEATURED_RESPONSE = {
  data: MOCK_PROPERTIES.filter((p) => p.is_featured),
};