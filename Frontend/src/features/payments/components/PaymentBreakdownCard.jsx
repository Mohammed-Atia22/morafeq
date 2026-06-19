import { formatMoney } from "../utils/paymentBreakdown";

function BreakdownRow({ label, value, highlight = false }) {
  return (
    <div
      className={[
        "flex items-center justify-between gap-3 text-sm",
        highlight ? "font-black text-[#0f172a]" : "text-slate-600",
      ].join(" ")}
    >
      <span>{label}</span>
      <span className={highlight ? "text-[#1752F0]" : "font-semibold"}>{value}</span>
    </div>
  );
}

export function PaymentBreakdownCard({
  breakdown,
  title = "تفاصيل الفاتورة",
  compact = false,
  className = "",
}) {
  if (!breakdown) return null;

  const currency = breakdown.currency || "EGP";

  return (
    <div
      dir="rtl"
      className={[
        "rounded-xl border border-slate-100 bg-slate-50",
        compact ? "px-3 py-2.5 space-y-1.5" : "px-4 py-3 space-y-2",
        className,
      ].join(" ")}
    >
      {title && (
        <p className="text-xs font-black text-slate-700 mb-1">{title}</p>
      )}

      <BreakdownRow
        label="الإيجار"
        value={formatMoney(breakdown.rentAmount, currency)}
      />
      {Number(breakdown.depositAmount) > 0 && (
        <BreakdownRow
          label="التأمين"
          value={formatMoney(breakdown.depositAmount, currency)}
        />
      )}
      <BreakdownRow
        label="رسوم المنصة"
        value={formatMoney(breakdown.platformFee, currency)}
      />

      <div className="border-t border-slate-200 pt-2">
        <BreakdownRow
          label="الإجمالي"
          value={formatMoney(breakdown.totalAmount, currency)}
          highlight
        />
      </div>
    </div>
  );
}

export function RefundSummaryCard({ settlement, className = "" }) {
  if (!settlement) return null;

  const currency = settlement.currency || "EGP";

  return (
    <div
      dir="rtl"
      className={[
        "rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 space-y-2",
        className,
      ].join(" ")}
    >
      <p className="text-xs font-black text-emerald-800">ملخص الاسترداد</p>
      <div className="space-y-1.5 text-sm text-emerald-900">
        <div className="flex justify-between gap-3">
          <span>المبلغ المدفوع</span>
          <span className="font-semibold">
            {formatMoney(settlement.totalAmount, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>التأمين للمالك</span>
          <span className="font-semibold">
            {formatMoney(settlement.hostCompensation, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3">
          <span>رسوم المنصة</span>
          <span className="font-semibold">
            {formatMoney(settlement.retainedPlatformFee, currency)}
          </span>
        </div>
        <div className="flex justify-between gap-3 border-t border-emerald-200 pt-2 font-black">
          <span>المبلغ المتوقع استرداده</span>
          <span className="text-emerald-700">
            {formatMoney(settlement.expectedRefund, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
