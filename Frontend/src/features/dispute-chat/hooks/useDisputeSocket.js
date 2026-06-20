import { useCallback, useEffect, useRef, useState } from "react";
import { translateErrorMessage } from "../../../shared/services/api";
import {
  connectDisputeSocket,
  disconnectDisputeSocket,
  getDisputeSocketInstance,
  setActiveDisputeConversationId,
} from "../services/disputeSocketManager";

export function useDisputeSocket({
  onNewMessage,
  onMessagesRead,
  enabled = true,
}) {
  const onNewMessageRef = useRef(onNewMessage);
  const onMessagesReadRef = useRef(onMessagesRead);
  const joinedConversationRef = useRef(null);

  const [isConnected, setIsConnected] = useState(false);
  const [socketError, setSocketError] = useState("");

  useEffect(() => {
    onNewMessageRef.current = onNewMessage;
  }, [onNewMessage]);

  useEffect(() => {
    onMessagesReadRef.current = onMessagesRead;
  }, [onMessagesRead]);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      return undefined;
    }

    const socket = connectDisputeSocket();
    if (!socket) return undefined;

    const handleConnect = () => {
      setIsConnected(true);
      setSocketError("");

      if (joinedConversationRef.current) {
        socket.emit(
          "joinDisputeConversation",
          { conversationId: joinedConversationRef.current },
          () => {},
        );
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (error) => {
      setSocketError(
        translateErrorMessage(error.message) || "تعذر الاتصال بمحادثة النزاع",
      );
      setIsConnected(false);
    };

    const handleSocketError = (error) => {
      setSocketError(
        translateErrorMessage(error?.message) || "حدث خطأ في اتصال النزاع",
      );
    };

    const handleNewDisputeMessage = (message) => {
      onNewMessageRef.current?.(message);
    };

    const handleDisputeMessagesRead = (event) => {
      onMessagesReadRef.current?.(event);
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.on("socketError", handleSocketError);
    socket.on("newDisputeMessage", handleNewDisputeMessage);
    socket.on("disputeMessagesRead", handleDisputeMessagesRead);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.off("socketError", handleSocketError);
      socket.off("newDisputeMessage", handleNewDisputeMessage);
      socket.off("disputeMessagesRead", handleDisputeMessagesRead);
    };
  }, [enabled]);

  const joinDisputeConversation = useCallback((conversationId) => {
    return new Promise((resolve, reject) => {
      const socket = getDisputeSocketInstance() ?? connectDisputeSocket();
      const numericId = Number(conversationId);

      if (!socket?.connected) {
        reject(new Error("الاتصال بمحادثة النزاع غير متاح حاليًا"));
        return;
      }

      if (!numericId || numericId < 1) {
        reject(new Error("رقم المحادثة غير صحيح"));
        return;
      }

      socket.emit(
        "joinDisputeConversation",
        { conversationId: numericId },
        (response) => {
          if (response?.success) {
            joinedConversationRef.current = numericId;
            setActiveDisputeConversationId(numericId);
            resolve(response);
            return;
          }

          reject(new Error(response?.message || "تعذر فتح محادثة النزاع"));
        },
      );
    });
  }, []);

  const sendDisputeMessage = useCallback((conversationId, content) => {
    return new Promise((resolve, reject) => {
      const socket = getDisputeSocketInstance() ?? connectDisputeSocket();
      const numericId = Number(conversationId);
      const cleanedContent = content.trim();

      if (!socket?.connected) {
        reject(new Error("الاتصال بمحادثة النزاع غير متاح حاليًا"));
        return;
      }

      if (!cleanedContent) {
        reject(new Error("لا يمكن إرسال رسالة فارغة"));
        return;
      }

      if (cleanedContent.length > 2000) {
        reject(new Error("الرسالة أطول من الحد المسموح"));
        return;
      }

      socket.emit(
        "sendDisputeMessage",
        { conversationId: numericId, content: cleanedContent },
        (response) => {
          if (response?.success) {
            resolve(response.message ?? response.data ?? response);
            return;
          }

          reject(new Error(response?.message || "تعذر إرسال الرسالة"));
        },
      );
    });
  }, []);

  const markDisputeMessagesAsRead = useCallback((conversationId) => {
    return new Promise((resolve, reject) => {
      const socket = getDisputeSocketInstance() ?? connectDisputeSocket();
      const numericId = Number(conversationId);

      if (!socket?.connected) {
        reject(new Error("الاتصال بمحادثة النزاع غير متاح حاليًا"));
        return;
      }

      socket.emit(
        "markDisputeMessagesAsRead",
        { conversationId: numericId },
        (response) => {
          if (response?.success !== false) {
            resolve(response);
            return;
          }

          reject(new Error(response?.message || "تعذر تعليم الرسائل كمقروءة"));
        },
      );
    });
  }, []);

  const leaveDisputeConversation = useCallback(() => {
    joinedConversationRef.current = null;
    setActiveDisputeConversationId(null);
  }, []);

  return {
    isConnected,
    socketError,
    joinDisputeConversation,
    sendDisputeMessage,
    markDisputeMessagesAsRead,
    leaveDisputeConversation,
    disconnectDisputeSocket,
  };
}
