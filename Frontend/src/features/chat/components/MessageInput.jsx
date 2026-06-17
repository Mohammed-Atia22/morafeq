export function MessageInput({
  content,
  error,
  socketError,
  isConnected,
  isSending,
  onContentChange,
  onSendMessage,
}) {
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSendMessage();
    }
  };

  return (
    <footer className="border-t border-slate-200 bg-white p-4">
      {(error || socketError) && (
        <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">
          {error || socketError}
        </p>
      )}

      <div className="flex items-end gap-3">
        <textarea
          value={content}
          onChange={(event) =>
            onContentChange(event.target.value)
          }
          onKeyDown={handleKeyDown}
          disabled={!isConnected || isSending}
          rows={2}
          maxLength={2000}
          placeholder="اكتب رسالتك هنا..."
          className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 disabled:bg-slate-100"
        />

        <button
          type="button"
          onClick={onSendMessage}
          disabled={
            !isConnected ||
            isSending ||
            !content.trim()
          }
          className="h-[52px] rounded-xl bg-blue-600 px-6 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSending ? "جاري الإرسال..." : "إرسال"}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-xs text-slate-400">
          يتم إخفاء أرقام الهاتف تلقائيًا لحماية المستخدمين.
        </p>

        <p className="text-xs text-slate-400">
          {content.length}/2000
        </p>
      </div>
    </footer>
  );
}