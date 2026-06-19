import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { listingsApi } from "../../../listings/services/listingsApi";
import { RatingSummary } from "../../../reviews/components/RatingSummary";
import { CheckIcon, EyeIcon, TrashIcon } from "../common/OwnerIcons";
import {
  genderPreferenceOptions,
  locationPrivacyOptions,
  numericListingFields,
  propertyTypeOptions,
  roomTypeOptions,
  smokingPolicyOptions,
  statusOptions,
} from "../../constants/listingFormOptions";
import { statusMeta } from "../../constants/ownerDashboard";
import { listingToForm } from "../../utils/listingForm";
import { EditField } from "./EditField";
import { ToggleField } from "./ToggleField";

export function ListingCard({
  listing,
  fallbackImage,
  isEditing,
  onEdit,
  onDelete,
  onCancel,
  onSave,
}) {
  const [form, setForm] = useState(() => listingToForm(listing));
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const meta = statusMeta[listing.status] || statusMeta.DRAFT;
  const image = listing.photos?.[0]?.url || fallbackImage;
  const reviewCount = listing._count?.reviews || 0;
  const bookingCount = listing._count?.bookings || 0;
  const roomsCount = listing.bedrooms || listing.beds || 0;
  const reservedPlaces = Number(listing.reservedPlaces ?? 0);
  const availablePlaces = Number(
    listing.availablePlaces ?? Math.max(0, (listing.maxTenants ?? 0) - reservedPlaces),
  );

  useEffect(() => {
    setForm(listingToForm(listing));
  }, [listing]);

  const handlePublish = async () => {
    try {
      setPublishing(true);
      await listingsApi.publishListing(listing.id);
      toast.success("تم إرسال العقار للمراجعة بنجاح");
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err) {
      toast.error(err.message || "فشلت عملية الإرسال للمراجعة");
    } finally {
      setPublishing(false);
    }
  };

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

      await onSave(listing.id, payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="relative h-[142px] overflow-hidden sm:h-[164px]">
        <img
          src={image}
          alt={listing.title}
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-transparent" />
        <span
          className={[
            "absolute right-4 top-4 inline-flex items-center gap-2 text-xs font-black",
            meta.text,
          ].join(" ")}
        >
          <span
            className={["h-2.5 w-2.5 rounded-full shadow-sm", meta.dot].join(
              " ",
            )}
          />
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
              <p className="text-base font-black text-[#172033]">
                تعديل بيانات العقار
              </p>
              <p className="text-xs font-semibold text-slate-500">
                كل الحقول الحالية جاهزة للتعديل والحفظ.
              </p>
            </div>

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
              <EditField
                label="عدد السكان"
                type="number"
                min="1"
                value={form.maxTenants}
                onChange={(value) => updateField("maxTenants", value)}
                required
              />
              <EditField
                label="غرف النوم"
                type="number"
                min="1"
                value={form.bedrooms}
                onChange={(value) => updateField("bedrooms", value)}
                required
              />
              <EditField
                label="الأسرّة"
                type="number"
                min="1"
                value={form.beds}
                onChange={(value) => updateField("beds", value)}
                required
              />
              <EditField
                label="الحمامات"
                type="number"
                min="1"
                value={form.bathrooms}
                onChange={(value) => updateField("bathrooms", value)}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="متاح من"
                type="date"
                value={form.availableFrom}
                onChange={(value) => updateField("availableFrom", value)}
                required
              />
              <EditField
                label="حالة العقار"
                type="select"
                value={form.status}
                onChange={(value) => updateField("status", value)}
                options={statusOptions}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="أقل مدة إقامة بالشهور"
                type="number"
                min="1"
                value={form.minimumStayMonths}
                onChange={(value) => updateField("minimumStayMonths", value)}
              />
              <EditField
                label="أقصى مدة إقامة بالشهور"
                type="number"
                min="1"
                value={form.maximumStayMonths}
                onChange={(value) => updateField("maximumStayMonths", value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="تفضيل الجنس"
                type="select"
                value={form.genderPreference}
                onChange={(value) => updateField("genderPreference", value)}
                options={genderPreferenceOptions}
              />
              <EditField
                label="التدخين"
                type="select"
                value={form.smokingPolicy}
                onChange={(value) => updateField("smokingPolicy", value)}
                options={smokingPolicyOptions}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <ToggleField
                label="مفروش"
                checked={form.furnished}
                onChange={(value) => updateField("furnished", value)}
              />
              <ToggleField
                label="المرافق مشمولة"
                checked={form.utilitiesIncluded}
                onChange={(value) => updateField("utilitiesIncluded", value)}
              />
              <ToggleField
                label="الإنترنت مشمول"
                checked={form.internetIncluded}
                onChange={(value) => updateField("internetIncluded", value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="المحافظة"
                value={form.governorate}
                onChange={(value) => updateField("governorate", value)}
                required
              />
              <EditField
                label="المدينة"
                value={form.city}
                onChange={(value) => updateField("city", value)}
                required
              />
              <EditField
                label="المنطقة"
                value={form.areaName}
                onChange={(value) => updateField("areaName", value)}
                required
              />
              <EditField
                label="اسم الشارع"
                value={form.streetName}
                onChange={(value) => updateField("streetName", value)}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="رقم العمارة"
                value={form.buildingNumber}
                onChange={(value) => updateField("buildingNumber", value)}
              />
              <EditField
                label="رقم الطابق"
                value={form.floorNumber}
                onChange={(value) => updateField("floorNumber", value)}
              />
              <EditField
                label="رقم الشقة"
                value={form.apartmentNumber}
                onChange={(value) => updateField("apartmentNumber", value)}
              />
              <EditField
                label="معلم قريب"
                value={form.nearbyLandmark}
                onChange={(value) => updateField("nearbyLandmark", value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="خط العرض"
                type="number"
                step="any"
                min="-90"
                max="90"
                value={form.lat}
                onChange={(value) => updateField("lat", value)}
                required
              />
              <EditField
                label="خط الطول"
                type="number"
                step="any"
                min="-180"
                max="180"
                value={form.lng}
                onChange={(value) => updateField("lng", value)}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <EditField
                label="خصوصية الموقع"
                type="select"
                value={form.locationPrivacy}
                onChange={(value) => updateField("locationPrivacy", value)}
                options={locationPrivacyOptions}
              />
              <EditField
                label="الدولة"
                value={form.country}
                onChange={(value) => updateField("country", value)}
              />
            </div>

            <EditField
              label="عنوان جوجل"
              value={form.googleFormattedAddress}
              onChange={(value) => updateField("googleFormattedAddress", value)}
            />
            <EditField
              label="معرف مكان جوجل"
              value={form.googlePlaceId}
              onChange={(value) => updateField("googlePlaceId", value)}
            />

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="submit"
                disabled={saving}
                className="h-11 flex-1 rounded-xl bg-[#0b62d8] text-sm font-black text-white transition hover:bg-[#0754bd] disabled:opacity-60"
              >
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-black text-slate-500 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                إلغاء
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="text-right">
              <h2 className="text-lg font-black text-[#172033]">
                {listing.title}
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-500">
                {listing.city || listing.governorate || "غير محدد"} ·{" "}
                {Number(listing.monthlyRent || 0).toLocaleString("ar-EG")}{" "}
                ج.م/شهر
              </p>
            </div>

            {(listing.status === "REJECTED" || listing.status === "SUSPENDED") && listing.rejectionReason && (
              <div className="mt-3 rounded-xl bg-red-50 p-3 text-right text-xs font-bold text-red-600 border border-red-100">
                <span>سبب الرفض/التعليق: </span>
                <span className="font-semibold text-red-700">{listing.rejectionReason}</span>
              </div>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-bold text-slate-500">
              <span className="inline-flex items-center gap-1">
                <EyeIcon className="h-4 w-4" />
                {listing.viewsCount || 0}
              </span>
              <RatingSummary
                averageRating={listing.averageRating ?? 0}
                reviewCount={reviewCount}
                size="xs"
              />
              <span>{bookingCount} طلب</span>
              <span>{roomsCount} غرفة</span>
              <span>{listing.bathrooms || 0} حمام</span>
              <span>السعة {Number(listing.maxTenants || 0).toLocaleString("ar-EG")}</span>
              <span>المحجوز {reservedPlaces.toLocaleString("ar-EG")}</span>
              <span>المتبقي {availablePlaces.toLocaleString("ar-EG")}</span>
            </div>

            {listing.roomType !== "ENTIRE_PLACE" && listing.rooms?.length > 0 && (
              <div className="mt-3 grid gap-2 rounded-xl bg-slate-50 p-3 text-xs font-bold text-slate-600">
                {listing.rooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between">
                    <span>{room.roomName}</span>
                    <span>
                      {Number(room.occupiedCount || 0).toLocaleString("ar-EG")} /{" "}
                      {Number(room.capacity || 0).toLocaleString("ar-EG")}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
              <button
                type="button"
                onClick={onEdit}
                className="h-10 rounded-xl border border-[#0b4779] text-sm font-black text-[#0b4779] transition hover:bg-blue-50"
              >
                تعديل
              </button>
              
              {["DRAFT", "REJECTED"].includes(listing.status) ? (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="h-10 rounded-xl bg-blue-600 text-sm font-black text-white transition hover:bg-blue-700 disabled:opacity-50"
                >
                  {publishing ? "جاري الإرسال..." : "تقديم للمراجعة"}
                </button>
              ) : (
                <button
                  type="button"
                  className="h-10 rounded-xl border border-slate-200 text-sm font-black text-slate-500 disabled:opacity-50"
                  disabled
                >
                  {listing.status === "PENDING_APPROVAL" ? "قيد المراجعة" : "معاينات"}
                </button>
              )}

              <button
                type="button"
                onClick={onDelete}
                className="grid h-10 w-10 place-items-center rounded-xl border border-amber-100 bg-white text-amber-500"
                aria-label="حذف العقار"
              >
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </article>
  );
}
