import { statusTabs } from "../../constants/ownerDashboard";

export function StatusTabs({ activeFilter, onChange }) {
  return (
    <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
      {statusTabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={[
            "h-10 rounded-xl border px-5 text-sm font-black transition",
            activeFilter === tab.key
              ? "border-[#0b62d8] bg-[#0b62d8] text-white shadow-sm"
              : "border-slate-200 bg-white text-slate-500 hover:border-[#0b62d8] hover:text-[#0b62d8]",
          ].join(" ")}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
