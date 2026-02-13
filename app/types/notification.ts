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

import type { PageInfo } from './api';

export interface NotificationsResponse {
  success?: boolean;
  data: Notification[];
  meta?: { page_info: PageInfo };
}

export interface UnreadCountResponse {
  count: number;
}
