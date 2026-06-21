export function sortMessagesChronologically(messages = []) {
  return [...messages].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export function dedupeMessagesById(messages = []) {
  const map = new Map();
  messages.forEach((message) => {
    if (message?.id != null) {
      map.set(message.id, message);
    }
  });
  return sortMessagesChronologically(Array.from(map.values()));
}

export function prependOlderMessages(existing = [], older = []) {
  return dedupeMessagesById([...older, ...existing]);
}

export function appendMessage(existing = [], message) {
  if (!message?.id) return existing;
  return dedupeMessagesById([...existing, message]);
}

export function applyDisputeMessagesRead(messages = [], event) {
  if (!event?.readerType) return messages;

  return messages.map((message) => {
    const shouldMarkRead =
      event.readerType === "ADMIN"
        ? message.senderType === "GUEST" || message.senderType === "HOST"
        : message.senderType === "ADMIN";

    if (!shouldMarkRead) return message;

    return {
      ...message,
      isRead: true,
      readAt: event.readAt ?? message.readAt,
    };
  });
}

export function getSenderDisplayName(sender) {
  if (!sender) return "مستخدم";
  const name = `${sender.firstName ?? ""} ${sender.lastName ?? ""}`.trim();
  return name || "مستخدم";
}

export function formatDisputeDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
