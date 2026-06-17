export function FormField({
  label,
  error,
  className = '',
  children,
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-black text-slate-800">{label}</span>
      {children}
      {error ? (
        <span className="mt-1 block text-xs font-semibold text-red-600">
          {error.message}
        </span>
      ) : null}
    </label>
  )
}

export const inputClass =
  'h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#075ed8] focus:bg-white focus:ring-4 focus:ring-blue-100'
