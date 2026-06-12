import { useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { listingsApi } from "../services/listingsApi";

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
  googleFormattedAddress: listing.googleFormattedAddress || "",
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

export default function EditListingPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveSection, logout } = useOutletContext();
  const [form, setForm] = useState(null);
  const [listingTitle, setListingTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setActiveSection?.("listings");

    let ignore = false;

    const loadListing = async () => {
      try {
        setLoading(true);
        setError("");
        const listing = await listingsApi.findListing(id);

        if (!ignore) {
          setForm(listingToForm(listing));
          setListingTitle(listing.title || "");
        }
      } catch (caughtError) {
        if (!ignore) {
          if (/unauthorized|session expired|jwt expired/i.test(caughtError.message)) {
            logout?.();
            navigate("/login", { replace: true });
            return;
          }

          setError(caughtError.message || "تعذر تحميل بيانات العقار");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    loadListing();

    return () => {
      ignore = true;
    };
  }, [id, logout, navigate, setActiveSection]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = { ...form };

      numericListingFields.forEach((field) => {
        payload[field] =
          payload[field] === "" || payload[field] === null
            ? undefined
            : Number(payload[field]);
      });

      if (payload.maximumStayMonths === undefined) {
        payload.maximumStayMonths = null;
      }

      await listingsApi.updateListing(id, payload);
      toast.success("تم تحديث العقار بنجاح");
      navigate("/owner");
    } catch (caughtError) {
      toast.error(caughtError.message || "تعذر تحديث العقار");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageState title="جاري تحميل بيانات العقار..." />;
  }

  if (error || !form) {
    return (
      <PageState
        title="تعذر فتح صفحة التعديل"
        text={error || "العقار غير موجود"}
        actionLabel="العودة لعقاراتي"
        onAction={() => navigate("/owner")}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#eef3ff] px-4 py-5 text-[#172033] sm:px-6 lg:px-7" dir="rtl">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black text-[#0b62d8]">تعديل عقار</p>
            <h1 className="mt-1 text-2xl font-black text-[#172033]">
              {listingTitle || "بيانات الشقة"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/owner")}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-black text-slate-500 transition hover:border-[#0b62d8] hover:text-[#0b62d8]"
          >
            رجوع
          </button>
        </div>

        <form className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6" onSubmit={handleSubmit}>
          <FormSection title="المعلومات الأساسية">
            <EditField
              label="عنوان الشقة"
              value={form.title}
              onChange={(value) => updateField("title", value)}
              required
            />
            <EditField
              label="وصف الشقة"
              type="textarea"
              value={form.description}
              onChange={(value) => updateField("description", value)}
              required
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="نوع العقار"
                type="select"
                value={form.propertyType}
                onChange={(value) => updateField("propertyType", value)}
                options={propertyTypeOptions}
              />
              <EditField
                label="نوع الوحدة"
                type="select"
                value={form.roomType}
                onChange={(value) => updateField("roomType", value)}
                options={roomTypeOptions}
              />
            </div>
          </FormSection>

          <FormSection title="السعر والسعة">
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="الإيجار الشهري"
                type="number"
                min="1"
                value={form.monthlyRent}
                onChange={(value) => updateField("monthlyRent", value)}
                required
              />
              <EditField
                label="مبلغ التأمين"
                type="number"
                min="0"
                value={form.depositAmount}
                onChange={(value) => updateField("depositAmount", value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <EditField label="عدد السكان" type="number" min="1" value={form.maxTenants} onChange={(value) => updateField("maxTenants", value)} required />
              <EditField label="غرف النوم" type="number" min="1" value={form.bedrooms} onChange={(value) => updateField("bedrooms", value)} required />
              <EditField label="الأسرة" type="number" min="1" value={form.beds} onChange={(value) => updateField("beds", value)} required />
              <EditField label="الحمامات" type="number" min="1" value={form.bathrooms} onChange={(value) => updateField("bathrooms", value)} required />
            </div>
          </FormSection>

          <FormSection title="القواعد والحالة">
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="متاح من" type="date" value={form.availableFrom} onChange={(value) => updateField("availableFrom", value)} required />
              <EditField label="حالة العقار" type="select" value={form.status} onChange={(value) => updateField("status", value)} options={statusOptions} />
              <EditField label="أقل مدة إقامة بالشهور" type="number" min="1" value={form.minimumStayMonths} onChange={(value) => updateField("minimumStayMonths", value)} />
              <EditField label="أقصى مدة إقامة بالشهور" type="number" min="1" value={form.maximumStayMonths} onChange={(value) => updateField("maximumStayMonths", value)} />
              <EditField label="تفضيل الجنس" type="select" value={form.genderPreference} onChange={(value) => updateField("genderPreference", value)} options={genderPreferenceOptions} />
              <EditField label="التدخين" type="select" value={form.smokingPolicy} onChange={(value) => updateField("smokingPolicy", value)} options={smokingPolicyOptions} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <ToggleField label="مفروش" checked={form.furnished} onChange={(value) => updateField("furnished", value)} />
              <ToggleField label="المرافق مشمولة" checked={form.utilitiesIncluded} onChange={(value) => updateField("utilitiesIncluded", value)} />
              <ToggleField label="الإنترنت مشمول" checked={form.internetIncluded} onChange={(value) => updateField("internetIncluded", value)} />
            </div>
          </FormSection>

          <FormSection title="العنوان">
            <div className="grid gap-3 sm:grid-cols-2">
              <EditField label="المحافظة" value={form.governorate} onChange={(value) => updateField("governorate", value)} required />
              <EditField label="المدينة" value={form.city} onChange={(value) => updateField("city", value)} required />
              <EditField label="المنطقة" value={form.areaName} onChange={(value) => updateField("areaName", value)} required />
              <EditField label="اسم الشارع" value={form.streetName} onChange={(value) => updateField("streetName", value)} required />
              <EditField label="رقم العمارة" value={form.buildingNumber} onChange={(value) => updateField("buildingNumber", value)} />
              <EditField label="رقم الطابق" value={form.floorNumber} onChange={(value) => updateField("floorNumber", value)} />
              <EditField label="رقم الشقة" value={form.apartmentNumber} onChange={(value) => updateField("apartmentNumber", value)} />
              <EditField label="معلم قريب" value={form.nearbyLandmark} onChange={(value) => updateField("nearbyLandmark", value)} />
              <EditField label="خصوصية الموقع" type="select" value={form.locationPrivacy} onChange={(value) => updateField("locationPrivacy", value)} options={locationPrivacyOptions} />
              <EditField label="الدولة" value={form.country} onChange={(value) => updateField("country", value)} />
            </div>
            <EditField
              label="عنوان جوجل"
              value={form.googleFormattedAddress}
              onChange={(value) => updateField("googleFormattedAddress", value)}
            />
          </FormSection>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="submit"
              disabled={saving}
              className="h-11 flex-1 rounded-xl bg-[#0b62d8] text-sm font-black text-white transition hover:bg-[#0754bd] disabled:opacity-60"
            >
              {saving ? "جاري الحفظ..." : "حفظ التعديلات"}
            </button>
            <button
              type="button"
              onClick={() => navigate("/owner")}
              disabled={saving}
              className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-black text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormSection({ title, children }) {
  return (
    <section className="border-b border-slate-100 py-5 first:pt-0 last:border-b-0">
      <h2 className="mb-4 text-base font-black text-[#172033]">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function EditField({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  className = "",
  ...props
}) {
  const fieldClassName = [
    "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#172033] outline-none transition focus:border-[#0b62d8] focus:ring-2 focus:ring-blue-100",
    type === "textarea" ? "min-h-28 resize-y py-3" : "h-11",
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

function PageState({ title, text, actionLabel, onAction }) {
  return (
    <div className="min-h-screen bg-[#eef3ff] px-4 py-5 text-[#172033]" dir="rtl">
      <div className="mx-auto mt-8 max-w-3xl rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
        <p className="text-lg font-black text-[#172033]">{title}</p>
        {text ? <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p> : null}
        {actionLabel ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-5 h-11 rounded-xl bg-[#0b62d8] px-5 text-sm font-black text-white"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
