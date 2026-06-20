import { useCallback, useEffect, useRef, useState } from "react";
import {
  dedupeMessagesById,
  prependOlderMessages,
} from "../utils/disputeMessageUtils";

export function usePaginatedDisputeMessages({
  fetchPage,
  enabled = true,
  limit = 50,
}) {
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [meta, setMeta] = useState({
    page: 1,
    totalPages: 1,
    hasNextPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const conversationRef = useRef(null);

  const loadInitial = useCallback(async () => {
    if (!enabled || !fetchPage) return;

    setLoading(true);
    setError("");

    try {
      const result = await fetchPage(1, limit);
      conversationRef.current = result.conversation ?? null;
      setConversation(result.conversation ?? null);
      setMessages(dedupeMessagesById(result.data ?? []));
      setMeta(result.meta ?? { page: 1, totalPages: 1, hasNextPage: false });
    } catch (err) {
      setError(err.message || "تعذر تحميل الرسائل");
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [enabled, fetchPage, limit]);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  const loadOlder = useCallback(async () => {
    if (!enabled || !fetchPage || loadingMore || !meta.hasNextPage) return;

    setLoadingMore(true);
    setError("");

    try {
      const nextPage = (meta.page ?? 1) + 1;
      const result = await fetchPage(nextPage, limit);
      setMessages((current) =>
        prependOlderMessages(current, result.data ?? []),
      );
      setMeta(result.meta ?? meta);
    } catch (err) {
      setError(err.message || "تعذر تحميل الرسائل الأقدم");
    } finally {
      setLoadingMore(false);
    }
  }, [enabled, fetchPage, limit, loadingMore, meta]);

  return {
    messages,
    setMessages,
    meta,
    conversation,
    loading,
    loadingMore,
    error,
    loadInitial,
    loadOlder,
    hasOlder: Boolean(meta.hasNextPage),
  };
}
