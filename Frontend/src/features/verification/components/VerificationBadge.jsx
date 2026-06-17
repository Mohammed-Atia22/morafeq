export function VerificationBadge({ status, compact = false }) {
  const approved = status === "APPROVED";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        approved
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700",
      ].join(" ")}
    >
      <span>{approved ? "✓" : "!"}</span>
      {approved ? "موثّق" : compact ? "غير موثّق" : "غير موثّق"}
    </span>
  );
}
