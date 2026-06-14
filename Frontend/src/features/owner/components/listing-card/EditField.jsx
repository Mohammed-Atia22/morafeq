export function EditField({
  label,
  value,
  onChange,
  type = "text",
  options = [],
  className = "",
  ...props
}) {
  const fieldClassName = [
    "w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#172033] outline-none transition focus:border-[#0b62d8] focus:ring-2 focus:ring-blue-100",
    type === "textarea" ? "min-h-28 py-3 resize-y" : "h-11",
  ].join(" ");

  return (
    <label
      className={[
        "flex flex-col gap-2 text-right text-xs font-black text-slate-500",
        className,
      ].join(" ")}
    >
      {label}
      {type === "select" ? (
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClassName}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClassName}
          {...props}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={fieldClassName}
          {...props}
        />
      )}
    </label>
  );
}
