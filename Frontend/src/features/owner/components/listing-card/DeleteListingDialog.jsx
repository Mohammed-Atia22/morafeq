import { TrashIcon } from "../common/OwnerIcons";

export function DeleteListingDialog({ listing, deleting, onCancel, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-listing-title"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 text-right shadow-2xl">
        <div className="mb-4 flex items-start gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-500">
            <TrashIcon className="h-5 w-5" />
          </div>
          <div>
            <h2
              id="delete-listing-title"
              className="text-lg font-black text-[#172033]"
            >
              هل تريد حذف هذا العقار؟
            </h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-500">
              سيتم حذف بطاقة "{listing.title}" من عقاراتك. يمكنك الإلغاء الآن
              إذا لم تكن متأكدًا.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="h-11 flex-1 rounded-xl bg-red-500 text-sm font-black text-white transition hover:bg-red-600 disabled:opacity-60"
          >
            {deleting ? "جاري الحذف..." : "نعم، احذف"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="h-11 flex-1 rounded-xl border border-slate-200 text-sm font-black text-slate-500 transition hover:bg-slate-50 disabled:opacity-60"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
