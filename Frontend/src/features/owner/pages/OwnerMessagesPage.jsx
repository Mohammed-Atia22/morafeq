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
      className="flex h-[calc(100vh-7rem)] min-h-[560px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm max-sm:min-h-[calc(100vh-7rem)]"
    >
      <div className="grid h-full w-full min-w-0 grid-cols-1 lg:grid-cols-[340px_minmax(0,1fr)]">
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
