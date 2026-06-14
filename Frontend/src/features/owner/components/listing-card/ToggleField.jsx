export function ToggleField({ label, checked, onChange }) {
  return (
    <label className="flex h-11 items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#172033]">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 accent-[#0b62d8]"
      />
    </label>
  );
}
