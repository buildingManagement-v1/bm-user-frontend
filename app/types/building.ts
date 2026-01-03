export interface Building {
  id: string;
  userId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  settings?: Record<string, any>;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
