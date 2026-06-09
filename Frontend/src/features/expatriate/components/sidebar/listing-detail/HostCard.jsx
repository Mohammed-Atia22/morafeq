export function HostCard({ host }) {
  if (!host) return null;

  const fullName = `${host.firstName ?? ""} ${host.lastName ?? ""}`.trim();

  const memberSince = host.createdAt
    ? new Date(host.createdAt).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "long",
      })
    : null;

  const initials = host.firstName?.charAt(0)?.toUpperCase() ?? "م";

  return (
    <div dir="rtl" className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      <h2 className="mb-4 text-sm font-black text-[#0f172a]">صاحب الشقة</h2>

      <div className="flex items-center justify-between">
        {/* Avatar + info */}
        <div className="flex items-center gap-3">
          {host.avatarUrl ? (
            <img
              src={host.avatarUrl}
              alt={fullName}
              className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[#1752F0] text-base font-bold text-white">
              {initials}
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-[#0f172a]">{fullName}</p>
            <div className="mt-0.5 flex flex-col gap-0.5">
              {host._count?.listings != null && (
                <p className="text-xs text-slate-400">
                  {host._count.listings} عقار مسجّل
                </p>
              )}
              {memberSince && (
                <p className="text-xs text-slate-400">عضو منذ {memberSince}</p>
              )}
            </div>
          </div>
        </div>

        {/* Contact button — navigates to messages (wired later) */}
        <button
          type="button"
          className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-[#1752F0] hover:text-[#1752F0]"
        >
          تواصل
        </button>
      </div>
    </div>
  );
}