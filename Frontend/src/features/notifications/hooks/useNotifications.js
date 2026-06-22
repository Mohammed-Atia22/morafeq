import { useCallback, useEffect, useRef, useState } from "react";
import { notificationsApi } from "../services/notificationsApi";

const POLL_INTERVAL_MS = 15000;
const PAGE_LIMIT = 10;

const mergeUniqueById = (incoming, existing = []) => {
  const byId = new Map();

  [...incoming, ...existing].forEach((notification) => {
    byId.set(notification.id, notification);
  });

  return Array.from(byId.values()).sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

export function useNotifications({ enabled = true } = {}) {
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: PAGE_LIMIT,
    total: 0,
    totalPages: 1,
    unreadCount: 0,
  });
  const [loading, setLoading] = useState(Boolean(enabled));
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const fetchNotifications = useCallback(
    async ({ page = 1, append = false, silent = false } = {}) => {
      if (!enabled) return;

      try {
        if (!silent && append) {
          setLoadingMore(true);
        } else if (!silent) {
          setLoading(true);
        }

        setError(null);
        const response = await notificationsApi.getNotifications({
          page,
          limit: PAGE_LIMIT,
        });

        if (!mountedRef.current) return;

        setNotifications((current) =>
          append
            ? mergeUniqueById(response.data || [], current)
            : mergeUniqueById(response.data || []),
        );
        setMeta(response.meta || {});
      } catch (caughtError) {
        if (mountedRef.current) {
          setError(caughtError.message || "تعذر تحميل الإشعارات");
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [enabled],
  );

  useEffect(() => {
    if (!enabled) {
      setNotifications([]);
      setMeta((current) => ({ ...current, unreadCount: 0 }));
      setLoading(false);
      return undefined;
    }

    fetchNotifications();
    const intervalId = window.setInterval(() => {
      fetchNotifications({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [enabled, fetchNotifications]);

  const markAsRead = useCallback(async (notificationId) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
    setMeta((current) => ({
      ...current,
      unreadCount: Math.max(Number(current.unreadCount || 0) - 1, 0),
    }));

    await notificationsApi.markAsRead(notificationId);
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true })),
    );
    setMeta((current) => ({ ...current, unreadCount: 0 }));

    await notificationsApi.markAllAsRead();
  }, []);

  const loadMore = useCallback(() => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    fetchNotifications({ page: meta.page + 1, append: true });
  }, [fetchNotifications, loadingMore, meta.page, meta.totalPages]);

  return {
    notifications,
    meta,
    unreadCount: Number(meta.unreadCount || 0),
    loading,
    loadingMore,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
  };
}
