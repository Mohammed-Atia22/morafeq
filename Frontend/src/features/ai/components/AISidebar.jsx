import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "../../auth/hooks/useAuth";
import { ChatInput } from "./ChatInput";
import { ChatMessage } from "./ChatMessage";
import { TypingIndicator } from "./TypingIndicator";

const SUGGESTED_PROMPTS = [
  "ابحث عن سكن في القاهرة بميزانية 4000 جنيه",
  "اعرض أرخص السكنات المتاحة حالياً",
  "أريد غرفة خاصة مفروشة مع إنترنت",
  "أريد سكن في القاهرة مع زملاء سكن متوافقين معي",
  "اعرض أحدث السكنات المتاحة",
  "ابحث عن سكن قريب من الجامعة",
];

function truncateTitle(title = "") {
  return title.length > 42 ? `${title.slice(0, 42)}...` : title;
}

function getRelativeTime(value) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(date.getTime())) return "";
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)} hours ago`;
  return date.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });
}

function groupSessions(sessions) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);
  const startOfPrevious7Days = new Date(startOfToday);
  startOfPrevious7Days.setDate(startOfPrevious7Days.getDate() - 7);

  const groups = [
    { key: "today", label: "اليوم", items: [] },
    { key: "yesterday", label: "أمس", items: [] },
    { key: "previous7", label: "آخر 7 أيام", items: [] },
    { key: "older", label: "أقدم", items: [] },
  ];

  sessions.forEach((session) => {
    const updatedAt = new Date(session.updatedAt);

    if (updatedAt >= startOfToday) {
      groups[0].items.push(session);
    } else if (updatedAt >= startOfYesterday) {
      groups[1].items.push(session);
    } else if (updatedAt >= startOfPrevious7Days) {
      groups[2].items.push(session);
    } else {
      groups[3].items.push(session);
    }
  });

  return groups.filter((group) => group.items.length > 0);
}

function SessionSkeletons() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-14 animate-pulse rounded-2xl bg-slate-100"
        />
      ))}
    </div>
  );
}

function MessageSkeletons() {
  return (
    <div className="space-y-4 px-4 py-6">
      <div className="h-16 w-2/3 animate-pulse rounded-3xl bg-white shadow-sm" />
      <div className="mr-auto h-20 w-4/5 animate-pulse rounded-3xl bg-white shadow-sm" />
      <div className="h-14 w-1/2 animate-pulse rounded-3xl bg-white shadow-sm" />
    </div>
  );
}

function LandingScreen({ onPromptClick, disabled }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-3xl text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl bg-[#4f5be8] text-lg font-black text-white shadow-xl shadow-[#4f5be8]/20">
          AI
        </div>
        <h1 className="mx-auto mt-5 max-w-2xl text-2xl font-black leading-10 text-slate-950 sm:text-3xl">
          كيف يمكنني مساعدتك في العثور على السكن المناسب؟
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-500">
          يمكنني مساعدتك في العثور على السكن المناسب، مقارنة الخيارات،
          واقتراح السكنات التي تحتوي على زملاء سكن متوافقين معك.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              disabled={disabled}
              onClick={() => onPromptClick(prompt)}
              className="min-h-24 rounded-2xl border border-slate-200 bg-white p-4 text-right text-sm font-bold leading-6 text-slate-700 shadow-sm transition hover:-translate-y-1 hover:border-[#4f5be8] hover:shadow-lg hover:shadow-slate-900/10 focus:outline-none focus:ring-2 focus:ring-[#4f5be8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AISidebar({
  isOpen,
  onClose,
  messages,
  sessionId,
  sessions = [],
  sessionsLoading,
  activeSessionLoading,
  deletingSessionId,
  onSend,
  onNewChat,
  onSelectSession,
  onDeleteSession,
  isTyping,
  error,
}) {
  const { user } = useAuth();
  const messagesRef = useRef(null);
  const [menuSessionId, setMenuSessionId] = useState(null);
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [composerPrefill, setComposerPrefill] = useState("");

  const groupedSessions = useMemo(() => groupSessions(sessions), [sessions]);
  const hasMessages = messages.length > 0;

  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [messages, isTyping, activeSessionLoading]);

  useEffect(() => {
    if (!isOpen) {
      setMenuSessionId(null);
      setSessionToDelete(null);
    }
  }, [isOpen]);

  const handleSelectSession = async (nextSessionId) => {
    await onSelectSession(nextSessionId);
    setMenuSessionId(null);
  };

  const handleNewChat = () => {
    onNewChat();
    setMenuSessionId(null);
  };

  const handleConfirmDelete = async () => {
    if (!sessionToDelete) return;
    const deletedSessionId = sessionToDelete.sessionId;
    setSessionToDelete(null);
    setMenuSessionId(null);
    await onDeleteSession(deletedSessionId);
  };

  const handleSuggestedPrompt = async (prompt) => {
    setComposerPrefill(prompt);
    await onSend(prompt);
    setComposerPrefill("");
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-950/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <section
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-full max-w-[980px] flex-col overflow-hidden bg-[#f7f8fb] shadow-2xl transition-transform duration-300 ease-in-out md:w-[92vw] ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        dir="rtl"
        aria-label="Morafeq AI chat"
      >
        <div className="flex h-full min-h-0 flex-col md:flex-row">
          <aside className="flex max-h-[42vh] min-h-0 flex-col border-b border-slate-200 bg-white md:max-h-none md:w-[300px] md:border-b-0 md:border-l">
            <div className="border-b border-slate-100 p-4">
              <button
                type="button"
                onClick={handleNewChat}
                aria-label="Start new chat"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#4f5be8] px-4 py-3 text-sm font-black text-white transition hover:bg-[#3c47d5] focus:outline-none focus:ring-2 focus:ring-[#4f5be8] focus:ring-offset-2"
              >
                <span className="text-lg leading-none">+</span>
                محادثة جديدة
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
              {sessionsLoading ? (
                <SessionSkeletons />
              ) : groupedSessions.length > 0 ? (
                <div className="space-y-5">
                  {groupedSessions.map((group) => (
                    <div key={group.key}>
                      <h3 className="mb-2 px-2 text-[11px] font-black uppercase tracking-wide text-slate-400">
                        {group.label}
                      </h3>
                      <div className="space-y-1.5">
                        {group.items.map((session) => {
                          const isActive = session.sessionId === sessionId;
                          const isDeleting =
                            deletingSessionId === session.sessionId;

                          return (
                            <div
                              key={session.sessionId}
                              className={`group relative rounded-2xl border transition ${
                                isActive
                                  ? "border-[#4f5be8]/40 bg-[#eef2ff] shadow-sm"
                                  : "border-transparent hover:border-slate-200 hover:bg-slate-50"
                              } ${isDeleting ? "opacity-50" : ""}`}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  handleSelectSession(session.sessionId)
                                }
                                className="block w-full min-w-0 rounded-2xl px-3 py-2.5 text-right focus:outline-none focus:ring-2 focus:ring-[#4f5be8]"
                              >
                                <span className="block truncate text-sm font-bold text-slate-800">
                                  {truncateTitle(session.title)}
                                </span>
                                <span className="mt-1 block text-xs font-semibold text-slate-400">
                                  {getRelativeTime(session.updatedAt)}
                                </span>
                              </button>

                              <button
                                type="button"
                                aria-label="Conversation actions"
                                onClick={() =>
                                  setMenuSessionId((current) =>
                                    current === session.sessionId
                                      ? null
                                      : session.sessionId,
                                  )
                                }
                                className="absolute left-2 top-2 rounded-full px-2 py-1 text-slate-400 opacity-100 transition hover:bg-white hover:text-slate-700 md:opacity-0 md:group-hover:opacity-100"
                              >
                                ...
                              </button>

                              {menuSessionId === session.sessionId && (
                                <div className="absolute left-2 top-9 z-10 w-36 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 text-sm shadow-xl">
                                  <button
                                    type="button"
                                    disabled
                                    className="block w-full px-3 py-2 text-right font-semibold text-slate-400"
                                  >
                                    إعادة تسمية
                                  </button>
                                  <button
                                    type="button"
                                    aria-label="Delete conversation"
                                    onClick={() => setSessionToDelete(session)}
                                    className="block w-full px-3 py-2 text-right font-bold text-rose-600 hover:bg-rose-50"
                                  >
                                    حذف المحادثة
                                  </button>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 p-4 text-center text-sm font-semibold text-slate-500">
                  لا توجد محادثات محفوظة بعد.
                </div>
              )}
            </div>

            <div className="border-t border-slate-100 p-4">
              <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#4f5be8] text-sm font-black text-white">
                  {user?.firstName?.[0] || "م"}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-black text-slate-800">
                    {[user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
                      "مستخدم مرافق"}
                  </p>
                  <p className="text-xs font-semibold text-slate-400">
                    سجل محادثاتك محفوظ
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#4f5be8]/10 text-sm font-black text-[#4f5be8]">
                  AI
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900">
                    رفيق
                  </h2>
                  <p className="text-xs font-semibold text-slate-500">
                    مساعد السكن والتوافق في مرافق
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close assistant"
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#4f5be8]"
              >
                إغلاق
              </button>
            </header>

            <div
              ref={messagesRef}
              className="min-h-0 flex-1 overflow-y-auto bg-[#f7f8fb]"
            >
              {activeSessionLoading ? (
                <MessageSkeletons />
              ) : hasMessages ? (
                <div className="space-y-4 px-4 py-6 transition-opacity duration-200">
                  {messages.map((message) => (
                    <ChatMessage key={message.id} message={message} />
                  ))}
                  {isTyping && <TypingIndicator />}
                </div>
              ) : (
                <LandingScreen
                  onPromptClick={handleSuggestedPrompt}
                  disabled={isTyping}
                />
              )}
            </div>

            <div className="border-t border-slate-200 bg-white/95 px-4 py-4 backdrop-blur">
              {error && (
                <div className="mb-3 rounded-2xl bg-rose-50 px-3 py-3 text-sm font-semibold text-rose-700">
                  {error}
                </div>
              )}
              <ChatInput
                onSend={onSend}
                disabled={isTyping}
                initialValue={composerPrefill}
              />
            </div>
          </main>
        </div>
      </section>

      {sessionToDelete && (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/50 px-4">
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-5 text-right shadow-2xl"
            dir="rtl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-chat-title"
          >
            <h3
              id="delete-chat-title"
              className="text-lg font-black text-slate-950"
            >
              حذف المحادثة؟
            </h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
              لن تتمكن من استعادة هذه المحادثة بعد حذفها.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSessionToDelete(null)}
                className="rounded-2xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-2xl bg-rose-600 px-4 py-2 text-sm font-black text-white transition hover:bg-rose-700"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
