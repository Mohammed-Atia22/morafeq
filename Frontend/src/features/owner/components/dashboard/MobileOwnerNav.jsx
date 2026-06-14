import {
  BuildingIcon,
  GridIcon,
  PlusCircleIcon,
  SettingsIcon,
} from "../common/OwnerIcons";

function MobileNavItem({ label, icon: Icon, active = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black",
        active ? "bg-[#e9f0ff] text-[#0b62d8]" : "text-slate-500",
      ].join(" ")}
    >
      <Icon className="h-5 w-5" />
      {label}
    </button>
  );
}

export function MobileOwnerNav({ activeSection, onSectionChange, onSettings }) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t border-slate-200 bg-white px-2 py-2 shadow-[0_-10px_30px_rgba(15,23,42,0.08)] lg:hidden">
      <MobileNavItem
        label="لوحة التحكم"
        icon={GridIcon}
        active={activeSection === "dashboard"}
        onClick={() => onSectionChange("dashboard")}
      />
      <MobileNavItem
        label="عقاراتي"
        icon={BuildingIcon}
        active={activeSection === "listings"}
        onClick={() => onSectionChange("listings")}
      />
      <button
        type="button"
        onClick={() => onSectionChange("add")}
        className={[
          "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-xs font-black",
          activeSection === "add"
            ? "bg-[#e9f0ff] text-[#0b62d8]"
            : "text-slate-500",
        ].join(" ")}
      >
        <PlusCircleIcon className="h-5 w-5" />
        إضافة شقة
      </button>
      <MobileNavItem
        label="الإعدادات"
        icon={SettingsIcon}
        active={activeSection === "settings"}
        onClick={onSettings}
      />
    </nav>
  );
}
