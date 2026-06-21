import { useEffect, useState, useCallback } from "react";
import { aiApi } from "../services/aiApi";

const STORAGE_KEY = "morafeq_ai_assistant_state";

function loadSavedState() {
  if (typeof window === "undefined") {
    return { sessionId: null, messages: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sessionId: null, messages: [] };
    }

    const parsed = JSON.parse(raw);
    return {
      sessionId: parsed.sessionId || null,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    return { sessionId: null, messages: [] };
  }
}

function saveState(sessionId, messages) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessionId, messages }));
  } catch {
    // ignore localStorage errors
  }
}

export function useAiChat() {
  const [messages, setMessages] = useState(() => loadSavedState().messages);
  const [sessionId, setSessionId] = useState(() => loadSavedState().sessionId);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowWelcomeBubble(false), 4200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    saveState(sessionId, messages);
  }, [sessionId, messages]);

  const openSidebar = useCallback(() => {
    setIsOpen(true);
    setShowWelcomeBubble(false);
  }, []);

  const closeSidebar = useCallback(() => {
    setIsOpen(false);
  }, []);

  const sendMessage = useCallback(
    async (text) => {
      if (!text?.trim()) {
        return;
      }

      const userMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text,
        createdAt: new Date().toISOString(),
      };

      setMessages((current) => [...current, userMessage]);
      setError(null);
      setIsTyping(true);

      try {
        const response = await aiApi.askAssistant(text, sessionId);
        const assistantText =
          response?.data?.response || "تعذر الحصول على رد. حاول مرة أخرى.";
        const assistantMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: assistantText,
          createdAt: new Date().toISOString(),
        };

        setMessages((current) => [...current, assistantMessage]);
        if (response?.data?.sessionId) {
          setSessionId(response.data.sessionId);
        }
      } catch (err) {
        const errorMessage =
          err?.message || "تعذر الحصول على رد حالياً، يرجى المحاولة مرة أخرى.";
        const errorMessageItem = {
          id: `error-${Date.now()}`,
          role: "assistant",
          text: errorMessage,
          createdAt: new Date().toISOString(),
          isError: true,
        };

        setMessages((current) => [...current, errorMessageItem]);
        setError(errorMessage);
      } finally {
        setIsTyping(false);
      }
    },
    [sessionId],
  );

  return {
    messages,
    isOpen,
    openSidebar,
    closeSidebar,
    sendMessage,
    isTyping,
    error,
    showWelcomeBubble,
  };
}
