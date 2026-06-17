export function ConversationList({
  conversations,
  selectedConversationId,
  isLoading,
  onSelectConversation,
}) {
  return (
    <aside className="border-l border-slate-200 bg-slate-50">
      <div className="border-b border-slate-200 p-5">
        <h1 className="text-2xl font-black text-slate-900">
          الرسائل
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          تواصل مع المستخدمين حول العقارات
        </p>
      </div>

      <div className="h-[calc(100%-98px)] overflow-y-auto">
        {isLoading ? (
          <p className="p-5 text-sm text-slate-500">
            جاري تحميل المحادثات...
          </p>
        ) : conversations.length === 0 ? (
          <div className="p-6 text-center">
            <p className="font-bold text-slate-700">
              لا توجد محادثات
            </p>

            <p className="mt-2 text-sm text-slate-500">
              ستظهر المحادثات هنا عند بدء التواصل.
            </p>
          </div>
        ) : (
          conversations.map((conversation) => {
            const isSelected =
              conversation.id === selectedConversationId;

            const otherUserName =
              `${conversation.otherUser?.firstName ?? ""} ${
                conversation.otherUser?.lastName ?? ""
              }`.trim();

            return (
              <button
                key={conversation.id}
                type="button"
                onClick={() =>
                  onSelectConversation(conversation.id)
                }
                className={`flex w-full gap-3 border-b border-slate-200 p-4 text-right transition ${
                  isSelected
                    ? "bg-blue-50"
                    : "hover:bg-white"
                }`}
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-100 font-black text-blue-700">
                  {conversation.otherUser?.avatarUrl ? (
                    <img
                      src={conversation.otherUser.avatarUrl}
                      alt={otherUserName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    conversation.otherUser?.firstName?.[0] ??
                    "م"
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate font-black text-slate-900">
                      {otherUserName || "مستخدم"}
                    </p>

                    {conversation.unreadCount > 0 && (
                      <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-blue-600 px-2 text-xs font-bold text-white">
                        {conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  <p className="mt-1 truncate text-xs font-semibold text-blue-700">
                    {conversation.listing?.title}
                  </p>

                  <p className="mt-1 truncate text-sm text-slate-500">
                    {conversation.lastMessage?.content ??
                      "لا توجد رسائل بعد"}
                  </p>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}