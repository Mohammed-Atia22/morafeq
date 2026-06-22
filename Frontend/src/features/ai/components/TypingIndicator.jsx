export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-white px-4 py-4 text-sm text-slate-700 shadow-sm ring-1 ring-slate-100">
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-[#4f5be8]/10 text-sm font-black text-[#4f5be8]">
        AI
      </div>
      <div>
        <p className="font-semibold">Morafeq AI is thinking...</p>
        <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
          {[0, 120, 240].map((delay) => (
            <span
              key={delay}
              className="h-2 w-2 animate-bounce rounded-full bg-[#4f5be8]"
              style={{ animationDelay: `${delay}ms` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
