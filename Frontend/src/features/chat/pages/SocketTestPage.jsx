import { useCallback, useState } from "react";
import { useChatSocket } from "../hooks/useChatSocket";
import { chatApi } from "../services/chatApi";

export function SocketTestPage() {
  const [conversationId, setConversationId] = useState("1");
  const [joinedConversationId, setJoinedConversationId] = useState(null);

  const [content, setContent] = useState("");
  const [messages, setMessages] = useState([]);

  const [roomStatus, setRoomStatus] = useState("");
  const [sendStatus, setSendStatus] = useState("");
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  // بتشتغل عند استقبال رسالة جديدة من Socket.IO
  const handleNewMessage = useCallback((message) => {
    setMessages((currentMessages) => {
      // منع تكرار نفس الرسالة
      const messageAlreadyExists = currentMessages.some(
        (currentMessage) => currentMessage.id === message.id,
      );

      if (messageAlreadyExists) {
        return currentMessages;
      }

      return [...currentMessages, message];
    });
  }, []);

  const {
    isConnected,
    socketId,
    socketError,
    joinConversation,
    sendMessage,
  } = useChatSocket(handleNewMessage);

  const handleJoinConversation = async () => {
    const numericConversationId = Number(conversationId);

    setRoomStatus("");
    setSendStatus("");

    if (!numericConversationId || numericConversationId < 1) {
      setRoomStatus("رقم المحادثة غير صحيح");
      return;
    }

    try {
      setRoomStatus("جاري دخول المحادثة...");

      // دخول Socket Room
      const response = await joinConversation(
        numericConversationId,
      );

      setJoinedConversationId(response.conversationId);

      // جلب الرسائل القديمة
      setIsLoadingMessages(true);

      const oldMessages = await chatApi.getMessages(
        numericConversationId,
      );

      setMessages(oldMessages);

      // تعليم رسائل الطرف الآخر كمقروءة
      await chatApi.markAsRead(numericConversationId);

      setRoomStatus(
        `تم دخول المحادثة رقم ${response.conversationId}`,
      );
    } catch (error) {
      setRoomStatus(
        error.message || "تعذر دخول المحادثة",
      );
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const handleSendMessage = async () => {
    const cleanedContent = content.trim();

    setSendStatus("");

    if (!joinedConversationId) {
      setSendStatus("يجب دخول المحادثة أولًا");
      return;
    }

    if (!cleanedContent) {
      setSendStatus("اكتب رسالة أولًا");
      return;
    }

    try {
      setSendStatus("جاري إرسال الرسالة...");

      await sendMessage(
        joinedConversationId,
        cleanedContent,
      );

      // متضيفش الرسالة يدويًا؛
      // newMessage هيضيفها عند وصولها من السيرفر
      setContent("");
      setSendStatus("تم إرسال الرسالة");
    } catch (error) {
      setSendStatus(
        error.message || "تعذر إرسال الرسالة",
      );
    }
  };

  return (
    <div
      dir="rtl"
      className="mx-auto mt-20 max-w-2xl rounded-xl border bg-black p-6"
    >
      <h1 className="mb-4 text-2xl font-bold">
        اختبار الشات
      </h1>

      <p>
        حالة الاتصال:{" "}
        <strong>
          {isConnected
            ? "تم الاتصال بنجاح"
            : "غير متصل"}
        </strong>
      </p>

      {socketId && (
        <p className="mt-2">
          Socket ID: <strong>{socketId}</strong>
        </p>
      )}

      {socketError && (
        <p className="mt-2 font-bold text-red-600">
          {socketError}
        </p>
      )}

      {/* دخول المحادثة */}
      <div className="mt-6">
        <label className="mb-2 block font-bold">
          Conversation ID
        </label>

        <input
          type="number"
          min="1"
          value={conversationId}
          disabled={Boolean(joinedConversationId)}
          onChange={(event) =>
            setConversationId(event.target.value)
          }
          className="w-full rounded-lg border p-3 disabled:bg-gray-100"
        />

        <button
          type="button"
          onClick={handleJoinConversation}
          disabled={
            !isConnected ||
            Boolean(joinedConversationId) ||
            isLoadingMessages
          }
          className="mt-3 w-full rounded-lg bg-blue-600 p-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoadingMessages
            ? "جاري تحميل الرسائل..."
            : joinedConversationId
              ? "تم دخول المحادثة"
              : "دخول المحادثة"}
        </button>

        {roomStatus && (
          <p className="mt-3 font-bold">
            {roomStatus}
          </p>
        )}
      </div>

      {/* كتابة الرسالة */}
      <div className="mt-8 border-t pt-6">
        <label className="mb-2 block font-bold">
          الرسالة
        </label>

        <textarea
          value={content}
          disabled={!joinedConversationId}
          onChange={(event) =>
            setContent(event.target.value)
          }
          placeholder="اكتب رسالتك هنا..."
          rows={3}
          className="w-full resize-none rounded-lg border p-3 disabled:bg-gray-100"
        />

        <button
          type="button"
          onClick={handleSendMessage}
          disabled={
            !isConnected ||
            !joinedConversationId ||
            !content.trim()
          }
          className="mt-3 w-full rounded-lg bg-green-600 p-3 font-bold text-black disabled:cursor-not-allowed disabled:opacity-60"
        >
          إرسال الرسالة
        </button>

        {sendStatus && (
          <p className="mt-3 font-bold">
            {sendStatus}
          </p>
        )}
      </div>

      {/* عرض الرسائل */}
      <div className="mt-8 border-t pt-6">
        <h2 className="mb-4 text-xl font-bold">
          الرسائل
        </h2>

        {isLoadingMessages ? (
          <p className="text-gray-500">
            جاري تحميل الرسائل...
          </p>
        ) : messages.length === 0 ? (
          <p className="text-gray-500">
            لا توجد رسائل حتى الآن
          </p>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-lg border bg-gray-50 p-3"
              >
                <p className="font-bold">
                  {message.sender?.firstName}{" "}
                  {message.sender?.lastName}
                </p>

                <p className="mt-1 whitespace-pre-wrap">
                  {message.content}
                </p>

                <p className="mt-2 text-xs text-gray-500">
                  Message ID: {message.id}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}