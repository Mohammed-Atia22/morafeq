import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "../hooks/useNotifications";

function BellIcon({ className }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M15 17H9m9-1V11a6 6 0 1 0-12 0v5l-2 2h16l-2-2ZM10 20h4"
      />
    </svg>
  );
}

function typeIcon(type) {
  if (type?.includes("BOOKING")) return "ح";
  if (type?.includes("PAYMENT")) return "د";
  if (type?.includes("USER")) return "م";
  if (type?.includes("LISTING")) return "ع";
  return "ن";
}

function formatRelativeTime(value) {
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  const diffSeconds = Math.max(Math.floor((Date.now() - timestamp) / 1000), 0);

  if (diffSeconds < 60) return "الآن";

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `منذ ${diffMinutes} ${diffMinutes === 1 ? "دقيقة" : "دقائق"}`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `منذ ${diffHours} ${diffHours === 1 ? "ساعة" : "ساعات"}`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `منذ ${diffDays} ${diffDays === 1 ? "يوم" : "أيام"}`;
  }

  return new Date(value).toLocaleDateString("ar-EG", {
    month: "short",
    day: "numeric",
  });
}

export function NotificationBell({ enabled = true }) {
  const navigate = useNavigate();
  const panelRef = useRef(null);
  const [open, setOpen] = useState(false);
  const {
    notifications,
    meta,
    unreadCount,
    loading,
    loadingMore,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    loadMore,
  } = useNotifications({ enabled });

  useEffect(() => {
    if (!open) return undefined;

    const handlePointerDown = (event) => {
      if (!panelRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const handleToggle = () => {
    setOpen((current) => !current);
    fetchNotifications({ silent: true });
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
    } finally {
      setOpen(false);
      if (notification.link) {
        navigate(notification.link);
      }
    }
  };

  const hasMore = meta.page < meta.totalPages;

  return (
    <div ref={panelRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="relative grid h-10 w-10 place-items-center rounded-full text-[#172033] transition hover:bg-blue-50 hover:text-[#075fd6]"
        aria-label="الإشعارات"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute left-0 top-12 z-50 w-[min(92vw,24rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-right shadow-2xl"
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">الإشعارات</h3>
              <p className="mt-0.5 text-[11px] font-bold text-slate-400">
                {unreadCount > 0
                  ? `${unreadCount} غير مقروءة`
                  : "كل الإشعارات مقروءة"}
              </p>
            </div>
            <button
              type="button"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="rounded-lg px-3 py-1.5 text-[11px] font-black text-[#075fd6] transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
            >
              تعليم الكل كمقروء
            </button>
          </div>

          <div className="max-h-[28rem] overflow-y-auto">
            {loading ? (
              <div className="flex h-28 items-center justify-center">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="px-4 py-8 text-center text-xs font-bold text-red-500">
                {error}
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm font-bold text-slate-400">
                لا توجد إشعارات جديدة.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex w-full gap-3 px-4 py-3 text-right transition hover:bg-blue-50/60 ${
                      notification.isRead ? "bg-white" : "bg-blue-50"
                    }`}
                  >
                    <span
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-black ${
                        notification.isRead
                          ? "bg-slate-100 text-slate-500"
                          : "bg-[#075fd6] text-white"
                      }`}
                    >
                      {typeIcon(notification.type)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-start justify-between gap-2">
                        <span className="line-clamp-1 text-xs font-black text-slate-900">
                          {notification.title}
                        </span>
                        <span className="shrink-0 text-[10px] font-bold text-slate-400">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 text-[11px] font-semibold leading-5 text-slate-500">
                        {notification.message}
                      </span>
                      {!notification.isRead && (
                        <span className="mt-2 inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black text-[#075fd6]">
                          غير مقروء
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {hasMore && (
            <div className="border-t border-slate-100 p-3">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="h-9 w-full rounded-lg border border-slate-200 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {loadingMore ? "جاري التحميل..." : "عرض المزيد"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
