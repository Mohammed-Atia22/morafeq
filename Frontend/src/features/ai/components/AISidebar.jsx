import { useEffect, useRef } from "react";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

export function AISidebar({
  isOpen,
  onClose,
  messages,
  sessionId,
  sessions = [],
  sessionsLoading,
  onSend,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isTyping,
  error,
}) {
  const messagesRef = useRef(null);

  useEffect(() => {
    if (!messagesRef.current) {
      return;
    }

    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-[440px] ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#4f5be8] text-white shadow-lg shadow-[#4f5be8]/20">
            <span className="text-xl font-black">ر</span>
          </div>
          <div>
            <h2 className="text-lg font-semibold">رفيق</h2>
            <p className="text-sm text-slate-500">مساعدك الذكي في منصة مرافق</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-50"
          aria-label="إغلاق المساعد"
        >
          إغلاق
        </button>
      </div>

      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-sm font-black text-slate-700">المحادثات</p>
          <button
            type="button"
            onClick={onNewChat}
            className="rounded-full bg-[#4f5be8] px-3 py-1.5 text-xs font-black text-white transition hover:bg-[#3f49c9]"
          >
            محادثة جديدة
          </button>
        </div>

        <div className="max-h-36 space-y-2 overflow-y-auto pr-1">
          {sessionsLoading ? (
            <p className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              جاري تحميل المحادثات...
            </p>
          ) : sessions.length ? (
            sessions.map((session) => {
              const isActive = session.sessionId === sessionId;

              return (
                <div
                  key={session.sessionId}
                  className={`flex w-full items-center gap-2 rounded-2xl border px-3 py-2 text-right transition ${
                    isActive
                      ? "border-[#4f5be8] bg-white text-[#2d339c]"
                      : "border-transparent bg-white text-slate-600 hover:border-slate-200"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelectSession(session.sessionId)}
                    className="min-w-0 flex-1 truncate text-right text-xs font-bold"
                  >
                    {session.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSession(session.sessionId)}
                    className="shrink-0 rounded-full px-2 py-1 text-xs font-black text-rose-500 hover:bg-rose-50"
                    aria-label="حذف المحادثة"
                  >
                    حذف
                  </button>
                </div>
              );
            })
          ) : (
            <p className="rounded-2xl bg-white px-3 py-2 text-xs font-semibold text-slate-500">
              لا توجد محادثات محفوظة بعد.
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={messagesRef}
          className="h-full overflow-y-auto px-4 py-4 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-slate-100"
        >
          {messages.length === 0 && (
            <div className="mx-auto mt-10 max-w-[300px] rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-slate-600">
              <p className="text-base font-medium">مرحباً بك في رفيق</p>
              <p className="mt-2 text-sm">
                اكتب سؤالك أو اطلب مساعدة حول المنصة.
              </p>
            </div>
          )}

          <div className="space-y-4 pb-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
          </div>

          {isTyping && <TypingIndicator />}
        </div>
      </div>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-4">
        {error && (
          <div className="mb-3 rounded-2xl bg-rose-50 px-3 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <ChatInput onSend={onSend} />
      </div>
    </div>
  );
}
