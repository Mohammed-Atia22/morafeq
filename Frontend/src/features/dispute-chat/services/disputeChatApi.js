import { apiRequest } from "../../../shared/services/api";

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.set(key, String(value));
    }
  });
  const qs = query.toString();
  return qs ? `?${qs}` : "";
}

export const disputeChatApi = {
  getMyConversations: () => apiRequest("/dispute-chat/conversations"),

  getMyConversationMessages: (conversationId, params = {}) =>
    apiRequest(
      `/dispute-chat/conversations/${conversationId}/messages${buildQuery(params)}`,
    ),

  sendMyMessage: (conversationId, content) =>
    apiRequest(`/dispute-chat/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};
