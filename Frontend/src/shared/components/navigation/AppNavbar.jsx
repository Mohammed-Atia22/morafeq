import { Link, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../../features/auth/hooks/useAuth";
import logo from "../../../../images/logo.png";

function BellIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 20h4"
      />
    </svg>
  );
}

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

  const sidebarPaddingClass = pathname.startsWith("/owner")
    ? "lg:pr-[260px]"
    : pathname.startsWith("/expatriate")
      ? "lg:pr-[220px]"
      : "";

  if (publicNavbarPaths.has(pathname)) {
    return (
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur ${sidebarPaddingClass}`}
      >
        <nav className="mx-auto flex h-[76px] max-w-7xl items-center justify-between px-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logo} alt="مرافق" className="h-10 w-auto" />
          </Link>

          <div className="hidden items-center gap-10 lg:flex">
            <a
              href="#listings"
              className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]"
            >
              استكشف العقارات
            </a>
            <a
              href="#areas"
              className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]"
            >
              المناطق
            </a>
            <a
              href="#about"
              className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]"
            >
              عن مرافق
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]"
            >
              كيف يعمل؟
            </a>
            <a
              href="#contact"
              className="text-sm font-black text-[#172033] transition hover:text-[#075fd6]"
            >
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
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 12h-8M17 8l4 4-4 4"
                    />
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
    <header
      className={`fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#102b4a]/95 backdrop-blur ${sidebarPaddingClass}`}
    >
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="مرافق" className="h-9 w-auto" />
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
              <button
                type="button"
                className="relative grid h-10 w-10 place-items-center rounded-full text-slate-200 transition hover:bg-white/10"
              >
                <BellIcon className="h-5 w-5" />
                <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-red-500" />
              </button>
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
