import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../../../shared/utils/socketBaseUrl";

let socketInstance = null;
let activeConversationId = null;

export function getDisputeSocketInstance() {
  return socketInstance;
}

export function getActiveDisputeConversationId() {
  return activeConversationId;
}

export function setActiveDisputeConversationId(conversationId) {
  activeConversationId = conversationId ? Number(conversationId) : null;
}

export function connectDisputeSocket() {
  const token = localStorage.getItem("morafeq_access_token");
  if (!token) {
    disconnectDisputeSocket();
    return null;
  }

  if (socketInstance?.connected) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }

  socketInstance = io(`${getSocketBaseUrl()}/chat`, {
    auth: { token },
    withCredentials: true,
    transports: ["websocket"],
  });

  return socketInstance;
}

export function disconnectDisputeSocket() {
  activeConversationId = null;

  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
