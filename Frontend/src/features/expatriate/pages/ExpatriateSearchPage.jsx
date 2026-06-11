import { useState, useCallback, useEffect, useRef } from "react";
import { useListings } from "../hooks/useListings";
import { useDestinationSearch } from "../hooks/useDestinationSearch";
import LocationPickerMap from "../../../shared/components/maps/LocationPickerMap";
import { ListingsGrid } from "../components/sidebar/home/ListingsGrid";
import { AmenitiesSelector } from "../../listings/components/AmenitiesSelector";
import { useSearchSuggestions } from "../hooks/useSearchSuggestions";

const ROOM_TYPES = [
  { value: "", label: "الكل" },
  { value: "ENTIRE_PLACE", label: "شقة كاملة" },
  { value: "PRIVATE_ROOM", label: "غرفة خاصة" },
  { value: "SHARED_ROOM", label: "غرفة مشتركة" },
];

const PROPERTY_TYPES = [
  { value: "", label: "الكل" },
  { value: "APARTMENT", label: "شقة" },
  { value: "VILLA", label: "فيلا" },
  { value: "STUDIO", label: "ستوديو" },
  { value: "ROOM", label: "غرفة" },
];

const GENDER_OPTIONS = [
  { value: "", label: "الكل" },
  { value: "MALE", label: "ذكور" },
  { value: "FEMALE", label: "إناث" },
  { value: "ANY", label: "مختلط" },
];

const RADIUS_OPTIONS = [
  { value: 1, label: "1 كم" },
  { value: 3, label: "3 كم" },
  { value: 5, label: "5 كم" },
  { value: 10, label: "10 كم" },
];

const AMENITY_OPTIONS = [
  { key: "wifi", label: "واي فاي" },
  { key: "kitchen", label: "مطبخ" },
  { key: "parking", label: "موقف سيارات" },
  { key: "air_conditioning", label: "تكيف" },
  { key: "washing_machine", label: "غسالة" },
  { key: "workspace", label: "مكان للعمل" },
];

function FilterLabel({ children }) {
  return (
    <label className="mb-1.5 block text-xs font-bold text-slate-600">
      {children}
    </label>
  );
}

