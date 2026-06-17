import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chatApi } from "../../chat/services/chatApi";
import { useChatSocket } from "../../chat/hooks/useChatSocket";
import { useAuth } from "../../auth/hooks/useAuth";

export function OwnerMessagesPage() {
  const { user } = useAuth();

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] =
    useState(null);

  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");

  const [isLoadingConversations, setIsLoadingConversations] =
    useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [error, setError] = useState("");

  const selectedConversationIdRef = useRef(null);

  useEffect(() => {
    selectedConversationIdRef.current = selectedConversationId;
  }, [selectedConversationId]);

  // استقبال رسالة جديدة من Socket.IO
  const handleNewMessage = useCallback((message) => {
    const activeConversationId =
      selectedConversationIdRef.current;

    // لو الرسالة تخص المحادثة المفتوحة، اعرضها
    if (message.conversationId === activeConversationId) {
      setMessages((currentMessages) => {
        const alreadyExists = currentMessages.some(
          (currentMessage) =>
            currentMessage.id === message.id,
        );

        if (alreadyExists) {
          return currentMessages;
        }

        return [...currentMessages, message];
      });

      // بما إن المحادثة مفتوحة، اعتبر الرسالة مقروءة
      chatApi
        .markAsRead(message.conversationId)
        .catch(() => {});
    }

    // تحديث آخر رسالة وترتيب قائمة المحادثات
    setConversations((currentConversations) => {
      const updatedConversations = currentConversations.map(
        (conversation) => {
          if (conversation.id !== message.conversationId) {
            return conversation;
          }

          const messageIsForOpenConversation =
            conversation.id === activeConversationId;

          return {
            ...conversation,
            lastMessage: message,
            updatedAt: message.createdAt,
            unreadCount: messageIsForOpenConversation
              ? 0
              : conversation.unreadCount + 1,
          };
        },
      );

      return updatedConversations.sort(
        (firstConversation, secondConversation) =>
          new Date(secondConversation.updatedAt).getTime() -
          new Date(firstConversation.updatedAt).getTime(),
      );
    });
  }, []);

  const {
    isConnected,
    socketError,
    joinConversation,
    sendMessage,
  } = useChatSocket(handleNewMessage);

  // جلب قائمة المحادثات
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingConversations(true);
        setError("");

        const data = await chatApi.getConversations();

        setConversations(data);

        // افتح أول محادثة تلقائيًا
        if (data.length > 0) {
          setSelectedConversationId((currentId) => {
            return currentId ?? data[0].id;
          });
        }
      } catch (requestError) {
        setError(
          requestError.message ||
            "تعذر تحميل المحادثات",
        );
      } finally {
        setIsLoadingConversations(false);
      }
    };

    loadConversations();
  }, []);

  // فتح المحادثة وجلب رسائلها
  useEffect(() => {
    if (!selectedConversationId || !isConnected) {
      return;
    }

    let isCancelled = false;

    const openConversation = async () => {
      try {
        setIsLoadingMessages(true);
        setError("");
        setMessages([]);

        // دخول Socket room
        await joinConversation(selectedConversationId);

        // جلب الرسائل القديمة
        const oldMessages = await chatApi.getMessages(
          selectedConversationId,
        );

        if (!isCancelled) {
          setMessages(oldMessages);
        }

        // تعليم رسائل الطرف الآخر كمقروءة
        await chatApi.markAsRead(selectedConversationId);

        if (!isCancelled) {
          setConversations((currentConversations) =>
            currentConversations.map((conversation) =>
              conversation.id === selectedConversationId
                ? {
                    ...conversation,
                    unreadCount: 0,
                  }
                : conversation,
            ),
          );
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError.message ||
              "تعذر فتح المحادثة",
          );
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingMessages(false);
        }
      }
    };

    openConversation();

    return () => {
      isCancelled = true;
    };
  }, [
    selectedConversationId,
    isConnected,
    joinConversation,
  ]);

  const selectedConversation = useMemo(() => {
    return conversations.find(
      (conversation) =>
        conversation.id === selectedConversationId,
    );
  }, [conversations, selectedConversationId]);

  const handleSelectConversation = (conversationId) => {
    if (conversationId === selectedConversationId) {
      return;
    }

    setContent("");
    setError("");
    setSelectedConversationId(conversationId);
  };

  const handleSendMessage = async () => {
    const cleanedContent = content.trim();

    if (!selectedConversationId) {
      setError("اختر محادثة أولًا");
      return;
    }

    if (!cleanedContent) {
      return;
    }

    try {
      setIsSending(true);
      setError("");

      await sendMessage(
        selectedConversationId,
        cleanedContent,
      );

      // الرسالة هتظهر من حدث newMessage
      setContent("");
    } catch (sendError) {
      setError(
        sendError.message || "تعذر إرسال الرسالة",
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (event) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[340px_1fr]">
        {/* قائمة المحادثات */}
        <aside className="border-l border-slate-200 bg-slate-50">
          <div className="border-b border-slate-200 p-5">
            <h1 className="text-2xl font-black text-slate-900">
              الرسائل
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              تواصل مع المستأجرين حول العقارات
            </p>
          </div>

          <div className="h-[calc(100%-98px)] overflow-y-auto">
            {isLoadingConversations ? (
              <p className="p-5 text-sm text-slate-500">
                جاري تحميل المحادثات...
              </p>
            ) : conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="font-bold text-slate-700">
                  لا توجد محادثات
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  ستظهر المحادثات هنا عندما يتواصل أحد
                  المستأجرين معك.
                </p>
              </div>
            ) : (
              conversations.map((conversation) => {
                const isSelected =
                  conversation.id ===
                  selectedConversationId;

                const otherUserName =
                  `${conversation.otherUser?.firstName ?? ""} ${
                    conversation.otherUser?.lastName ?? ""
                  }`.trim();

                return (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() =>
                      handleSelectConversation(
                        conversation.id,
                      )
                    }
                    className={`flex w-full gap-3 border-b border-slate-200 p-4 text-right transition ${
                      isSelected
                        ? "bg-blue-50"
                        : "hover:bg-white"
                    }`}
                  >
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-black text-blue-700">
                      {conversation.otherUser?.avatarUrl ? (
                        <img
                          src={
                            conversation.otherUser.avatarUrl
                          }
                          alt={otherUserName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        conversation.otherUser?.firstName?.[0] ??
                        "م"
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate font-black text-slate-900">
                          {otherUserName || "مستخدم"}
                        </p>

                        {conversation.unreadCount > 0 && (
                          <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                            {conversation.unreadCount}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 truncate text-xs font-semibold text-blue-700">
                        {conversation.listing?.title}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-500">
                        {conversation.lastMessage?.content ??
                          "لا توجد رسائل بعد"}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* نافذة المحادثة */}
        <main className="flex min-h-0 flex-col">
          {!selectedConversation ? (
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
          ) : (
            <>
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
                    isConnected
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {isConnected
                    ? "متصل"
                    : "غير متصل"}
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
                    {messages.map((message) => {
                      const isMyMessage =
                        message.senderId === user?.id;

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            isMyMessage
                              ? "justify-start"
                              : "justify-end"
                          }`}
                        >
                          <div
                            className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              isMyMessage
                                ? "rounded-tr-sm bg-blue-600 text-white"
                                : "rounded-tl-sm border border-slate-200 bg-white text-slate-900"
                            }`}
                          >
                            <p className="whitespace-pre-wrap break-words text-sm">
                              {message.content}
                            </p>

                            <p
                              className={`mt-2 text-[11px] ${
                                isMyMessage
                                  ? "text-blue-100"
                                  : "text-slate-400"
                              }`}
                            >
                              {new Date(
                                message.createdAt,
                              ).toLocaleTimeString(
                                "ar-EG",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

              {/* كتابة الرسالة */}
              <footer className="border-t border-slate-200 bg-white p-4">
                {(error || socketError) && (
                  <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm font-bold text-red-600">
                    {error || socketError}
                  </p>
                )}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <textarea
                    value={content}
                    onChange={(event) =>
                      setContent(event.target.value)
                    }
                    onKeyDown={handleKeyDown}
                    disabled={
                      !isConnected || isSending
                    }
                    rows={2}
                    maxLength={2000}
                    placeholder="اكتب رسالتك هنا..."
                    className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={handleSendMessage}
                    disabled={
                      !isConnected ||
                      isSending ||
                      !content.trim()
                    }
                    className="h-[52px] rounded-xl bg-blue-600 px-6 font-black text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSending ? "..." : "إرسال"}
                  </button>
                </div>

                <p className="mt-2 text-xs text-slate-400">
                  يتم إخفاء أرقام الهاتف تلقائيًا لحماية
                  المستخدمين.
                </p>
              </footer>
            </>
          )}
        </main>
      </div>
    </div>
  );
}