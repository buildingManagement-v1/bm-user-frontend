import type {
  Notification,
  NotificationsResponse,
  UnreadCountResponse,
} from "~/types/notification";

export const useNotifications = () => {
  const { api } = useApi();

  const notifications = ref<Notification[]>([]);
  const unreadCount = ref(0);
  const loading = ref(false);

  async function fetchNotifications(page = 1, limit = 20) {
    loading.value = true;
    try {
      const response = await api<NotificationsResponse>("/v1/notifications", {
        params: { page, limit },
      });
      notifications.value = response.data;
      return response;
    } finally {
      loading.value = false;
    }
  }

  async function fetchUnreadCount() {
    try {
      const response = await api<UnreadCountResponse>(
        "/v1/notifications/unread-count"
      );
      unreadCount.value = response.count;
      return response.count;
    } catch (error) {
      return 0;
    }
  }

  async function markAsRead(id: string) {
    await api(`/v1/notifications/${id}/read`, { method: "PATCH" });
    const notification = notifications.value.find((n) => n.id === id);
    if (notification) {
      notification.isRead = true;
      if (unreadCount.value > 0) unreadCount.value--;
    }
  }

  async function markAllAsRead() {
    await api("/v1/notifications/mark-all-read", { method: "PATCH" });
    notifications.value.forEach((n) => (n.isRead = true));
    unreadCount.value = 0;
  }

  async function deleteNotification(id: string) {
    await api(`/v1/notifications/${id}`, { method: "DELETE" });
    const index = notifications.value.findIndex((n) => n.id === id);
    if (index > -1) {
      const wasUnread = !notifications.value[index]!.isRead;
      notifications.value.splice(index, 1);
      if (wasUnread && unreadCount.value > 0) unreadCount.value--;
    }
  }

  return {
    notifications,
    unreadCount,
    loading,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
};
