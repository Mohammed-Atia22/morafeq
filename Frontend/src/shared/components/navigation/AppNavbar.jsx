import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth";

const navLinkClass = ({ isActive }) =>
  [
    "text-sm font-semibold transition hover:text-white",
    isActive ? "text-white" : "text-slate-300",
  ].join(" ");

const publicNavbarPaths = new Set([
  "/",
  "/home",
  "/login",
  "/register",
  "/confirm-otp",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
]);

export function AppNavbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const { pathname } = useLocation();

  if (pathname === "/owner") {
    return null;
  }

  if (publicNavbarPaths.has(pathname)) {
    return (
      <header className="fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3 text-[#075fd6]">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#075fd6] text-2xl font-black text-white">
              م
            </span>
            <span className="text-3xl font-black">مرافق</span>
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            <a href="#listings" className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]">
              استكشف العقارات
            </a>
            <a href="#areas" className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]">
              المناطق
            </a>
            <a href="#about" className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]">
              عن مرافق
            </a>
            <a href="#how-it-works" className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]">
              كيف يعمل؟
            </a>
            <a href="#contact" className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]">
              تواصل معنا
            </a>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <button
                type="button"
                onClick={logout}
                className="rounded-lg bg-[#075fd6] px-5 py-3 text-sm font-black text-white shadow transition hover:bg-[#0754bd]"
              >
                تسجيل الخروج
              </button>
            ) : (
              <>
                <NavLink
                  to="/register"
                  className="hidden rounded-lg border border-slate-300 bg-white px-6 py-3 text-sm font-black text-[#172033] transition hover:border-[#075fd6] hover:text-[#075fd6] sm:inline-flex"
                >
                  إنشاء حساب مجاني
                </NavLink>
                <NavLink
                  to="/login"
                  className="inline-flex items-center gap-3 rounded-lg bg-[#075fd6] px-5 py-3 text-sm font-black text-white shadow transition hover:bg-[#0754bd]"
                >
                  تسجيل الدخول
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 12h-8M17 8l4 4-4 4" />
                  </svg>
                </NavLink>
              </>
            )}
          </div>
        </nav>
      </header>
    );
  }

  return (
    <header className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#102b4a]/95 backdrop-blur">
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2 text-white">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-white text-lg font-black text-[#075ed8]">
            M
          </span>
          <span className="text-xl font-black">مرافق</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <NavLink to="/" className={navLinkClass}>
            الرئيسية
          </NavLink>
          <a href="#listings" className="text-sm font-semibold text-slate-300">
            استعراض العقارات
          </a>
          <a
            href="#how-it-works"
            className="text-sm font-semibold text-slate-300"
          >
            كيف يعمل
          </a>
          <a href="#contact" className="text-sm font-semibold text-slate-300">
            تواصل معنا
          </a>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <span className="hidden text-sm font-semibold text-slate-200 sm:block">
                {user?.firstName ? `مرحبا، ${user.firstName}` : "مرحبا بك"}
              </span>
              <button
                type="button"
                onClick={logout}
                className="rounded-full border border-white/20 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
              >
                تسجيل الخروج
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className="rounded-full px-4 py-2 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
              >
                تسجيل الدخول
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-full bg-white px-4 py-2 text-sm font-black text-[#075ed8] shadow-sm transition hover:bg-slate-100"
              >
                إنشاء حساب
              </NavLink>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
