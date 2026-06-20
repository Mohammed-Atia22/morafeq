import { formatMoney } from "../../../payments/utils/paymentBreakdown";

export function DisputePaymentBreakdown({ payment }) {
  if (!payment) {
    return (
      <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
        <h3 className="text-sm font-black text-[#0f172a]">تفاصيل الدفع</h3>
        <p className="mt-4 text-sm text-slate-400">لا توجد بيانات دفع متاحة</p>
      </div>
    );
  }

  const amounts = payment.amounts ?? {};
  const currency = amounts.currency || payment.currency || "EGP";

  const rows = [
    { label: "الإيجار", value: amounts.rentAmount },
    { label: "التأمين", value: amounts.securityDepositAmount },
    { label: "رسوم المنصة", value: amounts.platformFee },
    { label: "إجمالي المدفوع", value: amounts.totalAmount, highlight: true },
    { label: "استرداد المستأجر", value: amounts.guestRefundAmount },
    { label: "تعويض المالك", value: amounts.hostCompensationAmount },
    { label: "مستحقات المالك", value: amounts.hostPayoutAmount },
  ];

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-black text-[#0f172a]">تفاصيل الدفع</h3>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
          {payment.status}
        </span>
      </div>

      <div className="grid gap-0 divide-y divide-slate-100 rounded-xl border border-slate-100">
        {rows.map((row) => (
          <div
            key={row.label}
            className={`flex items-center justify-between px-4 py-3 ${
              row.highlight ? "bg-[#EEF3FF]" : ""
            }`}
          >
            <span className="text-xs font-bold text-slate-600">{row.label}</span>
            <span
              className={`text-sm font-black ${
                row.highlight ? "text-[#1752F0]" : "text-slate-800"
              }`}
            >
              {formatMoney(row.value ?? 0, currency)}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
        {payment.paidAt && <span>تاريخ الدفع: {new Date(payment.paidAt).toLocaleString("ar-EG")}</span>}
        {payment.refundedAt && (
          <span>تاريخ الاسترداد: {new Date(payment.refundedAt).toLocaleString("ar-EG")}</span>
        )}
        {payment.settledAt && (
          <span>تاريخ التسوية: {new Date(payment.settledAt).toLocaleString("ar-EG")}</span>
        )}
        {payment.refundReason && <span>سبب الاسترداد: {payment.refundReason}</span>}
      </div>
    </div>
  );
}
