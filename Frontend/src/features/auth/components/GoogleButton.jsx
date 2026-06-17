import { googleAuthUrl } from "../services/authApi";

export function GoogleButton() {
  return (
    <a
      href={googleAuthUrl}
      className="flex h-12 items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white text-sm font-black text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
    >
      <span className="text-xl font-black text-[#4285f4]">G</span>
      المتابعة عبر Google
    </a>
  );
}
