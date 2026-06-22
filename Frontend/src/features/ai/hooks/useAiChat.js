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
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [activeSessionLoading, setActiveSessionLoading] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showWelcomeBubble, setShowWelcomeBubble] = useState(true);

  const refreshSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const response = await aiApi.listSessions();
      setSessions(Array.isArray(response?.data) ? response.data : []);
    } catch {
      setSessions([]);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setShowWelcomeBubble(false), 4200);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    refreshSessions();
  }, [refreshSessions]);

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
        refreshSessions();
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
    [refreshSessions, sessionId],
  );

  const startNewChat = useCallback(() => {
    setSessionId(null);
    setMessages([]);
    setError(null);
    setIsTyping(false);
  }, []);

  const selectSession = useCallback(async (nextSessionId) => {
    setSessionId(nextSessionId);
    setError(null);
    setIsTyping(false);
    setActiveSessionLoading(true);

    try {
      const response = await aiApi.getSession(nextSessionId);
      const loadedMessages = Array.isArray(response?.data?.messages)
        ? response.data.messages
        : [];
      setMessages(loadedMessages);
    } catch (err) {
      setMessages([]);
      setError(
        err?.message || "تعذر تحميل المحادثة، يرجى المحاولة مرة أخرى.",
      );
    } finally {
      setActiveSessionLoading(false);
    }
  }, []);

  const deleteSession = useCallback(
    async (sessionToDelete) => {
      const previousSessions = sessions;
      setDeletingSessionId(sessionToDelete);
      setSessions((current) =>
        current.filter((session) => session.sessionId !== sessionToDelete),
      );

      try {
        await aiApi.deleteSession(sessionToDelete);
        if (sessionToDelete === sessionId) {
          startNewChat();
        }
      } catch (err) {
        setSessions(previousSessions);
        setError(
          err?.message || "تعذر حذف المحادثة، يرجى المحاولة مرة أخرى.",
        );
      } finally {
        setDeletingSessionId(null);
      }
    },
    [sessionId, sessions, startNewChat],
  );

  return {
    messages,
    sessionId,
    sessions,
    sessionsLoading,
    activeSessionLoading,
    deletingSessionId,
    isOpen,
    openSidebar,
    closeSidebar,
    sendMessage,
    startNewChat,
    selectSession,
    deleteSession,
    isTyping,
    error,
    showWelcomeBubble,
  };
}
