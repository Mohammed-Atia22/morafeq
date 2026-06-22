const STEPS = [
  { key: "firstName", label: "الاسم الأول" },
  { key: "lastName", label: "الاسم الأخير" },
  { key: "avatarUrl", label: "الصورة الشخصية" },
  { key: "phone", label: "رقم الهاتف" },
  { key: "bio", label: "نبذة شخصية" },
  { key: "gender", label: "الجنس" },
  { key: "roommateProfileCompleted", label: "بيانات توافق الزملاء" },
];

export function ProfileCompleteness({ profile, completeness }) {
  if (!profile) return null;

  const isVerificationApproved = profile.verificationStatus === "APPROVED";

  const colorClass =
    completeness === 100
      ? "bg-emerald-500"
      : completeness >= 60
        ? "bg-[#1752F0]"
        : "bg-amber-400";

  const label =
    completeness === 100
      ? "ملفك مكتمل بالكامل"
      : completeness === 90 && !isVerificationApproved
        ? "ملفك مكتمل بانتظار اعتماد التوثيق"
        : completeness >= 60
          ? "ملفك في طريقه للاكتمال"
          : "أكمل ملفك لنتائج أفضل";

  const missing = [
    ...STEPS.filter((s) => !profile[s.key]),
    ...(!isVerificationApproved
      ? [{ key: "verification", label: "اعتماد التوثيق" }]
      : []),
  ];

  return (
    <div className="rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-sm font-black text-[#0f172a]">
            اكتمال الملف الشخصي
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
        </div>
        <span
          className={[
            "text-2xl font-black",
            completeness === 100
              ? "text-emerald-500"
              : completeness >= 60
                ? "text-[#1752F0]"
                : "text-amber-400",
          ].join(" ")}
        >
          {completeness}%
        </span>
      </div>

      {/* Bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-700 ${colorClass}`}
          style={{ width: `${completeness}%` }}
        />
      </div>

      {/* Missing fields */}
      {missing.length > 0 && (
        <div className="mt-4 space-y-1.5">
          {missing.map((step) => (
            <div
              key={step.key}
              className="flex items-center gap-2 text-xs text-slate-500"
            >
              <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[9px] text-slate-400">
                ✕
              </span>
              {step.label} غير مكتمل
            </div>
          ))}
        </div>
      )}

      {completeness === 100 && (
        <p className="mt-3 text-xs text-emerald-600 font-semibold">
          ملفك مكتمل بالكامل وستحصل على نتائج بحث أفضل
        </p>
      )}
    </div>
  );
}
