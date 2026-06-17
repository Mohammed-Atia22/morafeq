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

// جلب قائمة المحادثات
useEffect(() => {
const loadConversations = async () => {
try {
setIsLoadingConversations(true);
setError("");


    const data =
      await chatApi.getConversations();

    setConversations(data);

    if (data.length > 0) {
      const requestedConversationId =
        conversationIdParam
          ? Number(conversationIdParam)
          : null;

      const requestedConversationExists =
        requestedConversationId &&
        data.some(
          (conversation) =>
            conversation.id ===
            requestedConversationId,
        );

      setSelectedConversationId(
        requestedConversationExists
          ? requestedConversationId
          : data[0].id,
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

    await joinConversation(
      selectedConversationId,
    );

    const oldMessages =
      await chatApi.getMessages(
        selectedConversationId,
      );

    if (isCancelled) {
      return;
    }

    setMessages(oldMessages);

    // تعليم الرسائل كمقروءة عن طريق Socket
    await markAsRead(selectedConversationId);

    window.dispatchEvent(
      new Event("chat-unread-changed"),
    );

    if (isCancelled) {
      return;
    }

    setConversations(
      (currentConversations) =>
        currentConversations.map(
          (conversation) =>
            conversation.id ===
            selectedConversationId
              ? {
                  ...conversation,
                  unreadCount: 0,
                }
              : conversation,
        ),
    );
  } catch (requestError) {
    if (!isCancelled) {
      setError(
        requestError.message ||
          "تعذر فتح المحادثة",
      );
    }
  } finally {
    if (!isCancelled) {
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

  await sendMessage(
    selectedConversationId,
    cleanedContent,
  );

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
sendMessage,
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
