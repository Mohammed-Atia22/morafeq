import { useEffect, useRef } from "react";
import { DisputeMessageBubble } from "./DisputeMessageBubble";

export function DisputeMessageList({
  messages = [],
  currentUserId,
  loading = false,
  loadingMore = false,
  hasOlder = false,
  onLoadOlder,
  showSender = false,
  readOnly = false,
  emptyMessage = "لا توجد رسائل بعد",
}) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const previousScrollHeightRef = useRef(0);
  const previousLengthRef = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const isPrepend =
      messages.length > previousLengthRef.current &&
      previousScrollHeightRef.current > 0;

    if (isPrepend) {
      container.scrollTop = container.scrollHeight - previousScrollHeightRef.current;
    } else if (!loadingMore) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    previousLengthRef.current = messages.length;
    previousScrollHeightRef.current = container.scrollHeight;
  }, [messages, loadingMore]);

  const handleLoadOlder = async () => {
    const container = containerRef.current;
    if (container) {
      previousScrollHeightRef.current = container.scrollHeight;
    }
    await onLoadOlder?.();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1752F0] border-t-transparent" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex max-h-[420px] min-h-[280px] flex-col gap-3 overflow-y-auto px-1 py-2">
      {hasOlder && !readOnly && (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleLoadOlder}
            disabled={loadingMore}
            className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 hover:border-[#1752F0] hover:text-[#1752F0] disabled:opacity-60"
          >
            {loadingMore ? "جاري التحميل..." : "تحميل رسائل أقدم"}
          </button>
        </div>
      )}

      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center text-sm font-semibold text-slate-400">
          {emptyMessage}
        </div>
      ) : (
        messages.map((message) => (
          <DisputeMessageBubble
            key={message.id}
            message={message}
            currentUserId={currentUserId}
            showSender={showSender}
          />
        ))
      )}

      <div ref={bottomRef} />
    </div>
  );
}
