export interface BuildingOption {
  id: string;
  name: string;
}

export interface Building {
  id: string;
  userId: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone: string;
  logoUrl?: string;
  settings?: Record<string, unknown>;
  vatRate: number;
  withholdingRate: number;
  paymentCollectionDay: number;
  totalParkingLots: number;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}
