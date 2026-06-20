export function DisputeMessageInput({
  content,
  onContentChange,
  onSend,
  isConnected = true,
  isSending = false,
  isClosed = false,
  error = "",
  socketError = "",
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSend?.();
    }
  };

  const disabled = !isConnected || isSending || isClosed;

  return (
    <footer className="border-t border-slate-200 bg-white p-4">
      {isClosed && (
        <p className="mb-3 rounded-lg bg-amber-50 p-3 text-sm font-bold text-amber-700">
          هذه المحادثة مغلقة ولا يمكن إرسال رسائل جديدة.
        </p>
      )}

      {(error || socketError) && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">
          {error || socketError}
        </p>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(event) => onContentChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          maxLength={2000}
          placeholder={
            isClosed ? "المحادثة مغلقة" : "اكتب رسالتك للإدارة هنا..."
          }
          className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#1752F0] disabled:bg-slate-100"
        />
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !content.trim()}
          className="h-[52px] rounded-xl bg-[#1752F0] px-6 font-black text-white transition hover:bg-[#1240c4] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "جاري الإرسال..." : "إرسال"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
        <span>{isConnected ? "متصل" : "غير متصل — يمكنك قراءة السجل فقط"}</span>
        <span>{content.length}/2000</span>
      </div>
    </footer>
  );
}
