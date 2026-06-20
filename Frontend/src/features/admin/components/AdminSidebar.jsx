import { NavLink, useLocation, useNavigate } from "react-router-dom";
import logo from "../../../../images/logo.png";

// Standard dashboard SVG icons
function GridIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function HomeIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function UsersIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );
}

function LogoutIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
  );
}

function ScaleIcon({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7H1.5m16.5 0L15 6m0 0l3 9a5.002 5.002 0 01-6 0M15 6l-3 9m3-9h4.5M12 3v18M12 21h-3m3 0h3" />
    </svg>
  );
}

export function AdminSidebar({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const itemClassName = (isActive) =>
    [
      "flex h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold transition-all duration-150",
      isActive
        ? "bg-blue-50 text-blue-600 font-bold"
        : "text-slate-600 hover:bg-slate-50 hover:text-blue-600",
    ].join(" ");

  return (
    <div className="flex h-full flex-col bg-white">
      {/* Logo / Brand Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 p-5">
        <img src={logo} alt="مرافق" className="h-11 w-auto object-contain" />
        <div>
          <div className="text-sm font-black text-slate-900 leading-tight">مرافق</div>
          <div className="text-[10px] font-bold text-slate-400 leading-tight">لوحة الإدارة</div>
        </div>
      </div>

      <div className="px-5 py-3">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">المنصة</div>
      </div>

      {/* Main Navigation links */}
      <nav className="flex-1 space-y-1 px-3">
        <NavLink to="/admin" end className={({ isActive }) => itemClassName(isActive)}>
          <GridIcon className="h-4 w-4 text-center" />
          <span>نظرة عامة</span>
        </NavLink>
        <NavLink to="/admin/listings" className={({ isActive }) => itemClassName(isActive)}>
          <HomeIcon className="h-4 w-4 text-center" />
          <span>العقارات</span>
        </NavLink>
        <NavLink to="/admin/users" className={({ isActive }) => itemClassName(isActive)}>
          <UsersIcon className="h-4 w-4 text-center" />
          <span>المستخدمين</span>
        </NavLink>
        <NavLink to="/admin/disputes" className={({ isActive }) => itemClassName(isActive)}>
          <ScaleIcon className="h-4 w-4 text-center" />
          <span>النزاعات</span>
        </NavLink>
      </nav>

      {/* Profile Card & Logout */}
      <div className="mt-auto border-t border-slate-100 p-3">
        <button
          type="button"
          onClick={logout}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm font-semibold text-red-500 hover:bg-red-50 transition"
        >
          <LogoutIcon className="h-4 w-4 text-center" />
          <span>تسجيل الخروج</span>
        </button>

        <div className="mt-3 flex items-center gap-3 border-t border-slate-50 pt-3 px-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 font-black text-white text-xs">
            {user?.firstName?.[0] || "أ"}
          </div>
          <div className="flex-1 text-right">
            <div className="text-xs font-bold text-slate-900 leading-normal">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || "مدير النظام"}
            </div>
            <div className="text-[10px] font-semibold text-slate-400 leading-tight">
              مدير عام
            </div>
          </div>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
            Admin
          </span>
        </div>
      </div>
    </div>
  );
}
