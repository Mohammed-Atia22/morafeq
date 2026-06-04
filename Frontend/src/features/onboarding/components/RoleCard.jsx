export function RoleCard({ icon, title, description, isSelected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center rounded-xl border-2 p-6 transition-all duration-200 ${
        isSelected
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white hover:border-blue-300'
      }`}
    >
      <div className="mb-3 text-4xl">{icon}</div>
      <h3 className="mb-2 text-lg font-bold text-slate-800">{title}</h3>
      <p className="text-sm text-slate-500">{description}</p>
    </button>
  )
}
