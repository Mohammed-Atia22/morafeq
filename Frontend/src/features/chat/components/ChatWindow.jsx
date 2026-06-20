import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { MessageInput } from "./MessageInput";





export function ChatWindow({
  selectedConversation,
  messages,
  isLoadingMessages,
  currentUserId,
  isConnected,
  content,
  error,
  socketError,
  isSending,
  onContentChange,
  onSendMessage,
}) {

  const messagesEndRef = useRef(null);

useEffect(() => {
  messagesEndRef.current?.scrollIntoView({
    behavior: "smooth",
    block: "end",
  });
}, [messages, selectedConversation?.id]);
  if (!selectedConversation) {
    return (
      <main dir="rtl" className="flex min-h-0 flex-col">
        <div className="flex h-full items-center justify-center p-6 text-center">
          <div>
            <h2 className="text-xl font-black text-slate-800">
              اختر محادثة
            </h2>

            <p className="mt-2 text-slate-500">
              اختر محادثة من القائمة لعرض الرسائل.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main dir="rtl" className="flex min-h-0 flex-col">
      {/* رأس المحادثة */}
      <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="font-black text-slate-900">
            {selectedConversation.otherUser?.firstName}{" "}
            {selectedConversation.otherUser?.lastName}
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {selectedConversation.listing?.title}
          </p>
        </div>

        <span
          className={`text-xs font-bold ${
            isConnected ? "text-green-600" : "text-red-600"
          }`}
        >
          {isConnected ? "متصل" : "غير متصل"}
        </span>
      </header>

      {/* الرسائل */}
      <section className="flex-1 overflow-y-auto bg-slate-50 p-5">
        {isLoadingMessages ? (
          <p className="text-center text-slate-500">
            جاري تحميل الرسائل...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-center text-slate-500">
            لا توجد رسائل في هذه المحادثة.
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                currentUserId={currentUserId}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </section>

      {/* كتابة وإرسال الرسالة */}
      <MessageInput
        content={content}
        error={error}
        socketError={socketError}
        isConnected={isConnected}
        isSending={isSending}
        onContentChange={onContentChange}
        onSendMessage={onSendMessage}
      />
    </main>
  );
}
