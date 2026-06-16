import { useCallback, useEffect, useRef, useState } from "react";
import { createChatSocket } from "../services/chatSocket";

export function useChatSocket(onNewMessage) {
  const socketRef = useRef(null);
  const onNewMessageRef = useRef(onNewMessage);

  const [isConnected, setIsConnected] = useState(false);
  const [socketId, setSocketId] = useState("");
  const [socketError, setSocketError] = useState("");

  // نخزن أحدث نسخة من function استقبال الرسائل
  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    const socket = createChatSocket();
    socketRef.current = socket;

    const handleConnect = () => {
      console.log("Socket connected:", socket.id);

      setIsConnected(true);
      setSocketId(socket.id);
      setSocketError("");
    };

    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);

      setIsConnected(false);
      setSocketId("");
    };

    const handleConnectError = (error) => {
      console.log("Socket connection error:", error.message);

      setSocketError(error.message);
      setIsConnected(false);
    };

    const handleSocketError = (error) => {
      console.log("Socket error:", error);

      setSocketError(
        error?.message || "حدث خطأ في اتصال المحادثة",
      );
    };

    const handleException = (error) => {
      console.log("Socket exception:", error);

      setSocketError(
        error?.message || "حدث خطأ أثناء تنفيذ العملية",
      );
    };

    const handleNewMessage = (message) => {
      console.log("New message received:", message);

      onNewMessageRef.current?.(message);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("socketError", handleSocketError);
    socket.on("exception", handleException);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("socketError", handleSocketError);
      socket.off("exception", handleException);
      socket.off("newMessage", handleNewMessage);

      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const joinConversation = useCallback((conversationId) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      const numericConversationId = Number(conversationId);

      if (!socket?.connected) {
        reject(new Error("Socket is not connected"));
        return;
      }

      if (!numericConversationId || numericConversationId < 1) {
        reject(new Error("Invalid conversation ID"));
        return;
      }

      socket.emit(
        "joinConversation",
        {
          conversationId: numericConversationId,
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
    });
  }, []);

  const sendMessage = useCallback((conversationId, content) => {
    return new Promise((resolve, reject) => {
      const socket = socketRef.current;
      const cleanedContent = content.trim();

      if (!socket?.connected) {
        reject(new Error("Socket is not connected"));
        return;
      }

      if (!cleanedContent) {
        reject(new Error("Message cannot be empty"));
        return;
      }

      socket.emit(
        "sendMessage",
        {
          conversationId: Number(conversationId),
          content: cleanedContent,
        },
        (response) => {
          if (response?.success) {
            resolve(response.message);
            return;
          }

          reject(
            new Error(
              response?.message || "Could not send message",
            ),
          );
        },
      );
    });
  }, []);

  return {
    isConnected,
    socketId,
    socketError,
    joinConversation,
    sendMessage,
  };
}