import { useNavigate } from "react-router-dom";

function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

export function GridIcon({ className }) {
  return (
    <IconBase className={className}>
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
    </IconBase>
  );
}

export function BuildingIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 21V4h12v17M4 21h16M9 8h2M13 8h2M9 12h2M13 12h2M10 21v-5h4v5"
      />
    </IconBase>
  );
}

export function EyeIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
      />
      <circle cx="12" cy="12" r="3" />
    </IconBase>
  );
}

export function PlusCircleIcon({ className }) {
  return (
    <IconBase className={className}>
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 8v8M8 12h8" />
    </IconBase>
  );
}

export function MessageIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 12a8 8 0 0 1-8 8H7l-4 2 1.3-4A8 8 0 1 1 21 12Z"
      />
    </IconBase>
  );
}

export function SettingsIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 15a8.8 8.8 0 0 0 .1-6l-2.1-.5-1-2-2 .8a9 9 0 0 0-5 0l-2-.8-1 2-2.1.5a8.8 8.8 0 0 0 .1 6l2 .5 1 2 2-.8a9 9 0 0 0 5 0l2 .8 1-2 2-.5Z"
      />
    </IconBase>
  );
}

export function UserIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </IconBase>
  );
}

export function OwnerSidebar({
  user,
  logout,
  activeSection,
  setActiveSection,
}) {
  const navigate = useNavigate();

  const handleSectionClick = (section) => {
    setActiveSection(section);
    if (
      section === "dashboard" ||
      section === "listings" ||
      section === "settings"
    ) {
      navigate("/owner");
    }
  };

  return (
    <>
      <div className="flex h-[74px] items-center gap-3 border-b border-slate-200 px-5">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#0b62d8] text-xl font-black text-white">
          س
        </div>
        <div>
          <p className="text-lg font-black text-[#172033]">مرافق</p>
          <p className="text-xs font-semibold text-slate-400">
            لوحة تحكم المالك
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-2 px-3 py-4">
        <SidebarItem
          label="لوحة التحكم"
          icon={GridIcon}
          active={activeSection === "dashboard"}
          onClick={() => handleSectionClick("dashboard")}
        />
        <SidebarItem
          label="عقاراتي"
          icon={BuildingIcon}
          active={activeSection === "listings"}
          onClick={() => handleSectionClick("listings")}
        />
        <SidebarItem
          label="طلبات المعاينة"
          icon={EyeIcon}
          active={activeSection === "requests"}
          onClick={() => setActiveSection("requests")}
          badge="5"
        />
        <button
          type="button"
          onClick={() => setActiveSection("add")}
          className={[
            "flex h-12 w-full items-center gap-3 rounded-xl px-4 text-sm font-bold transition",
            activeSection === "add"
              ? "bg-[#e9f0ff] text-[#0b62d8]"
              : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
          ].join(" ")}
        >
          <PlusCircleIcon className="h-5 w-5" />
          إضافة شقة
        </button>
        <SidebarItem
          label="الرسائل"
          icon={MessageIcon}
          active={activeSection === "messages"}
          onClick={() => setActiveSection("messages")}
          badge="11"
          danger
        />
        <SidebarItem
          label="الإعدادات"
          icon={SettingsIcon}
          active={activeSection === "settings"}
          onClick={() => handleSectionClick("settings")}
        />
        <SidebarItem
          label="ملفي"
          icon={UserIcon}
          active={activeSection === "profile"}
          onClick={() => setActiveSection("profile")}
        />
      </nav>

      <div className="border-t border-slate-200 p-4">
        <div className="mb-3 flex items-center gap-3 rounded-xl bg-[#eef3ff] p-3">
          <div className="grid h-11 w-11 place-items-center rounded-full bg-[#0aa886] text-lg font-black text-white">
            {user?.firstName?.[0] || "ك"}
          </div>
          <div>
            <p className="text-sm font-black text-[#172033]">
              {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                "كريم محمود"}
            </p>
            <p className="text-xs font-semibold text-emerald-500">مالك موثق</p>
          </div>
        </div>
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

function SidebarItem({
  label,
  icon: Icon,
  active = false,
  badge,
  danger = false,
  onClick,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex h-12 w-full items-center justify-between rounded-xl px-4 text-sm font-bold transition",
        active
          ? "bg-[#e9f0ff] text-[#0b62d8]"
          : "text-slate-500 hover:bg-slate-50 hover:text-[#0b62d8]",
      ].join(" ")}
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
    </button>
  );
}
