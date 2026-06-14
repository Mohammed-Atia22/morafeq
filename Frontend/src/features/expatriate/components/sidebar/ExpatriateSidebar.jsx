import { NavLink, useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

  return (
    <>
      <div className="border-b border-slate-200 p-4">
        <button
          type="button"
          onClick={() => navigate("/expatriate/profile")}
          className="flex w-full items-center gap-3 rounded-xl bg-[#eef3ff] p-3 transition hover:bg-blue-200"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0b62d8] text-lg font-black text-white shrink-0">
            {user?.firstName?.[0] || "ط"}
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-[#172033]">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                "الطالب"}
            </p>
            <p className="text-xs font-semibold text-blue-500">طالب مغترب</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        {NAV_ITEMS.map(({ to, end, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
                isActive
                  ? "bg-[#E8F0FF] text-[#0b62d8]"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={isActive ? "text-[#0b62d8]" : "text-slate-400"}
                >
                  {icon}
                </span>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full text-center text-sm font-bold text-red-500 hover:text-red-600"
        >
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}
