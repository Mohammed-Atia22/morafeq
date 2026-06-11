import { NavLink } from "react-router-dom";
import { useAuth } from "../../../auth/hooks/useAuth";

const NAV_ITEMS = [
  {
    to: "/expatriate",
    end: true,
    label: "الرئيسية",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
        />
      </svg>
    ),
  },
  {
    to: "/expatriate/search",
    end: false,
    label: "البحث",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
        />
      </svg>
    ),
  },
  {
    to: "/expatriate/profile",
    end: false,
    label: "ملفي",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-5 w-5"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

export function ExpatriateSidebar() {
  const { user, logout } = useAuth();

  const initials = user?.firstName
    ? user.firstName.charAt(0).toUpperCase()
    : "م";

  return (
    <aside
      dir="rtl"
      className="fixed right-0 top-0 z-20 flex h-screen w-[220px] flex-col border-l border-slate-100 bg-white shadow-sm"
    >
      {/* Logo */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-100">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#1752F0] text-base font-black text-white">
          س
        </span>
        <span className="text-xl font-black text-[#0f172a]">سَكن</span>
      </div>

      {/* User info */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-[#1752F0] text-sm font-bold text-white shrink-0">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-[#0f172a]">
            {user?.firstName
              ? `${user.firstName} ${user.lastName ?? ""}`.trim()
              : "المستخدم"}
          </p>
          <p className="truncate text-xs text-slate-400">
            {user?.university ?? "طالب مغترب"}
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1">
        {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-[#EEF3FF] text-[#1752F0]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={isActive ? "text-[#1752F0]" : "text-slate-400"}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 pt-2 border-t border-slate-100 mt-auto">
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-red-50 hover:text-red-500"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
