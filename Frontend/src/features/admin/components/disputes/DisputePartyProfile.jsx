import { VerificationBadge } from "../../../verification/components/VerificationBadge";
import {
  AdminDisputeReviewsList,
  AdminRatingSummaryCard,
} from "./AdminDisputeReviewsList";
import { formatDisputeDate, getSenderDisplayName } from "../../../dispute-chat/utils/disputeMessageUtils";

export function DisputePartyProfile({ party, title }) {
  if (!party) {
    return (
      <div className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
        <p className="text-sm text-slate-400">لا توجد بيانات</p>
      </div>
    );
  }

  const fullName = getSenderDisplayName(party);
  const initials = party.firstName?.charAt(0)?.toUpperCase() ?? "م";

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <h3 className="mb-4 text-sm font-black text-[#0f172a]">{title}</h3>

      <div className="flex items-start gap-4">
        {party.avatarUrl ? (
          <img
            src={party.avatarUrl}
            alt={fullName}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-slate-100"
          />
        ) : (
          <div className="grid h-14 w-14 place-items-center rounded-full bg-[#1752F0] text-lg font-bold text-white">
            {initials}
          </div>
        )}

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-base font-black text-slate-900">{fullName}</p>
            <VerificationBadge status={party.verificationStatus} compact />
            {!party.isActive && (
              <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                غير نشط
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">{party.email}</p>
          {party.phone && (
            <p className="text-xs font-bold text-slate-700">الهاتف: {party.phone}</p>
          )}
          <p className="text-xs text-slate-500">
            نقاط الثقة: {party.trustScore ?? 0} — عضو منذ{" "}
            {formatDisputeDate(party.createdAt)}
          </p>
        </div>
      </div>

      <div className="mt-4">
        <AdminRatingSummaryCard summary={party.ratingSummary} title="ملخص التقييمات" />
      </div>

      <div className="mt-4">
        <AdminDisputeReviewsList reviews={party.reviews ?? []} />
      </div>
    </div>
  );
}
