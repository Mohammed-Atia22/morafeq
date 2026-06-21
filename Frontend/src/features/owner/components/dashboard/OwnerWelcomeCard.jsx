export function OwnerWelcomeCard({
  user,
  approvedListingsCount = 0,
  pendingRequestsCount = 0,
}) {
  const ownerName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "كريم";
  const today = new Date().toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative h-full min-h-[150px] overflow-hidden rounded-[24px] bg-[#1f5bd7] px-6 py-6 text-white shadow-[0_18px_36px_rgba(31,91,215,0.22)]">
      <div className="pointer-events-none absolute -bottom-16 -right-10 h-44 w-44 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -left-8 bottom-0 h-28 w-28 rounded-full bg-[#0b4779]/30" />
      <div className="relative">
        <h1 className="text-2xl font-black">مرحباً، {ownerName}</h1>
        <p className="mt-2 text-sm font-semibold text-white/75">
          لوحة تحكم المالك - {today}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/10 backdrop-blur">
            {approvedListingsCount} عقارات نشطة
          </span>
          <span className="rounded-full bg-white/15 px-4 py-2 text-xs font-black text-white ring-1 ring-white/10 backdrop-blur">
            {pendingRequestsCount} طلبات واردة
          </span>
        </div>
      </div>
    </section>
  );
}
