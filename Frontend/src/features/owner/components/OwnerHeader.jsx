import { Link } from "react-router-dom";

function IconBase({ children, className = "h-5 w-5" }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      {children}
    </svg>
  );
}

function BellIcon({ className }) {
  return (
    <IconBase className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 20h4"
      />
    </IconBase>
  );
}

export function OwnerHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="flex min-h-[74px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-7">
        <div>
          <h1 className="text-2xl font-black text-[#172033]">عقاراتي</h1>
          <p className="text-sm font-semibold text-slate-500">إجمالي عقاراتك</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative grid h-11 w-11 place-items-center rounded-xl border border-slate-200 bg-white text-[#0b62d8] shadow-sm"
          >
            <BellIcon className="h-5 w-5" />
            <span className="absolute bottom-2 right-2 h-2 w-2 rounded-full bg-red-500" />
          </button>
          <Link
            to="/"
            className="hidden rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-500 shadow-sm sm:inline-flex"
          >
            العودة للموقع
          </Link>
        </div>
      </div>
    </header>
  );
}
