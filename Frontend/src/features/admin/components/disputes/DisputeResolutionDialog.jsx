import { useState } from "react";
import toast from "react-hot-toast";
import { paymentsApi } from "../../../payments/services/paymentsApi";

export function DisputeResolutionDialog({
  open,
  dispute,
  resolutionType,
  onClose,
  onResolved,
}) {
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  if (!open || !dispute) return null;

  const handleResolve = async (event) => {
    event.preventDefault();

    if (!resolutionNote.trim()) {
      toast.error("يرجى إدخال ملاحظات القرار");
      return;
    }

    const paymentId = dispute.payment?.id;
    if (!paymentId) {
      toast.error("لم يتم العثور على سجل دفع لهذا الحجز");
      return;
    }

    setActionLoading(true);

    try {
      if (resolutionType === "REFUND") {
        await paymentsApi.refundPayment(paymentId, resolutionNote);
        toast.success("تم إقرار الاسترجاع بنجاح وعكس العملية مالياً");
      } else {
        await paymentsApi.resolveDisputeForHost(paymentId, resolutionNote);
        toast.success("تم حل النزاع لصالح المالك وبانتظار قرار المستأجر");
      }

      setResolutionNote("");
      onResolved?.();
      onClose();
    } catch (err) {
      toast.error(err.message || "فشل إرسال قرار حل النزاع");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = () => {
    if (actionLoading) return;
    setResolutionNote("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div dir="rtl" className="max-h-[calc(100vh-2rem)] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-4 shadow-xl sm:p-6">
        <h3 className="text-base font-black text-slate-900">
          {resolutionType === "REFUND"
            ? "الموافقة على رد المبالغ المدفوعة"
            : "رفض الشكوى وتحرير المبالغ للطرف المالك"}
        </h3>
        <p className="mt-1 text-xs font-semibold text-slate-500">
          {resolutionType === "REFUND"
            ? "سيتم استرجاع مبلغ الإيجار إلى كارت المستأجر تلقائياً عن طريق بوابة الدفع وإلغاء المعاملة المعلقة"
            : "سيتم إبلاغ المستأجر بقرار حل النزاع لصالح المالك، وسيختار بين متابعة الحجز أو الإلغاء واسترداد المبلغ المستحق"}
        </p>

        <form onSubmit={handleResolve} className="mt-4 space-y-4">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-600">
              سبب القرار وملاحظات الإدارة (مطلوب)
            </label>
            <textarea
              required
              placeholder="اكتب هنا التوجيه أو التقرير الإداري لاتخاذ هذا القرار..."
              rows={4}
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-[#1752F0]"
            />
          </div>

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <button
              type="submit"
              disabled={actionLoading}
              className={`flex-1 rounded-xl py-2.5 text-sm font-black text-white transition disabled:opacity-50 ${
                resolutionType === "REFUND"
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {actionLoading ? "جاري الحفظ..." : "تأكيد وإصدار القرار"}
            </button>
            <button
              type="button"
              onClick={handleClose}
              disabled={actionLoading}
              className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-50"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function canResolveDispute(dispute) {
  const status = dispute?.status ?? dispute?.booking?.status;
  return status === "DISPUTED" && Boolean(dispute?.payment?.id);
}
