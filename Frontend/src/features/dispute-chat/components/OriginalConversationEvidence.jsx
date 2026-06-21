import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../admin/services/adminApi";
import { usePaginatedDisputeMessages } from "../hooks/usePaginatedDisputeMessages";
import { DisputeMessageList } from "./DisputeMessageList";
import { formatDisputeDate, getSenderDisplayName } from "../utils/disputeMessageUtils";

export function OriginalConversationEvidence({ bookingId }) {
  const fetchPage = useCallback(
    (page, limit) => adminApi.getOriginalDisputeMessages(bookingId, { page, limit }),
    [bookingId],
  );

  const {
    messages,
    loading,
    loadingMore,
    error,
    loadOlder,
    hasOlder,
  } = usePaginatedDisputeMessages({
    fetchPage,
    enabled: Boolean(bookingId),
    limit: 20,
  });

  const [hasConversation, setHasConversation] = useState(true);

  useEffect(() => {
    adminApi
      .getOriginalDisputeMessages(bookingId, { page: 1, limit: 1 })
      .then((result) => setHasConversation(Boolean(result.conversation)))
      .catch(() => setHasConversation(false));
  }, [bookingId]);

  return (
    <div dir="rtl" className="rounded-2xl bg-white p-5 ring-1 ring-slate-100">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-black text-[#0f172a]">
            المحادثة الأصلية (أدلة فقط)
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            هذه المحادثة بين المستأجر وصاحب السكن للقراءة فقط
          </p>
        </div>
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
          للقراءة فقط
        </span>
      </div>

      {!hasConversation ? (
        <div className="rounded-xl bg-slate-50 py-10 text-center text-sm font-semibold text-slate-500">
          لا توجد محادثة أصلية مسجلة لهذا النزاع
        </div>
      ) : (
        <>
          {error && (
            <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</p>
          )}
          <div className="space-y-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className="rounded-xl border border-slate-100 bg-slate-50 p-3"
              >
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-bold text-slate-700">
                    {getSenderDisplayName(message.sender)}
                    {message.senderType && (
                      <span className="mr-2 text-slate-400">
                        ({message.senderType === "GUEST" ? "مستأجر" : message.senderType === "HOST" ? "مالك" : message.senderType})
                      </span>
                    )}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {formatDisputeDate(message.createdAt)}
                  </span>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700">
                  {message.content}
                </p>
              </div>
            ))}
          </div>
          {hasOlder && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={loadOlder}
                disabled={loadingMore}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600"
              >
                {loadingMore ? "جاري التحميل..." : "تحميل رسائل أقدم"}
              </button>
            </div>
          )}
          {loading && messages.length === 0 && (
            <div className="flex h-32 items-center justify-center">
              <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#1752F0] border-t-transparent" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
