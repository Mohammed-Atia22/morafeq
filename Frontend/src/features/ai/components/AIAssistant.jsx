import { AIFloatingButton } from "./AIFloatingButton";
import { AISidebar } from "./AISidebar";
import { useAiChat } from "../hooks/useAiChat";

export function AIAssistant() {
  const {
    messages,
    isOpen,
    openSidebar,
    closeSidebar,
    sendMessage,
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
        onSend={sendMessage}
        isTyping={isTyping}
        error={error}
      />
    </>
  );
}
