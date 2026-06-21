import { getDisputeStatusClass, getDisputeStatusLabel, isUnresolvedDispute } from "../../../dispute-chat/utils/disputeStatusLabels";
import { formatDisputeDate } from "../../../dispute-chat/utils/disputeMessageUtils";

export function DisputeOverviewCard({ booking, listing, guest, host }) {
  if (!booking) return null;

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-black text-[#0f172a]">نظرة عامة على النزاع</h3>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-bold ${getDisputeStatusClass(booking.status)}`}
        >
          {getDisputeStatusLabel(booking.status)}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <InfoItem label="رقم الحجز" value={`#${booking.id}`} />
        <InfoItem label="حالة الحجز" value={getDisputeStatusLabel(booking.status)} />
        <InfoItem
          label="حالة النزاع"
          value={isUnresolvedDispute(booking.status) ? "غير محلول" : "محلول / مغلق"}
        />
        <InfoItem label="تاريخ النزاع" value={formatDisputeDate(booking.disputedAt)} />
        <InfoItem label="سبب النزاع" value={booking.disputeReason || "—"} />
        <InfoItem label="العقار" value={listing?.title || "—"} />
        <InfoItem
          label="المستأجر"
          value={guest ? `${guest.firstName} ${guest.lastName}` : "—"}
        />
        <InfoItem
          label="المالك"
          value={host ? `${host.firstName} ${host.lastName}` : "—"}
        />
      </div>

      {booking.disputeDescription && (
        <div className="mt-4 rounded-xl bg-red-50 p-4">
          <p className="text-xs font-bold text-red-700">وصف النزاع</p>
          <p className="mt-1 text-sm text-red-900">{booking.disputeDescription}</p>
        </div>
      )}

      {booking.disputeResolution && (
        <div className="mt-3 rounded-xl bg-purple-50 p-4">
          <p className="text-xs font-bold text-purple-700">قرار الإدارة</p>
          <p className="mt-1 text-sm text-purple-900">{booking.disputeResolution}</p>
        </div>
      )}

      {booking.guestMessage && (
        <div className="mt-3 rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-bold text-slate-600">رسالة المستأجر</p>
          <p className="mt-1 text-sm text-slate-700">{booking.guestMessage}</p>
        </div>
      )}
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[10px] font-bold text-slate-400">{label}</p>
      <p className="mt-1 text-sm font-bold text-slate-800">{value}</p>
    </div>
  );
}

export function DisputeBookingTimeline({ booking }) {
  if (!booking) return null;

  const events = [
    { label: "تاريخ الإنشاء", value: booking.createdAt },
    { label: "تاريخ القبول", value: booking.acceptedAt },
    { label: "تاريخ التأكيد", value: booking.confirmedAt },
    { label: "تاريخ النزاع", value: booking.disputedAt },
    { label: "تاريخ حل النزاع", value: booking.disputeResolvedAt },
    { label: "تاريخ الإلغاء", value: booking.cancelledAt },
    { label: "تاريخ الإكمال", value: booking.completedAt },
  ].filter((event) => event.value);

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <h3 className="mb-4 text-sm font-black text-[#0f172a]">الجدول الزمني للحجز</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.label}
            className="flex items-center justify-between rounded-lg border border-slate-100 px-4 py-3"
          >
            <span className="text-xs font-bold text-slate-600">{event.label}</span>
            <span className="text-xs text-slate-500">{formatDisputeDate(event.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
