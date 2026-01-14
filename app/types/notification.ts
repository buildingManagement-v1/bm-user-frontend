export interface Notification {
  id: string;
  userId: string;
  userType: "user" | "manager" | "tenant" | "platform_admin";
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  data: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface UnreadCountResponse {
  count: number;
}
