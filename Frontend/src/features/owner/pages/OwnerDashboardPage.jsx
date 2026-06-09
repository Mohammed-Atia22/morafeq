import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/hooks/useAuth";
import { listingsApi } from "../../listings/services/listingsApi";
import { AddListingForm } from "../../listings/components";
import roomOne from "../../../../images/rooms (1).jpg";
import roomTwo from "../../../../images/rooms (2).jpg";
import roomThree from "../../../../images/rooms (3).jpg";

const statusTabs = [
  { key: "all", label: "الكل" },
  { key: "available", label: "متاحة" },
  { key: "rented", label: "مؤجرة" },
  { key: "pending", label: "قيد المعاينة" },
];

const statusMeta = {
  ACTIVE: { label: "متاحة", dot: "bg-emerald-500", text: "text-emerald-600", filter: "available", accent: "emerald" },
  APPROVED: { label: "متاحة", dot: "bg-emerald-500", text: "text-emerald-600", filter: "available", accent: "emerald" },
  INACTIVE: { label: "مؤجرة", dot: "bg-violet-500", text: "text-violet-600", filter: "rented", accent: "violet" },
  DRAFT: { label: "مسودة", dot: "bg-slate-400", text: "text-slate-500", filter: "pending", accent: "amber" },
  PENDING_APPROVAL: { label: "قيد المعاينة", dot: "bg-amber-400", text: "text-amber-600", filter: "pending", accent: "amber" },
  REJECTED: { label: "مرفوضة", dot: "bg-red-500", text: "text-red-600", filter: "pending", accent: "amber" },
  SUSPENDED: { label: "موقوفة", dot: "bg-red-500", text: "text-red-600", filter: "pending", accent: "amber" },
};

const fallbackImages = [roomOne, roomTwo, roomThree];

const propertyTypeOptions = [
  { value: "APARTMENT", label: "شقة" },
  { value: "HOUSE", label: "منزل" },
  { value: "VILLA", label: "فيلا" },
  { value: "CABIN", label: "كوخ" },
  { value: "STUDIO", label: "ستوديو" },
  { value: "OTHER", label: "أخرى" },
];

const roomTypeOptions = [
  { value: "ENTIRE_PLACE", label: "الوحدة كاملة" },
  { value: "PRIVATE_ROOM", label: "غرفة خاصة" },
  { value: "SHARED_ROOM", label: "غرفة مشتركة" },
];

const genderPreferenceOptions = [
  { value: "ANY", label: "أي" },
  { value: "MALE", label: "للرجال فقط" },
  { value: "FEMALE", label: "للنساء فقط" },
];

const smokingPolicyOptions = [
  { value: "NOT_ALLOWED", label: "ممنوع" },
  { value: "ALLOWED", label: "مسموح" },
];

const locationPrivacyOptions = [
  { value: "APPROXIMATE", label: "تقريبي" },
  { value: "EXACT", label: "دقيق" },
];

const statusOptions = [
  { value: "ACTIVE", label: "متاحة" },
  { value: "INACTIVE", label: "مؤجرة" },
  { value: "PENDING_APPROVAL", label: "قيد المعاينة" },
  { value: "DRAFT", label: "مسودة" },
  { value: "APPROVED", label: "معتمدة" },
  { value: "REJECTED", label: "مرفوضة" },
  { value: "SUSPENDED", label: "موقوفة" },
];

