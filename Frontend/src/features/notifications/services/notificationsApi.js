import { apiRequest } from "../../../shared/services/api";

export const notificationsApi = {
  getNotifications: ({ page = 1, limit = 10 } = {}) =>
    apiRequest(`/notifications?page=${page}&limit=${limit}`),

  getUnreadCount: () => apiRequest("/notifications/unread-count"),

  markAsRead: (id) =>
    apiRequest(`/notifications/${id}/read`, {
      method: "PATCH",
    }),

  markAllAsRead: () =>
    apiRequest("/notifications/read-all", {
      method: "PATCH",
    }),
};
