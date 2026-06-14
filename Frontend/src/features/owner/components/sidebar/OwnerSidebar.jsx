import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  BuildingIcon,
  EyeIcon,
  GridIcon,
  MessageIcon,
  PlusCircleIcon,
  SettingsIcon,
  UserIcon,
} from "../common/OwnerIcons";

export function OwnerSidebar({ user, logout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const ownerSection = location.state?.ownerSection || "listings";
  const isOwnerHome = location.pathname === "/owner";

  const itemClassName = (active) =>
    [
      "flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-bold transition",
      active
        ? "bg-[#e9f0ff] text-[#0b62d8]"
        : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
    ].join(" ");

  const showAddListing = () => {
    navigate("/owner", {
      state: { ownerSection: "add", ownerSectionKey: Date.now() },
    });
  };

  return (
    <>
      <div className="border-b border-slate-200 p-4">
        <button
          type="button"
          onClick={() => navigate("/owner/profile")}
          className="flex w-full items-center gap-3 rounded-xl bg-[#eef3ff] p-3 transition hover:bg-blue-200"
        >
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0aa886] text-lg font-black text-white shrink-0">
            {user?.firstName?.[0] || "ك"}
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-[#172033]">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                "كريم محمود"}
            </p>
            <p className="text-xs font-semibold text-emerald-500">مالك موثق</p>
          </div>
        </button>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        <SidebarNavItem
          to="/owner"
          state={{ ownerSection: "dashboard" }}
          label="لوحة التحكم"
          icon={GridIcon}
          active={isOwnerHome && ownerSection === "dashboard"}
          className={itemClassName}
        />
        <SidebarNavItem
          to="/owner"
          state={{ ownerSection: "listings" }}
          label="عقاراتي"
          icon={BuildingIcon}
          active={isOwnerHome && ownerSection !== "dashboard" && ownerSection !== "add"}
          className={itemClassName}
        />
        <SidebarNavItem
          to="/owner/bookings"
          label="طلبات المعاينة"
          icon={EyeIcon}
          badge="5"
          className={itemClassName}
        />
        <button
          type="button"
          onClick={showAddListing}
          className={[
            "flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
            isOwnerHome && ownerSection === "add"
              ? "bg-[#e9f0ff] text-[#0b62d8]"
              : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
          ].join(" ")}
        >
          <PlusCircleIcon className="h-5 w-5" />
          إضافة شقة
        </button>
        <SidebarNavItem
          to="/owner/messages"
          label="الرسائل"
          icon={MessageIcon}
          badge="11"
          danger
          className={itemClassName}
        />
        <SidebarNavItem
          to="/owner/settings"
          label="الإعدادات"
          icon={SettingsIcon}
          className={itemClassName}
        />
        <SidebarNavItem
          to="/owner/profile"
          label="ملفي"
          icon={UserIcon}
          className={itemClassName}
        />
      </nav>

      <div className="border-t border-slate-200 p-4">
        <button
          type="button"
          onClick={logout}
          className="w-full text-center text-sm font-bold text-red-500"
        >
          تسجيل الخروج
        </button>
      </div>
    </>
  );
}

function SidebarNavItem({
  to,
  state,
  label,
  icon: Icon,
  badge,
  danger = false,
  active,
  className,
}) {
  return (
    <NavLink
      to={to}
      state={state}
      aria-current={active ? "page" : undefined}
      className={({ isActive }) => className(active ?? isActive)}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-5 w-5" />
        {label}
      </span>
      {badge ? (
        <span
          className={[
            "grid h-5 min-w-5 place-items-center rounded-full px-1 text-[10px] font-black text-white",
            danger ? "bg-red-500" : "bg-amber-500",
          ].join(" ")}
        >
          {badge}
        </span>
      ) : null}
    </NavLink>
  );
}
