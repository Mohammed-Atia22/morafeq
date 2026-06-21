import {
useCallback,
useEffect,
useMemo,
useRef,
useState,
} from "react";
import { useSearchParams } from "react-router-dom";

import { chatApi } from "../services/chatApi";
import { useChatSocket } from "./useChatSocket";
import { useAuth } from "../../auth/hooks/useAuth";
import { translateErrorMessage } from "../../../shared/services/api";

export function useChatPage() {
const { user } = useAuth();
const [searchParams] = useSearchParams();

const conversationIdParam =
searchParams.get("conversationId");

const [conversations, setConversations] = useState([]);
const [selectedConversationId, setSelectedConversationId] =
useState(null);

const [messages, setMessages] = useState([]);
const [content, setContent] = useState("");

const [isLoadingConversations, setIsLoadingConversations] =
useState(true);
const [isLoadingMessages, setIsLoadingMessages] =
useState(false);
const [isSending, setIsSending] = useState(false);
const [error, setError] = useState("");

const selectedConversationIdRef = useRef(null);
const currentUserIdRef = useRef(null);
const markAsReadRef = useRef(null);
const joinedConversationIdsRef = useRef(new Set());

useEffect(() => {
selectedConversationIdRef.current =
selectedConversationId;
}, [selectedConversationId]);

useEffect(() => {
currentUserIdRef.current = user?.id ?? null;
}, [user?.id]);

// لما الطرف الآخر يقرأ الرسائل
const handleMessagesRead = useCallback((data) => {
const { conversationId, readerId, readAt } = data;


setMessages((currentMessages) =>
  currentMessages.map((message) => {
    const messageWasRead =
      message.conversationId === conversationId &&
      message.senderId !== readerId;

    if (!messageWasRead) {
      return message;
    }

    return {
      ...message,
      isRead: true,
      readAt,
    };
  }),
);


}, []);

// استقبال رسالة جديدة
const handleNewMessage = useCallback((message) => {
const activeConversationId =
selectedConversationIdRef.current;


const currentUserId =
  currentUserIdRef.current;

const isOpenConversation =
  message.conversationId === activeConversationId;

const isMessageFromCurrentUser =
  message.senderId === currentUserId;

if (isOpenConversation) {
  setMessages((currentMessages) => {
    const alreadyExists = currentMessages.some(
      (currentMessage) =>
        currentMessage.id === message.id,
    );

    if (alreadyExists) {
      return currentMessages;
    }

    return [...currentMessages, message];
  });

  // لو الرسالة جاية من الطرف الآخر والمحادثة مفتوحة
  if (!isMessageFromCurrentUser) {
    markAsReadRef.current
      ?.call(null, message.conversationId)
      .then(() => {
        window.dispatchEvent(
          new Event("chat-unread-changed"),
        );
      })
      .catch(() => {});
  }
}

setConversations((currentConversations) => {
  const updatedConversations =
    currentConversations.map((conversation) => {
      if (
        conversation.id !== message.conversationId
      ) {
        return conversation;
      }

      let unreadCount =
        conversation.unreadCount ?? 0;

      if (
        !isOpenConversation &&
        !isMessageFromCurrentUser
      ) {
        unreadCount += 1;
      }

      if (isOpenConversation) {
        unreadCount = 0;
      }

      return {
        ...conversation,
        lastMessage: message,
        updatedAt: message.createdAt,
        unreadCount,
      };
    });

  return updatedConversations.sort(
    (firstConversation, secondConversation) =>
      new Date(
        secondConversation.updatedAt,
      ).getTime() -
      new Date(
        firstConversation.updatedAt,
      ).getTime(),
  );
});

if (!isOpenConversation && !isMessageFromCurrentUser) {
  window.dispatchEvent(
    new Event("chat-unread-changed"),
  );
}


}, []);

const {
isConnected,
socketId,
socketError,
joinConversation,
sendMessage,
markAsRead,
} = useChatSocket(
handleNewMessage,
handleMessagesRead,
);

useEffect(() => {
markAsReadRef.current = markAsRead;
}, [markAsRead]);

useEffect(() => {
if (!isConnected) {
  joinedConversationIdsRef.current.clear();
  return;
}

conversations.forEach((conversation) => {
  if (joinedConversationIdsRef.current.has(conversation.id)) {
    return;
  }

  joinedConversationIdsRef.current.add(conversation.id);

  joinConversation(conversation.id).catch(() => {
    joinedConversationIdsRef.current.delete(conversation.id);
  });
});
}, [conversations, isConnected, joinConversation]);

// جلب قائمة المحادثات
useEffect(() => {
const loadConversations = async () => {
try {
setIsLoadingConversations(true);
setError("");


    const data =
      await chatApi.getConversations();

    setConversations(data);

    if (data.length > 0 && conversationIdParam) {
      const requestedConversationId =
        Number(conversationIdParam);

      const requestedConversationExists =
        Number.isInteger(requestedConversationId) &&
        data.some(
          (conversation) =>
            conversation.id ===
            requestedConversationId,
        );

      setSelectedConversationId(
        requestedConversationExists
          ? requestedConversationId
          : null,
      );
    } else {
      setSelectedConversationId(null);
    }
  } catch (requestError) {
    setError(
      requestError.message ||
        "تعذر تحميل المحادثات",
    );
  } finally {
    setIsLoadingConversations(false);
  }
};

loadConversations();


}, [conversationIdParam]);

// فتح المحادثة
useEffect(() => {
if (!selectedConversationId || !isConnected) {
return;
}


let isCancelled = false;

const openConversation = async () => {
  try {
    setIsLoadingMessages(true);
    setError("");
    setMessages([]);

    // 1. دخول غرفة المحادثة
    await joinConversation(selectedConversationId);

    // 2. جلب الرسائل القديمة
    const oldMessages = await chatApi.getMessages(
      selectedConversationId,
    );

    if (isCancelled) {
      return;
    }

    // 3. اعرض الرسائل فورًا
    setMessages(oldMessages);
    setIsLoadingMessages(false);

    // 4. حاول تعليم الرسائل كمقروءة عن طريق Socket
    try {
      await Promise.race([
        markAsRead(selectedConversationId),

        new Promise((_, reject) => {
          window.setTimeout(() => {
            reject(
              new Error("انتهت مهلة تعليم الرسائل كمقروءة"),
            );
          }, 4000);
        }),
      ]);
    } catch (socketReadError) {
      console.error(
        "Socket markAsRead failed, using REST:",
        socketReadError,
      );

      // حل احتياطي لو Socket لم يرد
      await chatApi.markAsRead(
        selectedConversationId,
      );
    }

    if (isCancelled) {
      return;
    }

    // 5. تحديث العداد محليًا
    setConversations((currentConversations) =>
      currentConversations.map((conversation) =>
        conversation.id === selectedConversationId
          ? {
              ...conversation,
              unreadCount: 0,
            }
          : conversation,
      ),
    );

    window.dispatchEvent(
      new Event("chat-unread-changed"),
    );
  } catch (requestError) {
    if (!isCancelled) {
      setError(
        requestError.message ||
          "تعذر فتح المحادثة",
      );

      setIsLoadingMessages(false);
    }
  }
};

openConversation();

return () => {
  isCancelled = true;
};


}, [
selectedConversationId,
isConnected,
joinConversation,
markAsRead,
]);

const selectedConversation = useMemo(
() =>
conversations.find(
(conversation) =>
conversation.id ===
selectedConversationId,
) ?? null,
[conversations, selectedConversationId],
);

const selectConversation = useCallback(
(conversationId) => {
if (
conversationId === selectedConversationId
) {
return;
}


  setContent("");
  setMessages([]);
  setError("");
  setSelectedConversationId(conversationId);
},
[selectedConversationId],


);

const submitMessage = useCallback(async () => {
const cleanedContent = content.trim();


if (!selectedConversationId) {
  setError("اختر محادثة أولًا");
  return;
}

if (!cleanedContent) {
  return;
}

try {
  setIsSending(true);
  setError("");

  if (isConnected) {
    try {
      await sendMessage(
        selectedConversationId,
        cleanedContent,
      );
    } catch {
      const message = await chatApi.sendMessage({
        conversationId: selectedConversationId,
        content: cleanedContent,
      });

      handleNewMessage(message);
    }
  } else {
    const message = await chatApi.sendMessage({
      conversationId: selectedConversationId,
      content: cleanedContent,
    });

    handleNewMessage(message);
  }

  setContent("");
} catch (sendError) {
  setError(
    sendError.message ||
      "تعذر إرسال الرسالة",
  );
} finally {
  setIsSending(false);
}


}, [
content,
selectedConversationId,
isConnected,
sendMessage,
handleNewMessage,
]);

return {
user,


conversations,
selectedConversation,
selectedConversationId,
messages,
content,

isConnected,
socketId,
socketError,

isLoadingConversations,
isLoadingMessages,
isSending,
error,

setContent,
selectConversation,
submitMessage,


};
}
