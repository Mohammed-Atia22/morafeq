import { formatChatDateTime } from "../utils/chatDate";

export function MessageBubble({ message, currentUserId }) {
  const isMyMessage = message.senderId === currentUserId;

  const messageTime = formatChatDateTime(message.createdAt);

  return (
    <div className={`flex ${isMyMessage ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 ${
          isMyMessage
            ? "rounded-tl-sm bg-blue-600 text-white"
            : "rounded-tr-sm border border-slate-200 bg-white text-slate-900"
        }`}
      >
        <p className="whitespace-pre-wrap break-words text-sm">
          {message.content}
        </p>

        <div className="mt-2 flex items-center gap-2">
          <time
            dateTime={message.createdAt}
            className={`text-[11px] ${
              isMyMessage ? "text-blue-100" : "text-slate-400"
            }`}
          >
            {messageTime}
          </time>

          {isMyMessage && (
            <span className="text-[11px] text-blue-100">
              {message.isRead ? "✓✓ " : "✓ "}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
