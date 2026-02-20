import apiClient from "./client";
import type {
  NotificationListResponse,
  NotificationListParams,
  NotificationResponse,
  UnreadCountResponse,
} from "@/types/api";

export const notificationsApi = {
  list: (params: NotificationListParams = {}) =>
    apiClient
      .get<NotificationListResponse>("/notifications", { params })
      .then((r) => r.data),

  unreadCount: () =>
    apiClient
      .get<UnreadCountResponse>("/notifications/unread-count")
      .then((r) => r.data),

  markRead: (notificationId: string) =>
    apiClient
      .patch<NotificationResponse>(`/notifications/${notificationId}/read`)
      .then((r) => r.data),

  markAllRead: () =>
    apiClient
      .patch<UnreadCountResponse>("/notifications/read-all")
      .then((r) => r.data),
};
