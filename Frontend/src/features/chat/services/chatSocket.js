import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../../../shared/utils/socketBaseUrl";

export function createChatSocket() {
  return io(`${getSocketBaseUrl()}/chat`, {
    auth(callback) {
      callback({
        token: localStorage.getItem("morafeq_access_token"),
      });
    },
    withCredentials: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    transports: ["websocket"],
  });
}
