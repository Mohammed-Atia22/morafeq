import { apiRequest } from "../../../shared/services/api";

function chatRequest(path, options = {}) {
  return apiRequest(path, options);
}

export const chatApi = {
  createConversation(listingId) {
    return chatRequest("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({
        listingId,
      }),
    });
  },

  getConversations() {
    return chatRequest("/chat/conversations", {
      method: "GET",
    });
  },

  getMessages(conversationId) {
    return chatRequest(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "GET",
      },
    );
  },

  markAsRead(conversationId) {
    return chatRequest(
      `/chat/conversations/${conversationId}/read`,
      {
        method: "PATCH",
      },
    );
  },

  sendMessage(payload) {
    return chatRequest("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};