function FilterSelect({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      dir="rtl"
      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

export function ExpatriateSearchPage() {
  const { listings, meta, loading, error, fetchListings } = useListings();
  const {
    destinationName,
    confirmedDestination,
    confirmLoading,
    confirmError,
    handleDestinationChange,
    confirmDestination,
    clearDestination,
  } = useDestinationSearch();

  const [filters, setFilters] = useState({
    city: "",
    governorate: "",
    country: "",
    guests: "",
    minPrice: "",
    maxPrice: "",
    roomType: "",
    propertyType: "",
    genderPreference: "",
    radiusKm: 5,
    amenities: [],
    sortBy: "",
  });

  const [hasSearched, setHasSearched] = useState(false);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const [selectedLocation, setSelectedLocation] = useState(null);
  const [approvedLocation, setApprovedLocation] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);
  const [showMapModal, setShowMapModal] = useState(false);

  useEffect(() => {
    if (!confirmedDestination) {
      setSelectedLocation(null);
      setApprovedLocation(null);
      setShowMapModal(false);
      return;
    }

    setSelectedLocation({
      lat: confirmedDestination.lat,
      lng: confirmedDestination.lng,
    });
    setApprovedLocation(null);
    // open the modal so user can fine-tune on the map
    setShowMapModal(true);
  }, [confirmedDestination]);

  const handleConfirm = () => {
    setApprovedLocation(null);
    confirmDestination({
      city: filters.city || undefined,
      governorate: filters.governorate || undefined,
    });
  };

  const handleMapChange = (position) => {
    setSelectedLocation(position);
  };

  const toggleAmenity = (key) => {
    setFilters((prev) => {
      const list = prev.amenities || [];
      const exists = list.includes(key);
      const next = exists ? list.filter((a) => a !== key) : [...list, key];
      return { ...prev, amenities: next };
    });
  };

  const handleConfirmOnMap = () => {
    if (!selectedLocation) return;
    setApprovedLocation(selectedLocation);
    setSelectedLocation(null);
  };

  const handleSearch = () => {
    const searchParams = {
      q: searchQuery?.trim() || undefined,
      city: filters.city || undefined,
      governorate: filters.governorate || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      roomType: filters.roomType || undefined,
      propertyType: filters.propertyType || undefined,
      genderPreference: filters.genderPreference || undefined,
      guests: filters.guests || undefined,
      country: filters.country || undefined,
      amenities:
        filters.amenities && filters.amenities.length > 0
          ? filters.amenities
          : undefined,
      sortBy: filters.sortBy || undefined,
      limit: 12,
    };

    // Add near search params if destination was confirmed and approved on map
    const targetLocation = approvedLocation || confirmedDestination;

    if (targetLocation) {
      searchParams.nearLat = targetLocation.lat;
      searchParams.nearLng = targetLocation.lng;
      searchParams.radiusKm = filters.radiusKm;
      // if user selected sort explicitly keep it, otherwise sort by nearest when using location
      if (!searchParams.sortBy) searchParams.sortBy = "nearest";
    }

    setHasSearched(true);
    fetchListings(searchParams);
    setShowSuggestions(false);
  };

  // suggestions hook
  const {
    query: sugQuery,
    setQuery: setSugQuery,
    suggestions,
    loading: sugLoading,
  } = useSearchSuggestions({ limit: 8 });

  // sync main input with suggestions hook
  useEffect(() => {
    setSugQuery(searchQuery || "");
    if (searchQuery && searchQuery.trim().length > 0) setShowSuggestions(true);
    else setShowSuggestions(false);
  }, [searchQuery, setSugQuery]);

  // close suggestions when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!suggestionsRef.current) return;
      if (!suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handlePickSuggestion = (item) => {
    // item: { id, title, subtitle, areaName }
    const display = item.title || item.subtitle || item.areaName || "";
    setSearchQuery(display);
    setShowSuggestions(false);
    // optionally run search immediately
    handleSearch();
  };

  const handleReset = () => {
    setFilters({
      city: "",
      governorate: "",
      country: "",
      guests: "",
      minPrice: "",
      maxPrice: "",
      roomType: "",
      propertyType: "",
      genderPreference: "",
      radiusKm: 5,
      amenities: [],
      sortBy: "",
    });
    setHasSearched(false);
    // clear destination and map selections
    clearDestination();
    setApprovedLocation(null);
    setSelectedLocation(null);
    setShowMapModal(false);
    setShowFilters(false);
    setSearchQuery("");
  };

  return (
    <div dir="rtl" className="max-w-6xl space-y-6">
      {/* Page title */}
      <div>
        <h1 className="text-xl font-black text-[#0f172a]">البحث عن سكن</h1>
        <p className="mt-0.5 text-sm text-slate-400">
          ابحث بالمنطقة أو قرب جامعتك أو كليتك
        </p>
      </div>

      {/* Search bar + filter icon */}
      <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100 flex items-center gap-3">
        <div className="flex-1 relative" ref={suggestionsRef}>
          <input
            type="text"
            dir="rtl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث عن منطقة، جامعة أو كلمة مفتاحية"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            onFocus={() => searchQuery && setShowSuggestions(true)}
            aria-autocomplete="list"
            aria-expanded={showSuggestions}
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions && suggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl bg-white shadow-lg border border-slate-200 overflow-hidden">
              {sugLoading && (
                <div className="p-2 text-sm text-slate-500">
                  جاري التحميل...
                </div>
              )}
              <ul className="max-h-56 overflow-auto">
                {suggestions.map((s) => (
                  <li
                    key={s.id}
                    onClick={() => handlePickSuggestion(s)}
                    className="cursor-pointer px-4 py-2 hover:bg-slate-50"
                  >
                    <div className="text-sm font-semibold">{s.title}</div>
                    <div className="text-xs text-slate-500">{s.subtitle}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <button
          type="button"
          aria-label="فتح الفلاتر"
          onClick={() => setShowFilters(true)}
          className="shrink-0 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
        >
          <img src="/images/filter .png" alt="فلتر" className="h-5 w-5" />
          الفلاتر
        </button>
        <button
          type="button"
          onClick={handleSearch}
          className="shrink-0 rounded-xl bg-[#1752F0] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1240c4]"
        >
          بحث
        </button>
      </div>

      {/* Filter drawer (slide-over) */}
      {showFilters && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowFilters(false)}
          />
          <aside
            className="relative ml-auto w-full max-w-md bg-white p-6"
            dir="rtl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">فلاتر البحث</h2>
              <button
                onClick={() => setShowFilters(false)}
                className="text-slate-500"
              >
                اغلاق
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {/* Destination search */}
              <div>
                <FilterLabel>ابحث قريب من (جامعة، كلية، منطقة)</FilterLabel>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirm}
                    disabled={!destinationName.trim() || confirmLoading}
                    className="shrink-0 rounded-xl bg-[#1752F0] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#1240c4] disabled:opacity-50"
                  >
                    {confirmLoading ? "جاري البحث..." : "تأكيد"}
                  </button>
                  <input
                    type="text"
                    value={destinationName}
                    onChange={(e) => handleDestinationChange(e.target.value)}
                    placeholder="مثال: كلية تجارة جامعة الإسكندرية"
                    dir="rtl"
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
                  />
                </div>

                {/* Confirmation feedback */}
                {confirmedDestination && (
                  <div className="mt-2 text-sm text-slate-500">
                    تم العثور على: {confirmedDestination.name}
                  </div>
                )}
              </div>

              {/* Other filters (reuse existing controls) */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <FilterLabel>المدينة</FilterLabel>
                  <input
                    value={filters.city}
                    onChange={(e) => updateFilter("city", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>المحافظة</FilterLabel>
                  <input
                    value={filters.governorate}
                    onChange={(e) =>
                      updateFilter("governorate", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>البلد</FilterLabel>
                  <input
                    value={filters.country}
                    onChange={(e) => updateFilter("country", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>عدد النزلاء</FilterLabel>
                  <input
                    type="number"
                    min="1"
                    value={filters.guests}
                    onChange={(e) => updateFilter("guests", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>الحد الأدنى للسعر</FilterLabel>
                  <input
                    value={filters.minPrice}
                    onChange={(e) => updateFilter("minPrice", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>الحد الأقصى للسعر</FilterLabel>
                  <input
                    value={filters.maxPrice}
                    onChange={(e) => updateFilter("maxPrice", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2"
                    dir="rtl"
                  />
                </div>
                <div>
                  <FilterLabel>نطاق البحث</FilterLabel>
                  <FilterSelect
                    value={filters.radiusKm}
                    onChange={(v) => updateFilter("radiusKm", Number(v))}
                    options={RADIUS_OPTIONS}
                  />
                </div>
                <div>
                  <FilterLabel>الفرز</FilterLabel>
                  <FilterSelect
                    value={filters.sortBy}
                    onChange={(v) => updateFilter("sortBy", v)}
                    options={[
                      { value: "", label: "الأكثر صلة" },
                      { value: "nearest", label: "الأقرب" },
                      { value: "price_asc", label: "الأرخص" },
                      { value: "price_desc", label: "الأغلى" },
                    ]}
                  />
                </div>
              </div>

              {/* Amenities selector */}
              <div>
                <FilterLabel>وسائل الراحة (اختياري)</FilterLabel>
                <AmenitiesSelector
                  amenityOptions={AMENITY_OPTIONS}
                  selectedAmenities={filters.amenities}
                  toggleAmenity={toggleAmenity}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    handleReset();
                    setShowFilters(false);
                  }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm"
                >
                  مسح
                </button>
                <button
                  onClick={() => {
                    setShowFilters(false);
                    handleSearch();
                  }}
                  className="ml-auto rounded-xl bg-[#1752F0] px-4 py-2 text-sm font-bold text-white"
                >
                  تطبيق
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* Confirmation feedback */}
      {confirmedDestination && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0 text-green-500"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          سيتم البحث قريباً من:{" "}
          <span className="font-bold">{confirmedDestination.name}</span>
        </div>
      )}

      {/* Map preview / modal UX */}
      <div className="mt-4">
        {approvedLocation ? (
          <div className="inline-flex items-center gap-3 rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-700">
            <svg
              viewBox="0 0 20 20"
              fill="currentColor"
              className="h-4 w-4 text-emerald-600"
            >
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" />
            </svg>
            الموقع محدد
            <button
              onClick={() => setShowMapModal(true)}
              className="ml-2 rounded-xl bg-white px-2 py-1 text-xs border"
            >
              تعديل الموقع
            </button>
          </div>
        ) : confirmedDestination ? (
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">
              موقع مُقترح:{" "}
              <span className="font-semibold">{confirmedDestination.name}</span>
            </div>
            <button
              onClick={() => setShowMapModal(true)}
              className="rounded-xl bg-[#1752F0] px-3 py-2 text-sm font-bold text-white"
            >
              تحديد على الخريطة
            </button>
          </div>
        ) : null}

        {/* Map modal */}
        {showMapModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8 sm:p-0">
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowMapModal(false)}
            />
            <div className="relative w-full max-w-4xl max-h-[calc(100vh-4rem)] bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-lg font-bold">تحديد الموقع على الخريطة</h3>
                <button
                  onClick={() => setShowMapModal(false)}
                  className="text-slate-500"
                >
                  إغلاق
                </button>
              </div>
              <div className="h-[420px] sm:h-[520px] overflow-hidden">
                <LocationPickerMap
                  position={
                    selectedLocation ||
                    approvedLocation ||
                    (confirmedDestination && {
                      lat: confirmedDestination.lat,
                      lng: confirmedDestination.lng,
                    })
                  }
                  onChange={handleMapChange}
                  height="100%"
                />
              </div>
              <div className="flex flex-col gap-3 border-t p-4 sm:flex-row sm:justify-end sm:items-center">
                <button
                  onClick={() => setShowMapModal(false)}
                  className="rounded-xl border px-4 py-2 text-sm"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    handleConfirmOnMap();
                    setShowMapModal(false);
                  }}
                  className="rounded-xl bg-[#10b981] px-4 py-2 text-sm font-bold text-white"
                >
                  تأكيد الموقع
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error feedback */}
      {confirmError && (
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          <svg
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4 shrink-0"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          {confirmError}
        </div>
      )}

      {/* Results */}
      {hasSearched && (
        <div>
          {/* Results count */}
          {!loading && meta && (
            <p className="mb-4 text-sm text-slate-500">
              تم العثور على{" "}
              <span className="font-bold text-[#0f172a]">{meta.total}</span>{" "}
              عقار
              {confirmedDestination && (
                <span>
                  {" "}
                  قريب من{" "}
                  <span className="font-bold text-[#1752F0]">
                    {confirmedDestination.name}
                  </span>
                </span>
              )}
            </p>
          )}

          <ListingsGrid listings={listings} loading={loading} error={error} />
        </div>
      )}

      {/* Prompt to search */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-100">
          <span className="text-5xl">🔍</span>
          <p className="mt-4 text-sm font-bold text-slate-600">
            اضغط على "بحث" لعرض النتائج
          </p>
          <p className="mt-1 text-xs text-slate-400">
            يمكنك البحث بدون فلاتر لعرض جميع العقارات
          </p>
        </div>
      )}
    </div>
  );
}
