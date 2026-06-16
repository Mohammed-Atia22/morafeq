const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:3001/api/v1";

async function chatRequest(path, options = {}) {
  const token = localStorage.getItem("morafeq_access_token");

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
    credentials: "include",
  });

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message = Array.isArray(data?.message)
      ? data.message.join(", ")
      : data?.message || "حدث خطأ أثناء تنفيذ الطلب";

    throw new Error(message);
  }

  return data;
}

export const chatApi = {
  // إنشاء محادثة أو إرجاع المحادثة الموجودة
  createConversation(listingId) {
    return chatRequest("/chat/conversations", {
      method: "POST",
      body: JSON.stringify({
        listingId,
      }),
    });
  },

  // جلب جميع محادثات المستخدم الحالي
  getConversations() {
    return chatRequest("/chat/conversations", {
      method: "GET",
    });
  },

  // جلب الرسائل القديمة لمحادثة معينة
  getMessages(conversationId) {
    return chatRequest(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "GET",
      },
    );
  },

  // تعليم رسائل الطرف الآخر كمقروءة
  markAsRead(conversationId) {
    return chatRequest(
      `/chat/conversations/${conversationId}/read`,
      {
        method: "PATCH",
      },
    );
  },

  // إرسال رسالة عن طريق REST كحل احتياطي
  sendMessage(payload) {
    return chatRequest("/chat/messages", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
};