export function OwnerWelcomeCard({ user, listingsCount = 0 }) {
  const ownerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "كريم";
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative overflow-hidden rounded-xl bg-[#1f5bd7] px-6 py-6 text-white shadow-sm">
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-40 w-40 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-[#0b4779]/30" />
      <div className="relative">
        <h1 className="text-2xl font-black">مرحباً، {ownerName} 👋</h1>
        <p className="mt-2 text-sm font-semibold text-white/80">
          لوحة تحكم المالك - {today}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white backdrop-blur">
            {listingsCount} عقارات نشطة
          </span>
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white backdrop-blur">
            5 طلبات جديدة
          </span>
        </div>
      </div>
    </section>
  );
}
