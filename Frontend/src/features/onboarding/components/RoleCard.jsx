export function RoleCard({
  badgeEmoji,
  floatingEmojis = [],
  variant = "blue",
  title,
  description,
  features = [],
  buttonLabel,
  onClick,
}) {
  const variantStyles = {
    blue: {
      headerBg: "bg-gradient-to-br from-slate-100 to-blue-50",
      badgeShape: "rounded-full",
      badgeBg: "bg-blue-600",
      buttonBg: "bg-blue-600 hover:bg-blue-700",
    },
    green: {
      headerBg: "bg-gradient-to-br from-emerald-50 to-teal-50",
      badgeShape: "rounded-2xl",
      badgeBg: "bg-emerald-600",
      buttonBg: "bg-emerald-600 hover:bg-emerald-700",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      {/* Header art */}
      <div className={`relative h-40 ${styles.headerBg}`}>
        <div
          className={`absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-4xl shadow-md ${styles.badgeShape} ${styles.badgeBg}`}
        >
          {badgeEmoji}
        </div>

        {floatingEmojis.map((emoji, index) => (
          <div
            key={index}
            className="absolute flex h-9 w-9 items-center justify-center rounded-xl bg-white text-lg shadow"
            style={emoji.position}
          >
            {emoji.icon}
          </div>
        ))}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        <h3 className="mb-1 text-lg font-bold text-slate-800">{title}</h3>
        <p className="mb-4 text-sm text-slate-400">{description}</p>

        <ul className="mb-6 flex-1 space-y-2.5">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm text-slate-600">
              <span className="text-base leading-none text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>

        <button
          onClick={onClick}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 font-bold text-white transition-colors ${styles.buttonBg}`}
        >
          {buttonLabel}
          <span>←</span>
        </button>
      </div>
    </div>
  );
}