const numericListingFields = [
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

const formatDateForInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const listingToForm = (listing) => ({
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

export function OwnerPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [activeSection, setActiveSection] = useState("listings");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    let ignore = false;

    const loadListings = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await listingsApi.findMyListings();

        if (!ignore) {
          setListings(Array.isArray(data) ? data : []);
        }
      } catch (caughtError) {
        if (!ignore) {
          if (/unauthorized|session expired|jwt expired/i.test(caughtError.message)) {
            logout();
            navigate("/login", { replace: true });
            return;
          }

          setError(caughtError.message);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadListings();

    return () => {
      ignore = true;
    };
  }, [logout, navigate]);

  const stats = useMemo(() => {
    const available = listings.filter((listing) => ["ACTIVE", "APPROVED"].includes(listing.status)).length;
    const rented = listings.filter((listing) => listing.status === "INACTIVE").length;
    const income = listings.reduce((total, listing) => total + Number(listing.monthlyRent || 0), 0);

    return [
      { label: "الإجمالي", value: listings.length },
      { label: "مؤجرة", value: rented },
      { label: "متاحة", value: available },
      { label: "الدخل", value: income.toLocaleString("en-US") },
    ];
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (activeFilter === "all") return listings;

    return listings.filter((listing) => {
      const meta = statusMeta[listing.status] || statusMeta.DRAFT;
      return meta.filter === activeFilter;
    });
  }, [activeFilter, listings]);

  const handleUpdateListing = async (id, payload) => {
    try {
      const updatedListing = await listingsApi.updateListing(id, payload);

      setListings((current) =>
        current.map((listing) =>
          listing.id === id
            ? {
                ...listing,
                ...updatedListing,
                photos: updatedListing.photos?.length ? updatedListing.photos : listing.photos,
                _count: updatedListing._count || listing._count,
              }
            : listing,
        ),
      );

      setEditingId(null);
      toast.success("تم تحديث العقار بنجاح");
    } catch (caughtError) {
      toast.error(caughtError.message || "تعذر تحديث العقار");
      throw caughtError;
    }
  };

  const handleCreatedListing = (result) => {
    if (result?.listing) {
      setListings((current) => [result.listing, ...current]);
    }

    setActiveSection("listings");
  };

  return (
    <div className="min-h-screen bg-[#eef3ff] text-[#172033]" dir="rtl">
      <aside className="fixed bottom-0 right-0 top-0 z-30 hidden w-[260px] border-l border-slate-200 bg-white lg:flex lg:flex-col">
        <OwnerSidebar
          user={user}
          logout={logout}
          activeSection={activeSection}
          setActiveSection={setActiveSection}
        />
      </aside>

      <div className="lg:pr-[260px]">
        <OwnerHeader />

        <main className="px-4 pb-24 pt-5 sm:px-6 lg:px-7 lg:pb-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => setActiveSection("add")}
              className="inline-flex h-11 w-fit items-center justify-center gap-2 rounded-xl bg-[#0b62d8] px-5 text-sm font-black text-white shadow-sm transition hover:bg-[#0754bd]"
            >
              <PlusIcon className="h-5 w-5" />
              إضافة شقة
            </button>
          </div>

          {activeSection === "add" ? (
            <AddListingForm embedded onCreated={handleCreatedListing} />
          ) : ["dashboard", "listings"].includes(activeSection) ? (
            <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={stat.label} className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm">
                <p className={["text-lg font-black", index === 3 ? "text-[#7657d8]" : index === 2 ? "text-emerald-500" : "text-[#1c3370]"].join(" ")}>
                  {stat.value}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{stat.label}</p>
              </div>
            ))}
          </section>

          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveFilter(tab.key)}
                className={[
                  "h-10 rounded-xl border px-5 text-sm font-black transition",
                  activeFilter === tab.key
                    ? "border-[#0b62d8] bg-[#0b62d8] text-white shadow-sm"
                    : "border-slate-200 bg-white text-slate-500 hover:border-[#0b62d8] hover:text-[#0b62d8]",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loading ? (
            <DashboardState title="جاري تحميل عقاراتك..." />
          ) : error ? (
            <DashboardState title="تعذر تحميل العقارات" text={error} />
          ) : filteredListings.length ? (
            <section className="mt-4 grid gap-4 xl:grid-cols-2">
              {filteredListings.map((listing, index) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  fallbackImage={fallbackImages[index % fallbackImages.length]}
                  isEditing={editingId === listing.id}
                  onEdit={() => setEditingId(listing.id)}
                  onCancel={() => setEditingId(null)}
                  onSave={handleUpdateListing}
                />
              ))}
            </section>
          ) : (
            <DashboardState title="لا توجد عقارات في هذا القسم" text="ابدأ بإضافة شقة جديدة أو جرّب فلتر آخر." />
          )}
            </>
          ) : (
            <DashboardState title="هذا القسم قيد التجهيز" text="القائمة الجانبية الآن تغيّر محتوى لوحة المالك بدون فتح صفحة منفصلة." />
          )}
        </main>

        <nav className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
          <MobileNavItem label="لوحة التحكم" icon={GridIcon} active={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
          <MobileNavItem label="عقاراتي" icon={BuildingIcon} active={activeSection === "listings"} onClick={() => setActiveSection("listings")} />
          <button type="button" onClick={() => setActiveSection("add")} className={["flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black", activeSection === "add" ? "bg-[#e9f0ff] text-[#0b62d8]" : "text-slate-500"].join(" ")}>
            <PlusCircleIcon className="h-5 w-5" />
            إضافة شقة
          </button>
          <MobileNavItem label="الإعدادات" icon={SettingsIcon} active={activeSection === "settings"} onClick={() => setActiveSection("settings")} />
        </nav>
      </div>
    </div>
  );
}

function OwnerHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div>
          <h1 className="text-2xl font-black text-[#172033]">عقاراتي</h1>
          <p className="text-sm font-semibold text-slate-500">إجمالي عقاراتك</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-[#0b62d8] shadow-sm">
            <BellIcon className="h-5 w-5" />
            <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <Link to="/" className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm sm:inline-flex">
            العودة للموقع
          </Link>
        </div>
      </div>
    </header>
  );
}

function OwnerSidebar({ user, logout, activeSection, setActiveSection }) {
  return (
    <>
      <div className="flex h-[74px] items-center gap-3 border-b border-slate-200 px-5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0b62d8] text-xl font-black text-white">س</div>
        <div>
          <p className="text-lg font-black text-[#172033]">مرافق</p>
          <p className="text-xs font-semibold text-slate-400">لوحة تحكم المالك</p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        <SidebarItem label="لوحة التحكم" icon={GridIcon} active={activeSection === "dashboard"} onClick={() => setActiveSection("dashboard")} />
        <SidebarItem label="عقاراتي" icon={BuildingIcon} active={activeSection === "listings"} onClick={() => setActiveSection("listings")} />
        <SidebarItem label="طلبات المعاينة" icon={EyeIcon} active={activeSection === "requests"} onClick={() => setActiveSection("requests")} badge="5" />
        <button type="button" onClick={() => setActiveSection("add")} className={["flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition", activeSection === "add" ? "bg-[#e9f0ff] text-[#0b62d8]" : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]"].join(" ")}>
          <PlusCircleIcon className="h-5 w-5" />
          إضافة شقة
        </button>
        <SidebarItem label="الرسائل" icon={MessageIcon} active={activeSection === "messages"} onClick={() => setActiveSection("messages")} badge="11" danger />
        <SidebarItem label="الإعدادات" icon={SettingsIcon} active={activeSection === "settings"} onClick={() => setActiveSection("settings")} />
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#eef3ff] p-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0aa886] text-lg font-black text-white">
            {user?.firstName?.[0] || "ك"}
          </div>
          <div>
            <p className="text-sm font-black text-[#172033]">{[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "كريم محمود"}</p>
            <p className="text-xs font-semibold text-emerald-500">مالك موثق</p>
          </div>
        </div>
        <button type="button" onClick={logout} className="w-full text-center text-sm font-bold text-red-500">
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}

function SidebarItem({ label, icon: Icon, active = false, badge, danger = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-bold transition",
        active ? "bg-[#e9f0ff] text-[#0b62d8]" : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
      ].join(" ")}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      {badge ? (
        <span className={["grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white", danger ? "bg-red-500" : "bg-amber-500"].join(" ")}>
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function ListingCard({ listing, fallbackImage, isEditing, onEdit, onCancel, onSave }) {
  const [form, setForm] = useState(() => listingToForm(listing));
  const [saving, setSaving] = useState(false);
  const meta = statusMeta[listing.status] || statusMeta.DRAFT;
  const image = listing.photos?.[0]?.url || fallbackImage;
  const reviewCount = listing._count?.reviews || 0;
  const bookingCount = listing._count?.bookings || 0;
  const roomsCount = listing.bedrooms || listing.beds || 0;

  useEffect(() => {
    setForm(listingToForm(listing));
  }, [listing]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = { ...form };

      numericListingFields.forEach((field) => {
        payload[field] = payload[field] === "" || payload[field] === null ? undefined : Number(payload[field]);
      });

      if (payload.maximumStayMonths === undefined) {
        payload.maximumStayMonths = null;
      }

      await onSave(listing.id, payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[142px] overflow-hidden sm:h-[164px]">
        <img src={image} alt={listing.title} className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-transparent" />
        <span className={["absolute right-4 top-4 inline-flex items-center gap-2 text-xs font-black", meta.text].join(" ")}>
          <span className={["h-2.5 w-2.5 rounded-full shadow-sm", meta.dot].join(" ")} />
          {meta.label}
        </span>
        <span className="absolute left-4 top-4 inline-flex items-center gap-1 text-xs font-black text-emerald-500">
          موثق
          <CheckIcon className="h-4 w-4" />
        </span>
      </div>

      <div className="p-4">
        {isEditing ? (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-3">
              <p className="text-base font-black text-[#172033]">تعديل بيانات العقار</p>
              <p className="text-xs font-semibold text-slate-500">كل الحقول الحالية جاهزة للتعديل والحفظ.</p>
            </div>

            <EditField label="عنوان الشقة" value={form.title} onChange={(value) => updateField("title", value)} required />
            <EditField label="وصف الشقة" type="textarea" value={form.description} onChange={(value) => updateField("description", value)} required />

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="نوع العقار" type="select" value={form.propertyType} onChange={(value) => updateField("propertyType", value)} options={propertyTypeOptions} />
              <EditField label="نوع الوحدة" type="select" value={form.roomType} onChange={(value) => updateField("roomType", value)} options={roomTypeOptions} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="الإيجار الشهري" type="number" min="1" value={form.monthlyRent} onChange={(value) => updateField("monthlyRent", value)} required />
              <EditField label="مبلغ التأمين" type="number" min="0" value={form.depositAmount} onChange={(value) => updateField("depositAmount", value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <EditField label="عدد السكان" type="number" min="1" value={form.maxTenants} onChange={(value) => updateField("maxTenants", value)} required />
              <EditField label="غرف النوم" type="number" min="1" value={form.bedrooms} onChange={(value) => updateField("bedrooms", value)} required />
              <EditField label="الأسرّة" type="number" min="1" value={form.beds} onChange={(value) => updateField("beds", value)} required />
              <EditField label="الحمامات" type="number" min="1" value={form.bathrooms} onChange={(value) => updateField("bathrooms", value)} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="متاح من" type="date" value={form.availableFrom} onChange={(value) => updateField("availableFrom", value)} required />
              <EditField label="حالة العقار" type="select" value={form.status} onChange={(value) => updateField("status", value)} options={statusOptions} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="أقل مدة إقامة بالشهور" type="number" min="1" value={form.minimumStayMonths} onChange={(value) => updateField("minimumStayMonths", value)} />
              <EditField label="أقصى مدة إقامة بالشهور" type="number" min="1" value={form.maximumStayMonths} onChange={(value) => updateField("maximumStayMonths", value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="تفضيل الجنس" type="select" value={form.genderPreference} onChange={(value) => updateField("genderPreference", value)} options={genderPreferenceOptions} />
              <EditField label="التدخين" type="select" value={form.smokingPolicy} onChange={(value) => updateField("smokingPolicy", value)} options={smokingPolicyOptions} />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ToggleField label="مفروش" checked={form.furnished} onChange={(value) => updateField("furnished", value)} />
              <ToggleField label="المرافق مشمولة" checked={form.utilitiesIncluded} onChange={(value) => updateField("utilitiesIncluded", value)} />
              <ToggleField label="الإنترنت مشمول" checked={form.internetIncluded} onChange={(value) => updateField("internetIncluded", value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="المحافظة" value={form.governorate} onChange={(value) => updateField("governorate", value)} required />
              <EditField label="المدينة" value={form.city} onChange={(value) => updateField("city", value)} required />
              <EditField label="المنطقة" value={form.areaName} onChange={(value) => updateField("areaName", value)} required />
              <EditField label="اسم الشارع" value={form.streetName} onChange={(value) => updateField("streetName", value)} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="رقم العمارة" value={form.buildingNumber} onChange={(value) => updateField("buildingNumber", value)} />
              <EditField label="رقم الطابق" value={form.floorNumber} onChange={(value) => updateField("floorNumber", value)} />
              <EditField label="رقم الشقة" value={form.apartmentNumber} onChange={(value) => updateField("apartmentNumber", value)} />
              <EditField label="معلم قريب" value={form.nearbyLandmark} onChange={(value) => updateField("nearbyLandmark", value)} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="خط العرض" type="number" step="any" min="-90" max="90" value={form.lat} onChange={(value) => updateField("lat", value)} required />
              <EditField label="خط الطول" type="number" step="any" min="-180" max="180" value={form.lng} onChange={(value) => updateField("lng", value)} required />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="خصوصية الموقع" type="select" value={form.locationPrivacy} onChange={(value) => updateField("locationPrivacy", value)} options={locationPrivacyOptions} />
              <EditField label="الدولة" value={form.country} onChange={(value) => updateField("country", value)} />
            </div>

            <EditField label="عنوان جوجل" value={form.googleFormattedAddress} onChange={(value) => updateField("googleFormattedAddress", value)} />
            <EditField label="Google Place ID" value={form.googlePlaceId} onChange={(value) => updateField("googlePlaceId", value)} />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button type="submit" disabled={saving} className="h-11 flex-1 rounded-xl bg-[#0b62d8] text-sm font-black text-white transition hover:bg-[#0754bd] disabled:opacity-60">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button type="button" onClick={onCancel} disabled={saving} className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-black text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60">
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="text-right">
              <h2 className="text-lg font-black text-[#172033]">{listing.title}</h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {listing.city || listing.governorate || "غير محدد"} · {Number(listing.monthlyRent || 0).toLocaleString("en-US")} ج.م/شهر
              </p>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1"><EyeIcon className="h-4 w-4" />{listing.viewsCount || 0}</span>
              <span>{reviewCount ? `★ ${reviewCount}` : "لا تقييمات"}</span>
              <span>{bookingCount} طلب</span>
              <span>{roomsCount} غرفة</span>
              <span>{listing.bathrooms || 0} حمام</span>
            </div>

            <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
              <button type="button" onClick={onEdit} className="h-10 rounded-xl border border-[#0b4779] text-sm font-black text-[#0b4779] transition hover:bg-blue-50">
                تعديل
              </button>
              <button type="button" className="h-10 rounded-xl border border-slate-200 text-sm font-black text-slate-500">
                معاينات
              </button>
              <button type="button" className="grid h-10 w-10 place-items-center rounded-xl border border-amber-100 bg-white text-amber-500">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}

function EditField({ label, value, onChange, type = "text", options = [], className = "", ...props }) {
  const fieldClassName = [
    "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#172033] outline-none transition focus:border-[#0b62d8] focus:ring-2 focus:ring-blue-100",
    type === "textarea" ? "min-h-28 py-3 resize-y" : "h-11",
  ].join(" ");

  return (
    <label className={["flex flex-col gap-2 text-right text-xs font-black text-slate-500", className].join(" ")}>
      {label}
      {type === "select" ? (
        <select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} {...props}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} {...props} />
      ) : (
        <input type={type} value={value} onChange={(event) => onChange(event.target.value)} className={fieldClassName} {...props} />
      )}
    </label>
  );
}

function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#172033]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#0b62d8]"
      />
    </label>
  );
}

function DashboardState({ title, text }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <p className="text-lg font-black text-[#172033]">{title}</p>
      {text ? <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p> : null}
    </div>
  );
}

function MobileNavItem({ label, icon: Icon, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={["flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black", active ? "bg-[#e9f0ff] text-[#0b62d8]" : "text-slate-500"].join(" ")}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

function IconBase({ children, className = "h-5 w-5" }) {
  return <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">{children}</svg>;
}
function PlusIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" d="M12 5v14M5 12h14" /></IconBase>;
}
function BellIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 20h4" /></IconBase>;
}
function GridIcon({ className }) {
  return <IconBase className={className}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" /></IconBase>;
}
function BuildingIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 21V4h12v17M4 21h16M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-5h4v5" /></IconBase>;
}
function EyeIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></IconBase>;
}
function PlusCircleIcon({ className }) {
  return <IconBase className={className}><circle cx="12" cy="12" r="9" /><path strokeLinecap="round" d="M12 8v8M8 12h8" /></IconBase>;
}
function MessageIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4A8 8 0 1 1 21 12Z" /></IconBase>;
}
function SettingsIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a8.8 8.8 0 0 0 .1-6l-2.1-.5-1-2-2 .8a9 9 0 0 0-5 0l-2-.8-1 2-2.1.5a8.8 8.8 0 0 0 .1 6l2 .5 1 2 2-.8a9 9 0 0 0 5 0l2 .8 1-2 2-.5Z" /></IconBase>;
}
function CheckIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="m5 12 4 4L19 6" /></IconBase>;
}
function TrashIcon({ className }) {
  return <IconBase className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 14h10l1-14M9 7V4h6v3" /></IconBase>;
}
