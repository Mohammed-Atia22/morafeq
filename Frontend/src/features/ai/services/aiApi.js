import { apiRequest } from "../../../shared/services/api";

export const aiApi = {
  askAssistant(query, sessionId) {
    const queryString = sessionId
      ? `?sessionId=${encodeURIComponent(sessionId)}`
      : "";

    return apiRequest(`/rag/ask${queryString}`, {
      method: "POST",
      body: JSON.stringify({ query }),
    });
  },
};
