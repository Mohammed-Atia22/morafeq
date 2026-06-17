import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";

export function DraftSavedVerificationModal({
  open,
  onContinueLater,
}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!open) return null;

  const goToVerification = () => {
    const basePath = user?.role === "HOST" ? "/owner/profile" : "/expatriate/profile";
    navigate(`${basePath}?verify=1`);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div
        dir="rtl"
        className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
      >
        <h2 className="text-base font-black text-[#0f172a]">
          تم حفظ المسودة
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          تم حفظ الشقة كمسودة. أكمل توثيق الهوية حتى تتمكن من نشرها.
        </p>
        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <button
            type="button"
            onClick={goToVerification}
            className="flex-1 rounded-xl bg-[#1752F0] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1240c4]"
          >
            الذهاب للتوثيق
          </button>
          <button
            type="button"
            onClick={onContinueLater}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-300"
          >
            المتابعة لاحقًا
          </button>
        </div>
      </div>
    </div>
  );
}
