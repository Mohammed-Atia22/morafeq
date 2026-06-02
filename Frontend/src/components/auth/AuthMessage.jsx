export function AuthMessage({ type = 'error', children }) {
  if (!children) {
    return null
  }

  const styles =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : 'border-red-200 bg-red-50 text-red-700'

  return (
    <p className={`rounded-xl border px-4 py-3 text-sm font-semibold ${styles}`}>
      {children}
    </p>
  )
}
