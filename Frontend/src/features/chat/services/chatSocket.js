import { io } from "socket.io-client";
import { getSocketBaseUrl } from "../../../shared/utils/socketBaseUrl";

export function createChatSocket() {
  const token = localStorage.getItem("morafeq_access_token");

  return io(`${getSocketBaseUrl()}/chat`, {
    auth: {
      token,
    },
    withCredentials: true,
    transports: ["websocket"],
  });
}