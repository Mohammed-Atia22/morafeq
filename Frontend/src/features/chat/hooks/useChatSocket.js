
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createChatSocket } from "../services/chatSocket";

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

      setSocketError(
        error.message ||
          "تعذر الاتصال بالمحادثة",
      );

      setIsConnected(false);
    };

    const handleSocketError = (error) => {
      console.log("Socket error:", error);

      setSocketError(
        error?.message ||
          "حدث خطأ في اتصال المحادثة",
      );
    };

    const handleException = (error) => {
      console.log(
        "Socket exception:",
        error,
      );

      setSocketError(
        error?.message ||
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
                "Socket is not connected",
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
                "Invalid conversation ID",
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
                    "Could not join conversation",
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
                "Socket is not connected",
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
                "Invalid conversation ID",
              ),
            );

            return;
          }

          if (!cleanedContent) {
            reject(
              new Error(
                "Message cannot be empty",
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
                    "Could not send message",
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
                "Socket is not connected",
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
                "Invalid conversation ID",
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
                    "Could not mark messages as read",
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

