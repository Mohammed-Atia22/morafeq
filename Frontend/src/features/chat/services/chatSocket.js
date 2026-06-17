import { io } from "socket.io-client";

export function createChatSocket() {
  const token = localStorage.getItem("morafeq_access_token");

  return io("http://localhost:3001/chat", {
    auth: {
      token,
    },
    withCredentials: true,
    transports: ["websocket"],
  });
}