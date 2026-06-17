import { useState } from "react";

function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false);

  return (
    <div>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {label}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          dir="ltr"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#1752F0] focus:ring-2 focus:ring-[#1752F0]/20"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
          tabIndex={-1}
        >
          {show ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}

export function ChangePasswordForm({ isGoogleUser, loading, onSubmit }) {
  const [current,  setCurrent]  = useState("");
  const [next,     setNext]     = useState("");
  const [confirm,  setConfirm]  = useState("");
  const [localErr, setLocalErr] = useState("");

  // Google users don't have a password
  if (isGoogleUser) {
    return (
      <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
        <h2 className="mb-3 text-sm font-black text-[#0f172a]">كلمة المرور</h2>
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-xl">🔗</span>
          <div>
            <p className="text-sm font-semibold text-slate-700">
              حسابك مرتبط بـ Google
            </p>
            <p className="text-xs text-slate-400">
              لا يمكن تغيير كلمة المرور لأن تسجيل الدخول يتم عبر Google
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    setLocalErr("");

    if (!current) { setLocalErr("أدخل كلمة المرور الحالية"); return; }
    if (next.length < 8) { setLocalErr("كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل"); return; }
    if (next !== confirm) { setLocalErr("كلمة المرور الجديدة وتأكيدها غير متطابقتين"); return; }

    const ok = await onSubmit({
      currentPassword:    current,
      newPassword:        next,
      confirmNewPassword: confirm,
    });

    if (ok) {
      setCurrent("");
      setNext("");
      setConfirm("");
    }
  };

  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="mb-5 text-sm font-black text-[#0f172a]">تغيير كلمة المرور</h2>

      <div className="space-y-4">
        <PasswordInput
          label="كلمة المرور الحالية"
          value={current}
          onChange={setCurrent}
          placeholder="••••••••"
        />
        <PasswordInput
          label="كلمة المرور الجديدة"
          value={next}
          onChange={setNext}
          placeholder="8 أحرف على الأقل"
        />
        <PasswordInput
          label="تأكيد كلمة المرور الجديدة"
          value={confirm}
          onChange={setConfirm}
          placeholder="••••••••"
        />

        {localErr && (
          <p className="text-xs text-red-500">{localErr}</p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="w-full rounded-xl bg-[#1752F0] py-2.5 text-sm font-black text-white shadow transition hover:bg-[#1240c4] disabled:opacity-60"
        >
          {loading ? "جاري الحفظ..." : "تغيير كلمة المرور"}
        </button>
      </div>
    </div>
  );
}