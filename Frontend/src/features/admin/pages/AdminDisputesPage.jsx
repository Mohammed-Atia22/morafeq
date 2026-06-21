import { Link } from "react-router-dom";
import { useAdminDisputes } from "../hooks/useAdminDisputes";
import { PaginationControls } from "../../../shared/components/ui/PaginationControls";
import {
  getDisputeStatusClass,
  getDisputeStatusLabel,
  isUnresolvedDispute,
} from "../../dispute-chat/utils/disputeStatusLabels";
import { formatDisputeDate } from "../../dispute-chat/utils/disputeMessageUtils";
import { DisputeCardActions } from "../components/disputes/DisputeResolutionActions";
import { canResolveDispute } from "../components/disputes/DisputeResolutionDialog";

const STATUS_FILTERS = [
  { value: "", label: "الكل" },
  { value: "DISPUTED", label: "نزاع قائم" },
  { value: "CANCELLED_AFTER_DISPUTE", label: "ملغي بعد النزاع" },
];

export default function AdminDisputesPage() {
  const {
    disputes,
    meta,
    loading,
    error,
    status,
    setStatus,
    page,
    setPage,
    refresh,
  } = useAdminDisputes();

  return (
    <div dir="rtl" className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">إدارة النزاعات</h1>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            مراجعة النزاعات، إصدار القرارات المالية، والمحادثات الخاصة مع المستخدمين
          </p>
        </div>
        <button
          type="button"
          onClick={refresh}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          تحديث
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((filter) => (
          <button
            key={filter.value || "all"}
            type="button"
            onClick={() => setStatus(filter.value)}
            className={`rounded-full px-4 py-2 text-xs font-bold transition ${
              status === filter.value
                ? "bg-[#1752F0] text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && disputes.length === 0 ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1752F0] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm font-bold text-red-600">
          {error}
        </div>
      ) : disputes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white py-16 text-center shadow-sm">
          <h3 className="text-base font-extrabold text-slate-800">لا توجد نزاعات</h3>
          <p className="mt-1 text-xs font-semibold text-slate-400">
            ستظهر هنا النزاعات عند تقديمها من المستخدمين
          </p>
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {disputes.map((dispute) => {
              const cover = dispute.listing?.photos?.[0]?.url;
              const bookingId = dispute.bookingId ?? dispute.id;
              const disputeStatus = dispute.status ?? dispute.bookingStatus;

              return (
                <article
                  key={bookingId}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <Link
                    to={`/admin/disputes/${bookingId}`}
                    className="transition hover:bg-slate-50/50"
                  >
                    <div className="relative h-36 bg-slate-100">
                      {cover ? (
                        <img src={cover} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="grid h-full place-items-center text-slate-300">🏠</div>
                      )}
                      <div className="absolute right-3 top-3 flex flex-wrap gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getDisputeStatusClass(disputeStatus)}`}
                        >
                          {getDisputeStatusLabel(disputeStatus)}
                        </span>
                        {isUnresolvedDispute(disputeStatus) && (
                          <span className="rounded-full bg-red-500 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            غير محلول
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 p-4">
                      <p className="text-xs font-bold text-slate-400">حجز #{bookingId}</p>
                      <h3 className="line-clamp-1 text-sm font-black text-slate-900">
                        {dispute.listing?.title ?? "عقار"}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {[dispute.listing?.city, dispute.listing?.governorate]
                          .filter(Boolean)
                          .join(" — ")}
                      </p>
                      <p className="text-xs font-semibold text-slate-600">
                        المستأجر: {dispute.guest?.firstName} {dispute.guest?.lastName}
                      </p>
                      {dispute.disputeReason && (
                        <p className="line-clamp-2 text-xs text-red-700">
                          {dispute.disputeReason}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400">
                        {formatDisputeDate(dispute.disputedAt)}
                      </p>
                    </div>
                  </Link>

                  {canResolveDispute(dispute) ? (
                    <DisputeCardActions dispute={dispute} onResolved={refresh} />
                  ) : (
                    <div className="border-t border-slate-100 p-4">
                      <Link
                        to={`/admin/disputes/${bookingId}`}
                        className="text-xs font-bold text-[#1752F0] hover:underline"
                      >
                        عرض التفاصيل
                      </Link>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          <PaginationControls meta={meta} onPageChange={setPage} loading={loading} />
        </>
      )}
    </div>
  );
}
