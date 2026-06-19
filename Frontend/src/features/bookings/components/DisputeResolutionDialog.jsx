import { useState } from "react";
import {
  PaymentBreakdownCard,
  RefundSummaryCard,
} from "../../payments/components/PaymentBreakdownCard";
import { buildDisputeSettlementPreview } from "../../payments/utils/paymentBreakdown";

export function DisputeResolutionDialog({
  open,
  booking,
  payment,
  loading = false,
  onContinue,
  onCancelRequest,
  onClose,
}) {
  const [step, setStep] = useState("decision");
  const settlement = buildDisputeSettlementPreview(payment);

  if (!open || !booking) return null;

  const handleCancelClick = () => {
    setStep("confirm-cancel");
  };

  const handleBack = () => {
    setStep("decision");
  };

  const handleConfirmCancel = async () => {
    await onCancelRequest?.();
  };

  const handleContinue = async () => {
    await onContinue?.();
    setStep("decision");
  };

  const handleClose = () => {
    setStep("decision");
    onClose?.();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div
        dir="rtl"
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
      >
        {step === "decision" ? (
          <>
            <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-center">
              <h3 className="text-lg font-black text-slate-900">تم حل النزاع</h3>
              <p className="mt-2 text-sm font-semibold text-slate-600 leading-relaxed">
                تمت مراجعة النزاع واتخاذ القرار لصالح المالك.
              </p>
            </div>

            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm font-semibold text-slate-700 leading-relaxed">
              <p>وفقاً للسياسة:</p>
              <ul className="mt-2 list-disc pr-5 space-y-1 text-xs">
                <li>مبلغ التأمين سيُحوّل إلى المالك.</li>
                <li>رسوم المنصة سيتم خصمها.</li>
                <li>سيتم استرداد المبلغ المتبقي لك عند الإلغاء.</li>
              </ul>
            </div>

            {settlement && (
              <div className="mt-4 space-y-3">
                <PaymentBreakdownCard
                  breakdown={settlement}
                  title="الملخص المالي"
                />
                <RefundSummaryCard settlement={settlement} />
              </div>
            )}

            {booking.disputeResolution && (
              <p className="mt-3 text-xs font-bold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg p-3">
                ملاحظة الإدارة: {booking.disputeResolution}
              </p>
            )}

            <div className="mt-5 space-y-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleContinue}
                className="w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
              >
                متابعة الحجز
              </button>
              <p className="text-center text-[11px] font-semibold text-slate-500">
                المتابعة بدون أي تغييرات على الحجز الحالي.
              </p>

              <button
                type="button"
                disabled={loading}
                onClick={handleCancelClick}
                className="w-full rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-black text-red-600 transition hover:bg-red-100 disabled:opacity-60"
              >
                إلغاء الحجز
              </button>
              <p className="text-center text-[11px] font-semibold text-slate-500">
                إلغاء الحجز واسترداد المبلغ المستحق بعد خصم التأمين ورسوم المنصة.
              </p>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-lg font-black text-slate-900 text-center">
              هل أنت متأكد من إلغاء الحجز؟
            </h3>
            <p className="mt-2 text-sm font-semibold text-slate-600 text-center leading-relaxed">
              سيتم إلغاء الحجز واسترداد قيمة الإيجار، بينما يحصل المالك على التأمين
              وتُخصم رسوم المنصة.
            </p>

            {settlement && (
              <div className="mt-4">
                <RefundSummaryCard settlement={settlement} />
              </div>
            )}

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={handleConfirmCancel}
                className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-black text-white hover:bg-red-700 disabled:opacity-60"
              >
                {loading ? "جاري الإلغاء..." : "تأكيد الإلغاء"}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={handleBack}
                className="flex-1 rounded-xl border border-slate-200 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                تراجع
              </button>
            </div>
          </>
        )}

        {step === "decision" && (
          <button
            type="button"
            onClick={handleClose}
            className="mt-4 w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            إغلاق
          </button>
        )}
      </div>
    </div>
  );
}

export function DisputeCancellationSuccess({
  open,
  settlement,
  onClose,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div dir="rtl" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-600">
          <svg className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h3 className="text-lg font-black text-slate-900">تم إلغاء الحجز</h3>
        <p className="mt-3 text-sm font-semibold text-slate-600 leading-relaxed">
          نأسف لعدم نجاح تجربة الحجز الخاصة بك.
          تم إرسال المبلغ المستحق للاسترداد وسيظهر وفقاً لسياسة الدفع الخاصة بك.
        </p>

        {settlement && (
          <div className="mt-4 text-right">
            <RefundSummaryCard settlement={settlement} />
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-[#1752F0] py-3 text-sm font-black text-white hover:bg-[#1240c4]"
        >
          حسناً
        </button>
      </div>
    </div>
  );
}
