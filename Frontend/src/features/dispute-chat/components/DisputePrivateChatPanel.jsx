import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../../auth/hooks/useAuth";
import { useDisputeSocket } from "../hooks/useDisputeSocket";
import { usePaginatedDisputeMessages } from "../hooks/usePaginatedDisputeMessages";
import { DisputeMessageList } from "./DisputeMessageList";
import { DisputeMessageInput } from "./DisputeMessageInput";
import {
  appendMessage,
  applyDisputeMessagesRead,
} from "../utils/disputeMessageUtils";

export function DisputePrivateChatPanel({
  conversationId,
  fetchMessages,
  sendRestMessage,
  onCloseConversation,
  showCloseButton = false,
  showSender = true,
  title = "محادثة خاصة",
}) {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [closing, setClosing] = useState(false);

  const fetchPage = useCallback(
    (page, limit) => fetchMessages(conversationId, { page, limit }),
    [conversationId, fetchMessages],
  );

  const {
    messages,
    setMessages,
    loading,
    loadingMore,
    error,
    loadOlder,
    hasOlder,
    loadInitial,
    conversation,
  } = usePaginatedDisputeMessages({
    fetchPage,
    enabled: Boolean(conversationId),
    limit: 50,
  });

  const handleNewMessage = useCallback(
    (message) => {
      if (Number(message.conversationId) !== Number(conversationId)) return;
      setMessages((current) => appendMessage(current, message));
    },
    [conversationId, setMessages],
  );

  const handleMessagesRead = useCallback(
    (event) => {
      if (Number(event.conversationId) !== Number(conversationId)) return;
      setMessages((current) => applyDisputeMessagesRead(current, event));
    },
    [conversationId, setMessages],
  );

  const {
    isConnected,
    socketError,
    joinDisputeConversation,
    sendDisputeMessage,
    markDisputeMessagesAsRead,
  } = useDisputeSocket({
    onNewMessage: handleNewMessage,
    onMessagesRead: handleMessagesRead,
    enabled: Boolean(conversationId),
  });

  useEffect(() => {
    if (!conversationId) return;

    let active = true;

    const bootstrap = async () => {
      try {
        await loadInitial();
        await joinDisputeConversation(conversationId);
        await markDisputeMessagesAsRead(conversationId).catch(() => {});
      } catch (err) {
        if (active) {
          toast.error(err.message || "تعذر تهيئة محادثة النزاع");
        }
      }
    };

    bootstrap();

    return () => {
      active = false;
    };
  }, [
    conversationId,
    joinDisputeConversation,
    loadInitial,
    markDisputeMessagesAsRead,
  ]);

  useEffect(() => {
    setIsClosed(Boolean(conversation?.isClosed));
  }, [conversation?.isClosed]);

  const handleSend = async () => {
    const trimmed = content.trim();
    if (!trimmed || isClosed) return;

    setIsSending(true);
    setSendError("");

    try {
      if (isConnected) {
        await sendDisputeMessage(conversationId, trimmed);
      } else if (sendRestMessage) {
        const result = await sendRestMessage(conversationId, trimmed);
        setMessages((current) => appendMessage(current, result.data ?? result));
      } else {
        throw new Error("الاتصال غير متاح لإرسال الرسالة");
      }

      setContent("");
    } catch (err) {
      if (err.message?.includes("closed") || err.message?.includes("مغلقة")) {
        setIsClosed(true);
      }
      setSendError(err.message || "تعذر إرسال الرسالة");
    } finally {
      setIsSending(false);
    }
  };

  const handleClose = async () => {
    if (!onCloseConversation) return;

    setClosing(true);
    try {
      await onCloseConversation(conversationId);
      setIsClosed(true);
      toast.success("تم إغلاق المحادثة");
    } catch (err) {
      toast.error(err.message || "تعذر إغلاق المحادثة");
    } finally {
      setClosing(false);
    }
  };

  const headerBadge = useMemo(() => {
    if (isClosed) {
      return (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
          مغلقة
        </span>
      );
    }

    return (
      <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
        نشطة
      </span>
    );
  }, [isClosed]);

  if (!conversationId) {
    return (
      <div className="rounded-2xl bg-white p-6 text-center text-sm text-slate-400 ring-1 ring-slate-100">
        اختر محادثة لبدء المراسلة
      </div>
    );
  }

  return (
    <div dir="rtl" className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-100">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-black text-[#0f172a]">{title}</h3>
          {headerBadge}
        </div>
        {showCloseButton && !isClosed && onCloseConversation && (
          <button
            type="button"
            onClick={handleClose}
            disabled={closing}
            className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-60"
          >
            {closing ? "جاري الإغلاق..." : "إغلاق المحادثة"}
          </button>
        )}
      </div>

      <div className="px-4 py-3">
        {(error || sendError) && (
          <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error || sendError}
          </p>
        )}

        <DisputeMessageList
          messages={messages}
          currentUserId={user?.id}
          loading={loading}
          loadingMore={loadingMore}
          hasOlder={hasOlder}
          onLoadOlder={loadOlder}
          showSender={showSender}
        />
      </div>

      <DisputeMessageInput
        content={content}
        onContentChange={setContent}
        onSend={handleSend}
        isConnected={isConnected || Boolean(sendRestMessage)}
        isSending={isSending}
        isClosed={isClosed}
        socketError={socketError}
      />
    </div>
  );
}
