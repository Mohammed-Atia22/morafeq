import { RatingSummary } from "../../../reviews/components/RatingSummary";
import { AdminDisputeReviewsList } from "./AdminDisputeReviewsList";
import { formatMoney } from "../../../payments/utils/paymentBreakdown";

const SUB_LABELS = {
  averageCleanliness: "النظافة",
  averageLocation: "الموقع",
  averageAccuracy: "دقة الوصف",
  averageValue: "القيمة مقابل السعر",
};

export function DisputeListingSection({ listing }) {
  if (!listing) {
    return (
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
        <p className="text-sm text-slate-400">لا توجد بيانات للعقار</p>
      </div>
    );
  }

  const cover = listing.photos?.find((photo) => photo.isCover)?.url ?? listing.photos?.[0]?.url;

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <h3 className="mb-4 text-sm font-black text-[#0f172a]">تفاصيل العقار</h3>

      <div className="grid gap-4 lg:grid-cols-[220px,1fr]">
        {cover && (
          <img
            src={cover}
            alt={listing.title}
            className="h-44 w-full rounded-xl object-cover"
          />
        )}

        <div className="space-y-2 text-sm">
          <p className="text-base font-black text-slate-900">{listing.title}</p>
          <p className="text-slate-500">
            {[listing.city, listing.governorate, listing.country].filter(Boolean).join(" — ")}
          </p>
          <p className="text-slate-600">{listing.description}</p>
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-600">
            <span>الإيجار: {formatMoney(listing.monthlyRent)}</span>
            <span>التأمين: {formatMoney(listing.depositAmount)}</span>
            <span>النوع: {listing.propertyType}</span>
            <span>الحالة: {listing.status}</span>
          </div>
        </div>
      </div>

      {listing.ratingSummary && (
        <div className="mt-4 space-y-3">
          <RatingSummary
            averageRating={listing.ratingSummary.averageRating ?? 0}
            reviewCount={listing.ratingSummary.totalReviews ?? 0}
            size="md"
          />
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {Object.entries(SUB_LABELS).map(([key, label]) => (
              <div key={key} className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-[10px] text-slate-400">{label}</p>
                <p className="text-sm font-black text-slate-800">
                  {Number(listing.ratingSummary[key] ?? 0).toFixed(1)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {listing.photos?.length > 1 && (
        <div className="mt-4 flex gap-2 overflow-x-auto">
          {listing.photos.map((photo) => (
            <img
              key={photo.id}
              src={photo.url}
              alt={listing.title}
              className="h-20 w-28 shrink-0 rounded-lg object-cover"
            />
          ))}
        </div>
      )}

      <div className="mt-4">
        <AdminDisputeReviewsList
          reviews={listing.reviews ?? []}
          title="تقييمات العقار"
        />
      </div>
    </div>
  );
}
