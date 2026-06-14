// Human-readable labels for common amenity keys
const AMENITY_LABELS = {
  wifi: "واي فاي",
  internet: "إنترنت",
  ac: "تكييف هواء",
  air_conditioning: "تكييف هواء",
  washing_machine: "غسالة ملابس",
  washer: "غسالة ملابس",
  parking: "موقف سيارات",
  elevator: "أسانسير",
  security: "حراسة أمنية",
  gym: "صالة رياضية",
  pool: "حمام سباحة",
  furnished: "مفروشة",
  kitchen: "مطبخ", 
  balcony: "بلكونة",
  garden: "حديقة",
  heating: "تدفئة",
  tv: "تلفاز",
  refrigerator: "ثلاجة",
  microwave: "ميكروويف",
  dishwasher: "غسالة أطباق",
  water_heater: "سخان مياه",
  generator: "مولد كهربائي",
  solar: "طاقة شمسية",
  cctv: "كاميرات مراقبة",
  intercom: "إنتركوم",
  pets_allowed: "يُسمح بالحيوانات",
  smoking_allowed: "يُسمح بالتدخين",
  study_room: "غرفة دراسة",
  concierge: "بواب",
};

function resolveLabel(key) {
  const lower = key.toLowerCase().replace(/-/g, "_");
  return AMENITY_LABELS[lower] ?? key;
}

export function AmenitiesSection({ amenities = [] }) {
  if (amenities.length === 0) return null;

  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="mb-4 text-sm font-black text-[#0f172a]">المميزات والخدمات</h2>

      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 sm:grid-cols-3">
        {amenities.map((a) => (
          <div
            key={a.amenityKey}
            className="flex items-center gap-2 text-sm text-slate-700"
          >
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 shrink-0 text-[#1752F0]"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            {resolveLabel(a.amenityKey)}
          </div>
        ))}
      </div>
    </div>
  );
}