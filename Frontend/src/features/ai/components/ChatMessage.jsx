export function ChatMessage({ message }) {
  const isAssistant = message.role === "assistant";
  const bubbleClasses = isAssistant
    ? "rounded-3xl rounded-tl-none bg-slate-100 text-slate-900"
    : "rounded-3xl rounded-tr-none bg-[#4f5be8] text-white";

  return (
    <div className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}>
      <div className={`max-w-[85%] p-4 text-sm leading-6 ${bubbleClasses}`}>
        <div className="whitespace-pre-wrap break-words">{message.text}</div>
        <div className="mt-2 text-right text-[11px] text-slate-500">
          {new Date(message.createdAt).toLocaleTimeString("ar-EG", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}
