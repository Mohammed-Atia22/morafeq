export function ComingSoon({ title, text }) {
  return (
    <div className="min-h-screen bg-[#eef3ff] px-4 pb-24 pt-5 text-center text-[#172033] sm:px-6 lg:px-7 lg:pb-10" dir="rtl">
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-12">
        <p className="text-lg font-black text-[#172033]">{title}</p>
        {text ? (
          <p className="mt-2 text-sm font-semibold text-slate-500">{text}</p>
        ) : null}
      </div>
    </div>
  );
}
