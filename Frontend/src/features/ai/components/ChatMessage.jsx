export function ChatMessage({ message }) {
  const isAssistant = message.role === "assistant";

  return (
    <article
      className={`flex gap-3 ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {isAssistant && (
        <div className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-2xl bg-[#4f5be8]/10 text-xs font-black text-[#4f5be8]">
          AI
        </div>
      )}

      <div
        className={`max-w-[86%] rounded-[24px] px-4 py-3 text-sm leading-7 shadow-sm ${
          isAssistant
            ? "rounded-tr-md bg-white text-slate-900 ring-1 ring-slate-100"
            : "rounded-tl-md bg-[#4f5be8] text-white"
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
        <time
          className={`mt-2 block text-right text-[11px] ${
            isAssistant ? "text-slate-400" : "text-white/70"
          }`}
        >
          {new Date(message.createdAt).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </time>
      </div>
    </article>
  );
}
