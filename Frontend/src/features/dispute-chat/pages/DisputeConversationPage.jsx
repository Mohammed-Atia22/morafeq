import { useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../auth/hooks/useAuth";
import { disputeChatApi } from "../services/disputeChatApi";
import { DisputePrivateChatPanel } from "../components/DisputePrivateChatPanel";

function getDisputeChatBasePath(role) {
  if (role === "HOST") return "/owner/dispute-chat";
  if (role === "GUEST") return "/expatriate/dispute-chat";
  return "/dispute-chat";
}

export function DisputeConversationPage() {
  const { conversationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const basePath = getDisputeChatBasePath(user?.role);

  const fetchMessages = useCallback(
    (id, params) => disputeChatApi.getMyConversationMessages(id, params),
    [],
  );

  const sendRestMessage = useCallback(
    (id, content) => disputeChatApi.sendMyMessage(id, content),
    [],
  );

  const handleForbidden = useCallback(
    (error) => {
      if (error?.message?.includes("403") || error?.message?.includes("Forbidden")) {
        navigate(basePath, { replace: true });
      }
    },
    [basePath, navigate],
  );

  const wrappedFetch = useCallback(
    async (id, params) => {
      try {
        return await fetchMessages(id, params);
      } catch (error) {
        handleForbidden(error);
        throw error;
      }
    },
    [fetchMessages, handleForbidden],
  );

  return (
    <div dir="rtl" className="mx-auto max-w-3xl space-y-4 px-4 py-6">
      <Link to={basePath} className="text-xs font-bold text-[#1752F0]">
        ← العودة للمحادثات
      </Link>

      <DisputePrivateChatPanel
        conversationId={conversationId}
        fetchMessages={wrappedFetch}
        sendRestMessage={sendRestMessage}
        title="محادثة النزاع مع الإدارة"
        showSender
      />
    </div>
  );
}
