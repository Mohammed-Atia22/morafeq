import { createContext, useContext, useCallback, useEffect, useState, useRef } from "react";
import { chatApi } from "../services/chatApi";

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Refs for deduplication and initialization
  const isLoadingRef = useRef(false);
  const initializedRef = useRef(false);
  const lastFetchTimeRef = useRef(0);
  const MIN_FETCH_INTERVAL = 5000; // Minimum 5 seconds between fetches

  // Calculate unread count from conversations
  const unreadCount = conversations.reduce(
    (total, conversation) => total + Number(conversation.unreadCount ?? 0),
    0
  );

  // Load conversations with deduplication
  const loadConversations = useCallback(async (force = false) => {
    // Prevent concurrent requests
    if (isLoadingRef.current && !force) {
      return;
    }

    // Rate limiting - prevent rapid successive calls
    const now = Date.now();
    if (!force && now - lastFetchTimeRef.current < MIN_FETCH_INTERVAL) {
      return;
    }

    try {
      isLoadingRef.current = true;
      lastFetchTimeRef.current = now;
      setIsLoading(true);
      setError(null);

      const data = await chatApi.getConversations();
      setConversations(data);
    } catch (err) {
      // Handle 429 errors specifically
      if (err.response?.status === 429) {
        console.warn("Rate limited - too many conversation requests");
        setError("rate_limited");
      } else {
        console.error("Failed to load conversations:", err);
        setError(err.message || "Failed to load conversations");
      }
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  // Refresh conversations (for manual refresh or after specific actions)
  const refreshConversations = useCallback(() => {
    return loadConversations(true);
  }, [loadConversations]);

  // Initial load with React Strict Mode guard
  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    initializedRef.current = true;
    loadConversations();
  }, [loadConversations]);

  // Listen for chat-unread-changed events to refresh
  useEffect(() => {
    const handleUnreadChanged = () => {
      // Debounce the refresh to avoid rapid successive calls
      const now = Date.now();
      if (now - lastFetchTimeRef.current >= MIN_FETCH_INTERVAL) {
        loadConversations();
      }
    };

    window.addEventListener("chat-unread-changed", handleUnreadChanged);

    return () => {
      window.removeEventListener("chat-unread-changed", handleUnreadChanged);
    };
  }, [loadConversations]);

  const value = {
    conversations,
    setConversations,
    unreadCount,
    isLoading,
    error,
    loadConversations,
    refreshConversations,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
