import { getSenderDisplayName, formatDisputeDate } from "../utils/disputeMessageUtils";

export function DisputeMessageBubble({
  message,
  currentUserId,
  showSender = false,
}) {
  const isMine = message.senderId === currentUserId;
  const senderName = getSenderDisplayName(message.sender);

  return (
    <div className={`flex ${isMine ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isMine
            ? "rounded-tr-sm bg-[#1752F0] text-white"
            : "rounded-tl-sm border border-slate-200 bg-white text-slate-900"
        }`}
      >
        {showSender && !isMine && (
          <p className="mb-1 text-[11px] font-bold text-slate-500">{senderName}</p>
        )}
        <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
        <div className="mt-2 flex items-center gap-2">
          <span
            className={`text-[11px] ${isMine ? "text-blue-100" : "text-slate-400"}`}
          >
            {formatDisputeDate(message.createdAt)}
          </span>
          {isMine && (
            <span className={`text-[11px] ${isMine ? "text-blue-100" : ""}`}>
              {message.isRead ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
