import { AIFloatingButton } from "./AIFloatingButton";
import { AISidebar } from "./AISidebar";
import { useAiChat } from "../hooks/useAiChat";
import { useAuth } from "../../auth/hooks/useAuth";

function AuthenticatedAIAssistant() {
  const {
    messages,
    sessionId,
    sessions,
    sessionsLoading,
    activeSessionLoading,
    deletingSessionId,
    isOpen,
    openSidebar,
    closeSidebar,
    sendMessage,
    startNewChat,
    selectSession,
    deleteSession,
    isTyping,
    error,
    showWelcomeBubble,
  } = useAiChat();

  return (
    <>
      <AIFloatingButton
        isOpen={isOpen}
        onClick={openSidebar}
        showWelcomeBubble={showWelcomeBubble}
      />
      <AISidebar
        isOpen={isOpen}
        onClose={closeSidebar}
        messages={messages}
        sessionId={sessionId}
        sessions={sessions}
        sessionsLoading={sessionsLoading}
        activeSessionLoading={activeSessionLoading}
        deletingSessionId={deletingSessionId}
        onSend={sendMessage}
        onNewChat={startNewChat}
        onSelectSession={selectSession}
        onDeleteSession={deleteSession}
        isTyping={isTyping}
        error={error}
      />
    </>
  );
}

export function AIAssistant() {
  const { isAuthenticated, isUserLoading } = useAuth();

  if (isUserLoading || !isAuthenticated) {
    return null;
  }

  return <AuthenticatedAIAssistant />;
}
