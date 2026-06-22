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
  listSessions() {
    return apiRequest("/rag/sessions");
  },
  getSession(sessionId) {
    return apiRequest(`/rag/sessions/${encodeURIComponent(sessionId)}`);
  },
  deleteSession(sessionId) {
    return apiRequest(`/rag/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  },
};
