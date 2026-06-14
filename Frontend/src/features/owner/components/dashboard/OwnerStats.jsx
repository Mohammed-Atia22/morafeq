export function OwnerStats({ stats }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={stat.label}
          className="rounded-xl border border-slate-200 bg-white px-6 py-4 text-center shadow-sm"
        >
          <p
            className={[
              "text-lg font-black",
              index === 3
                ? "text-[#7657d8]"
                : index === 2
                  ? "text-emerald-500"
                  : "text-[#1c3370]",
            ].join(" ")}
          >
            {stat.value}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {stat.label}
          </p>
        </div>
      ))}
    </section>
  );
}
