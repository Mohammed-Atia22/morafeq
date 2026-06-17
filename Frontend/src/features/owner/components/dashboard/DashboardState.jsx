export function DashboardState({ title, text }) {
  return (
    <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center">
      <p className="text-lg font-black text-[#172033]">{title}</p>
      {text ? (
        <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p>
      ) : null}
    </div>
  );
}
