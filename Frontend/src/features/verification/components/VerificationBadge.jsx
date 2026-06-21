export function VerificationBadge({ status, compact = false }) {
  const normalizedStatus = status ?? "NOT_STARTED";

  const statusConfig = {
    APPROVED: {
      icon: "✓",
      label: "موثّق",
      className: "bg-emerald-100 text-emerald-700",
    },
    PENDING: {
      icon: "…",
      label: "قيد المراجعة",
      className: "bg-blue-100 text-blue-700",
    },
    REJECTED: {
      icon: "!",
      label: "مرفوض",
      className: "bg-red-100 text-red-700",
    },
    NOT_STARTED: {
      icon: "!",
      label: compact ? "غير موثّق" : "غير موثّق",
      className: "bg-amber-100 text-amber-700",
    },
  };

  const config = statusConfig[normalizedStatus] ?? statusConfig.NOT_STARTED;

  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
        config.className,
      ].join(" ")}
    >
      <span>{config.icon}</span>
      {config.label}
    </span>
  );
}
