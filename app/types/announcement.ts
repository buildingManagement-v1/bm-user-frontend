export type AnnouncementPriority = "normal" | "important" | "urgent";

export interface Announcement {
  id: string;
  buildingId: string;
  title: string;
  content: string;
  priority: AnnouncementPriority;
  /** null while a draft */
  publishedAt: string | null;
  expiresAt: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnnouncementRequest {
  title: string;
  content: string;
  priority?: AnnouncementPriority;
  expiresAt?: string;
  publish?: boolean;
}

export interface UpdateAnnouncementRequest {
  title?: string;
  content?: string;
  priority?: AnnouncementPriority;
  expiresAt?: string | null;
}
