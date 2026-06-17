import { useMemo, useState } from "react";
import { VerificationBadge } from "./VerificationBadge";

const STATUS_TEXT = {
  NOT_STARTED: "ارفع مستندات الهوية لتتمكن من الحجز ونشر الشقق.",
  PENDING: "قيد المراجعة",
  APPROVED: "تم التوثيق",
  REJECTED: "تم رفض طلب التوثيق. راجع السبب ثم حاول مرة أخرى.",
};

function FileField({ label, onChange }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </span>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 file:ml-3 file:rounded-lg file:border-0 file:bg-[#1752F0] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-white"
      />
    </label>
  );
}

export function VerificationPanel({
  verification,
  loading,
  submitting,
  error,
  successMsg,
  onSubmit,
  onClearMessages,
}) {
  const [idFront, setIdFront] = useState(null);
  const [idBack, setIdBack] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const [localError, setLocalError] = useState(null);
  const status = verification?.status ?? "NOT_STARTED";

  const canUpload = useMemo(
    () => ["NOT_STARTED", "REJECTED"].includes(status),
    [status],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!idFront || !idBack || !selfie) {
      setLocalError("يرجى رفع صورة وجه البطاقة، وظهر البطاقة، وصورة شخصية مع البطاقة.");
      return;
    }

    setLocalError(null);
    const result = await onSubmit({ idFront, idBack, selfie });

    if (result) {
      setIdFront(null);
      setIdBack(null);
      setSelfie(null);
      event.currentTarget.reset();
    }
  };

  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-black text-[#0f172a]">
            الثقة والتوثيق
          </h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {loading ? "جاري تحميل حالة التوثيق..." : STATUS_TEXT[status]}
          </p>
        </div>
        <VerificationBadge status={status} />
      </div>

      {status === "PENDING" && (
        <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-[#1752F0]">
          قيد المراجعة
        </div>
      )}

      {status === "APPROVED" && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          تم التوثيق ✓
        </div>
      )}

      {status === "REJECTED" && verification?.rejectionReason && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
          {verification.rejectionReason}
        </div>
      )}

      {(error || localError || successMsg) && (
        <div
          className={[
            "mb-4 rounded-xl px-4 py-3 text-sm font-semibold",
            successMsg
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-600",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3">
            <span>{successMsg || localError || error}</span>
            <button
              type="button"
              onClick={onClearMessages}
              className="text-current opacity-60 hover:opacity-100"
            >
              x
            </button>
          </div>
        </div>
      )}

      {canUpload && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <FileField label="وجه البطاقة" onChange={setIdFront} />
            <FileField label="ظهر البطاقة" onChange={setIdBack} />
            <FileField label="صورة شخصية مع البطاقة" onChange={setSelfie} />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="rounded-xl bg-[#1752F0] px-5 py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
          >
            {submitting
              ? "جاري الإرسال..."
              : status === "REJECTED"
                ? "إعادة طلب التوثيق"
                : "توثيق الهوية"}
          </button>
        </form>
      )}
    </div>
  );
}
