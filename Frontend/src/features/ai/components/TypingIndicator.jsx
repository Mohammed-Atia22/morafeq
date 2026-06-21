export function TypingIndicator() {
  return (
    <div className="flex items-center gap-3 rounded-3xl bg-slate-100 px-4 py-4 text-sm text-slate-700">
      <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#4f5be8]/10 text-[#4f5be8]">
        ر
      </div>
      <div>
        <p className="font-medium">رفيق يكتب...</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#4f5be8]" />
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-[#4f5be8]"
            style={{ animationDelay: "120ms" }}
          />
          <span
            className="h-2 w-2 animate-pulse rounded-full bg-[#4f5be8]"
            style={{ animationDelay: "240ms" }}
          />
        </div>
      </div>
    </div>
  );
}
