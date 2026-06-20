import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { disputeChatApi } from "../services/disputeChatApi";
import { formatDisputeDate } from "../utils/disputeMessageUtils";
import { getDisputeStatusLabel } from "../utils/disputeStatusLabels";

export function MyDisputeConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await disputeChatApi.getMyConversations();
        if (active) {
          setConversations(result.data ?? []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || "تعذر تحميل محادثات النزاع");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div dir="rtl" className="mx-auto max-w-4xl space-y-5 px-4 py-6">
      <div>
        <h1 className="text-xl font-black text-[#0f172a]">محادثات النزاع</h1>
        <p className="mt-1 text-sm text-slate-500">
          تواصل مع إدارة المنصة بخصوص النزاعات المفتوحة
        </p>
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#1752F0] border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-600">{error}</div>
      ) : conversations.length === 0 ? (
        <div className="rounded-2xl bg-white py-16 text-center ring-1 ring-slate-100">
          <p className="text-sm font-semibold text-slate-600">لا توجد محادثات نزاع</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conversation) => {
            const cover = conversation.booking?.listing?.photos?.[0]?.url;
            const lastMessage = conversation.lastMessage;

            return (
              <Link
                key={conversation.id}
                to={`/dispute-chat/${conversation.id}`}
                className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-100 transition hover:shadow-md"
              >
                {cover ? (
                  <img src={cover} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="grid h-16 w-16 place-items-center rounded-xl bg-slate-100 text-2xl">
                    💬
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-sm font-black text-slate-900">
                      {conversation.booking?.listing?.title ?? "محادثة نزاع"}
                    </h2>
                    {conversation.isClosed && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                        مغلقة
                      </span>
                    )}
                    {conversation.unreadCount > 0 && (
                      <span className="rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-black text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {getDisputeStatusLabel(conversation.booking?.status)}
                  </p>
                  {lastMessage && (
                    <p className="mt-1 truncate text-xs text-slate-600">
                      {lastMessage.content}
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-slate-400">
                    {formatDisputeDate(lastMessage?.createdAt ?? conversation.updatedAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
