import { useState, useCallback } from "react";
import { useListings } from "../hooks/useListings";
import { useDestinationSearch } from "../hooks/useDestinationSearch";
import { ListingsGrid } from "../components/sidebar/home/ListingsGrid";

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
  } = useDestinationSearch();

  const [filters, setFilters] = useState({
    city: "",
    governorate: "",
    minPrice: "",
    maxPrice: "",
    roomType: "",
    propertyType: "",
    genderPreference: "",
    radiusKm: 5,
  });

  const [hasSearched, setHasSearched] = useState(false);

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleConfirm = () => {
    confirmDestination({
      city: filters.city || undefined,
      governorate: filters.governorate || undefined,
    });
  };

  const handleSearch = () => {
    const searchParams = {
      city: filters.city || undefined,
      governorate: filters.governorate || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      roomType: filters.roomType || undefined,
      propertyType: filters.propertyType || undefined,
      genderPreference: filters.genderPreference || undefined,
      limit: 12,
    };

    // Add near search params if destination was confirmed
    if (confirmedDestination) {
      searchParams.nearLat = confirmedDestination.lat;
      searchParams.nearLng = confirmedDestination.lng;
      searchParams.radiusKm = filters.radiusKm;
      searchParams.sortBy = "nearest";
    }

    setHasSearched(true);
    fetchListings(searchParams);
  };

  const handleReset = () => {
    setFilters({
      city: "",
      governorate: "",
      minPrice: "",
      maxPrice: "",
      roomType: "",
      propertyType: "",
      genderPreference: "",
      radiusKm: 5,
    });
    setHasSearched(false);
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

      {/* Filter panel */}
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {/* Destination search */}
          <div className="lg:col-span-3">
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
          </div>

          {/* City */}
          <div>
            <FilterLabel>المدينة</FilterLabel>
            <input
              type="text"
              value={filters.city}
              onChange={(e) => updateFilter("city", e.target.value)}
              placeholder="مثال: الإسكندرية"
              dir="rtl"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>

          {/* Governorate */}
          <div>
            <FilterLabel>المحافظة</FilterLabel>
            <input
              type="text"
              value={filters.governorate}
              onChange={(e) => updateFilter("governorate", e.target.value)}
              placeholder="مثال: الجيزة"
              dir="rtl"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>

          {/* Radius — only shown when destination confirmed */}
          {confirmedDestination && (
            <div>
              <FilterLabel>نطاق البحث</FilterLabel>
              <FilterSelect
                value={filters.radiusKm}
                onChange={(v) => updateFilter("radiusKm", Number(v))}
                options={RADIUS_OPTIONS}
              />
            </div>
          )}

          {/* Min price */}
          <div>
            <FilterLabel>الحد الأدنى للإيجار (ج.م)</FilterLabel>
            <input
              type="number"
              value={filters.minPrice}
              onChange={(e) => updateFilter("minPrice", e.target.value)}
              placeholder="0"
              min="0"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>

          {/* Max price */}
          <div>
            <FilterLabel>الحد الأقصى للإيجار (ج.م)</FilterLabel>
            <input
              type="number"
              value={filters.maxPrice}
              onChange={(e) => updateFilter("maxPrice", e.target.value)}
              placeholder="غير محدد"
              min="0"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
            />
          </div>

          {/* Room type */}
          <div>
            <FilterLabel>نوع الوحدة</FilterLabel>
            <FilterSelect
              value={filters.roomType}
              onChange={(v) => updateFilter("roomType", v)}
              options={ROOM_TYPES}
            />
          </div>

          {/* Property type */}
          <div>
            <FilterLabel>نوع العقار</FilterLabel>
            <FilterSelect
              value={filters.propertyType}
              onChange={(v) => updateFilter("propertyType", v)}
              options={PROPERTY_TYPES}
            />
          </div>

          {/* Gender preference */}
          <div>
            <FilterLabel>تفضيل الجنس</FilterLabel>
            <FilterSelect
              value={filters.genderPreference}
              onChange={(v) => updateFilter("genderPreference", v)}
              options={GENDER_OPTIONS}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
          <button
            type="button"
            onClick={handleReset}
            className="text-sm font-semibold text-slate-400 transition hover:text-slate-600"
          >
            إعادة تعيين
          </button>

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-xl bg-[#1752F0] px-8 py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
          >
            {loading ? "جاري البحث..." : "بحث"}
          </button>
        </div>
      </div>

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
