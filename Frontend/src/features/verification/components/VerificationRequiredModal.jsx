import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";

export function VerificationRequiredModal({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!open) return null;

  const goToVerification = () => {
    onClose?.();
    const basePath = user?.role === "HOST" ? "/owner/profile" : "/expatriate/profile";
    navigate(`${basePath}?verify=1`);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4">
      <div
        dir="rtl"
        className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl ring-1 ring-slate-200"
      >
        <h2 className="text-base font-black text-[#0f172a]">
          التوثيق مطلوب
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          تحتاج إلى توثيق هويتك للمتابعة.
        </p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={goToVerification}
            className="flex-1 rounded-xl bg-[#1752F0] px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#1240c4]"
          >
            توثيق الهوية
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:border-slate-300"
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
