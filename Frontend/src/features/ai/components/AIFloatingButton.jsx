export function AIFloatingButton({ isOpen, onClick, showWelcomeBubble }) {
  return (
    <div className="fixed bottom-5 left-5 z-50 flex items-end gap-2" dir="rtl">
      {showWelcomeBubble && !isOpen && (
        <div className="pointer-events-none absolute bottom-20 left-0 w-[240px] rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-2xl shadow-slate-900/10 backdrop-blur-md text-right text-sm text-slate-800">
          <p className="font-semibold">مرحباً، أنا رفيق 👋</p>
          <p className="mt-1 text-xs text-slate-600">
            كيف يمكنني مساعدتك اليوم؟
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={onClick}
        aria-label="فتح مساعد رفيق"
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#4f5be8] to-[#2d339c] text-white shadow-[0_20px_60px_rgba(79,91,232,0.24)] transition-transform duration-300 hover:-translate-y-1 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#4f5be8]"
      >
        <span className="absolute inset-0 rounded-full bg-[#4f5be8]/20 opacity-80 blur-xl" />
        <span className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/10">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white"
          >
            <path
              d="M7 7C7 4.79086 8.79086 3 11 3H13C15.2091 3 17 4.79086 17 7V11C17 13.2091 15.2091 15 13 15H11C8.79086 15 7 13.2091 7 11V7Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M7 12.9999L4 17.9999V20.9999H20V17.9999L17 12.9999"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M12 7.5V11"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M10 9H14"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>
    </div>
  );
}
