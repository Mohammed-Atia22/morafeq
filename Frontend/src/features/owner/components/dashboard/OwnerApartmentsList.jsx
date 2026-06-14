import { BuildingIcon } from "../common/OwnerIcons";

export function OwnerApartmentsList({
  listings,
  fallbackImages,
  onAdd,
  onEdit,
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4">
        <div className="flex items-center gap-2">
          <BuildingIcon className="h-5 w-5 text-[#0b62d8]" />
          <h2 className="text-lg font-black text-[#172033]">عقاراتي</h2>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="h-9 rounded-xl bg-[#1f5bd7] px-4 text-sm font-black text-white transition hover:bg-[#174bb8]"
        >
          + إضافة
        </button>
      </div>

      {listings.length ? (
        <div className="divide-y divide-slate-100">
          {listings.map((listing, index) => {
            const image =
              listing.photos?.[0]?.url ||
              fallbackImages[index % fallbackImages.length];

            return (
              <article
                key={listing.id}
                className="flex items-center gap-4 px-4 py-3"
              >
                <img
                  src={image}
                  alt={listing.title}
                  className="h-16 w-16 rounded-xl object-cover"
                />
                <div className="min-w-0 flex-1 text-right">
                  <h3 className="truncate text-sm font-black text-[#172033]">
                    {listing.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {[listing.city, listing.governorate]
                      .filter(Boolean)
                      .join(" - ") || "غير محدد"}
                  </p>
                  <div className="mt-2 flex items-center justify-end gap-2 text-xs font-bold text-slate-500">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span>{listing.status === "INACTIVE" ? "مؤجرة" : "متاحة"}</span>
                    <span>•</span>
                    <span>{listing.viewsCount || 0} مشاهدة</span>
                  </div>
                </div>
                <div className="text-left">
                  <p className="text-sm font-black text-[#1f5bd7]">
                    {Number(listing.monthlyRent || 0).toLocaleString("en-US")}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">ج.م</p>
                  <button
                    type="button"
                    onClick={() => onEdit(listing.id)}
                    className="mt-2 text-xs font-black text-slate-500 transition hover:text-[#0b62d8]"
                  >
                    تعديل
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="px-5 py-10 text-center">
          <p className="text-sm font-black text-[#172033]">
            لا توجد عقارات حتى الآن
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            ابدأ بإضافة أول شقة لتظهر هنا.
          </p>
        </div>
      )}
    </section>
  );
}
