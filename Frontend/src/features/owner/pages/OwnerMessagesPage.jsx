import { ConversationList } from "../../chat/components/ConversationList";
import { ChatWindow } from "../../chat/components/ChatWindow";
import { useChatPage } from "../../chat/hooks/useChatPage";

export function OwnerMessagesPage() {
  const {
    user,
    conversations,
    selectedConversation,
    selectedConversationId,
    messages,
    content,

    isConnected,
    socketError,
    isLoadingConversations,
    isLoadingMessages,
    isSending,
    error,

    setContent,
    selectConversation,
    submitMessage,
  } = useChatPage();

  return (
    <div
      dir="rtl"
      className="flex h-full min-h-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      <div className="grid h-full grid-cols-1 lg:grid-cols-[340px_1fr]">
        <ConversationList
          conversations={conversations}
          selectedConversationId={
            selectedConversationId
          }
          isLoading={
            isLoadingConversations
          }
          onSelectConversation={
            selectConversation
          }
        />

        <ChatWindow
          selectedConversation={
            selectedConversation
          }
          messages={messages}
          isLoadingMessages={
            isLoadingMessages
          }
          currentUserId={user?.id}
          isConnected={isConnected}
          content={content}
          error={error}
          socketError={socketError}
          isSending={isSending}
          onContentChange={setContent}
          onSendMessage={submitMessage}
        />
      </div>
    </div>
  );
}