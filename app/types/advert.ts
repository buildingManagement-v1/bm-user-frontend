export type AdvertAudience = "all" | "owner" | "manager" | "tenant";

export interface LoginAdvert {
  id: string;
  title: string;
  description: string | null;
  linkUrl: string | null;
  audience: AdvertAudience;
  /** API path of the banner image (prefix with the API base URL) */
  imageUrl: string;
}
