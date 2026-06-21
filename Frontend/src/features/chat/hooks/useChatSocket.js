
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createChatSocket } from "../services/chatSocket";
import { translateErrorMessage } from "../../../shared/services/api";

const isSocketAuthError = (message = "") =>
  String(message).toLowerCase().includes("unauthorized") ||
  String(message).toLowerCase().includes("token");

export function useChatSocket(
  onNewMessage,
  onMessagesRead,
) {
  const socketRef = useRef(null);

  // الاحتفاظ بأحدث نسخة من functions القادمة من useChatPage
  const onNewMessageRef = useRef(onNewMessage);
  const onMessagesReadRef = useRef(onMessagesRead);

  const [isConnected, setIsConnected] =
    useState(false);

  const [socketId, setSocketId] = useState("");
  const [socketError, setSocketError] =
    useState("");

  // تحديث function استقبال الرسائل الجديدة
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  // تحديث function استقبال حدث قراءة الرسائل
  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead;
  }, [onMessagesRead]);

  // إنشاء اتصال Socket.IO
  useEffect(() => {
    const socket = createChatSocket();

    socketRef.current = socket;

    const handleConnect = () => {
      console.log(
        "Socket connected:",
        socket.id,
      );

      setIsConnected(true);
      setSocketId(socket.id);
      setSocketError("");
    };

    const handleDisconnect = (reason) => {
      console.log(
        "Socket disconnected:",
        reason,
      );

      setIsConnected(false);
      setSocketId("");
    };

    const handleConnectError = (error) => {
      console.log(
        "Socket connection error:",
        error.message,
      );

      if (isSocketAuthError(error.message)) {
        socket.auth = {
          token: localStorage.getItem("morafeq_access_token"),
        };

        setSocketError("");
        setIsConnected(false);
        return;
      }

      setSocketError(
        translateErrorMessage(error.message) ||
          "تعذر الاتصال بالمحادثة",
      );

      setIsConnected(false);
    };

    const handleSocketError = (error) => {
      console.log("Socket error:", error);

      if (isSocketAuthError(error?.message)) {
        socket.auth = {
          token: localStorage.getItem("morafeq_access_token"),
        };

        setSocketError("");
        setIsConnected(false);
        return;
      }

      setSocketError(
        translateErrorMessage(error?.message) ||
          "حدث خطأ في اتصال المحادثة",
      );
    };

    const handleException = (error) => {
      console.log(
        "Socket exception:",
        error,
      );

      setSocketError(
        translateErrorMessage(error?.message) ||
          "حدث خطأ أثناء تنفيذ العملية",
      );
    };

    // استقبال رسالة جديدة
    const handleNewMessage = (message) => {
      console.log(
        "New message received:",
        message,
      );

      onNewMessageRef.current?.(message);
    };

    // استقبال حدث إن الطرف الآخر قرأ الرسائل
    const handleMessagesRead = (data) => {
      console.log(
        "Messages read:",
        data,
      );

      onMessagesReadRef.current?.(data);
    };

    socket.on("connect", handleConnect);

    socket.on(
      "disconnect",
      handleDisconnect,
    );

    socket.on(
      "connect_error",
      handleConnectError,
    );

    socket.on(
      "socketError",
      handleSocketError,
    );

    socket.on(
      "exception",
      handleException,
    );

    socket.on(
      "newMessage",
      handleNewMessage,
    );

    socket.on(
      "messagesRead",
      handleMessagesRead,
    );

    const handleVisibilityChange = () => {
      if (
        document.visibilityState === "visible" &&
        !socket.connected
      ) {
        socket.auth = {
          token: localStorage.getItem("morafeq_access_token"),
        };

        socket.connect();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.off(
        "connect_error",
        handleConnectError,
      );

      socket.off(
        "socketError",
        handleSocketError,
      );

      socket.off(
        "exception",
        handleException,
      );

      socket.off(
        "newMessage",
        handleNewMessage,
      );

      socket.off(
        "messagesRead",
        handleMessagesRead,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );

      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // دخول غرفة المحادثة
  const joinConversation = useCallback(
    (conversationId) => {
      return new Promise(
        (resolve, reject) => {
          const socket = socketRef.current;

          const numericConversationId =
            Number(conversationId);

          if (!socket?.connected) {
            reject(
              new Error(
                "الاتصال بالمحادثة غير متاح حاليًا",
              ),
            );

            return;
          }

          if (
            !numericConversationId ||
            numericConversationId < 1
          ) {
            reject(
              new Error(
                "رقم المحادثة غير صحيح",
              ),
            );

            return;
          }

          socket.emit(
            "joinConversation",
            {
              conversationId:
                numericConversationId,
            },
            (response) => {
              if (response?.success) {
                resolve(response);
                return;
              }

              reject(
                new Error(
                  response?.message ||
                    "تعذر فتح المحادثة",
                ),
              );
            },
          );
        },
      );
    },
    [],
  );

  // إرسال رسالة جديدة
  const sendMessage = useCallback(
    (conversationId, content) => {
      return new Promise(
        (resolve, reject) => {
          const socket = socketRef.current;

          const numericConversationId =
            Number(conversationId);

          const cleanedContent =
            content.trim();

          if (!socket?.connected) {
            reject(
              new Error(
                "الاتصال بالمحادثة غير متاح حاليًا",
              ),
            );

            return;
          }

          if (
            !numericConversationId ||
            numericConversationId < 1
          ) {
            reject(
              new Error(
                "رقم المحادثة غير صحيح",
              ),
            );

            return;
          }

          if (!cleanedContent) {
            reject(
              new Error(
                "لا يمكن إرسال رسالة فارغة",
              ),
            );

            return;
          }

          socket.emit(
            "sendMessage",
            {
              conversationId:
                numericConversationId,

              content: cleanedContent,
            },
            (response) => {
              if (response?.success) {
                resolve(response.message);
                return;
              }

              reject(
                new Error(
                  response?.message ||
                    "تعذر إرسال الرسالة",
                ),
              );
            },
          );
        },
      );
    },
    [],
  );

  // تعليم رسائل المحادثة كمقروءة
  const markAsRead = useCallback(
    (conversationId) => {
      return new Promise(
        (resolve, reject) => {
          const socket = socketRef.current;

          const numericConversationId =
            Number(conversationId);

          if (!socket?.connected) {
            reject(
              new Error(
                "الاتصال بالمحادثة غير متاح حاليًا",
              ),
            );

            return;
          }

          if (
            !numericConversationId ||
            numericConversationId < 1
          ) {
            reject(
              new Error(
                "رقم المحادثة غير صحيح",
              ),
            );

            return;
          }

          socket.emit(
            "markAsRead",
            {
              conversationId:
                numericConversationId,
            },
            (response) => {
              if (response?.success) {
                resolve(response);
                return;
              }

              reject(
                new Error(
                  response?.message ||
                    "تعذر تعليم الرسائل كمقروءة",
                ),
              );
            },
          );
        },
      );
    },
    [],
  );

  return {
    isConnected,
    socketId,
    socketError,

    joinConversation,
    sendMessage,
    markAsRead,
  };
}

