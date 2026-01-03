export enum UnitType {
  RETAIL = "retail",
  OFFICE = "office",
  STORAGE = "storage",
  RESTAURANT = "restaurant",
  OTHER = "other",
}

export enum UnitStatus {
  VACANT = "vacant",
  OCCUPIED = "occupied",
  INACTIVE = "inactive",
}

export interface Unit {
  id: string;
  buildingId: string;
  unitNumber: string;
  floor?: number;
  size?: number;
  type?: UnitType;
  rentPrice: number;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUnitRequest {
  unitNumber: string;
  floor?: number;
  size?: number;
  type?: UnitType;
  rentPrice: number;
  status?: UnitStatus;
}

export interface UpdateUnitRequest {
  unitNumber?: string;
  floor?: number;
  size?: number;
  type?: UnitType;
  rentPrice?: number;
  status?: UnitStatus;
}
