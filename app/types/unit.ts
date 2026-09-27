export enum UnitType {
  RETAIL = "retail",
  OFFICE = "office",
  STORAGE = "storage",
  RESTAURANT = "restaurant",
  GUEST_HOUSE = "guest_house",
  OTHER = "other",
}

export enum UnitStatus {
  VACANT = "vacant",
  OCCUPIED = "occupied",
  INACTIVE = "inactive",
}

/** Statuses an owner can set; "occupied" is managed by leases */
export type SettableUnitStatus = UnitStatus.VACANT | UnitStatus.INACTIVE;

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
  status?: SettableUnitStatus;
}

export interface UpdateUnitRequest {
  unitNumber?: string;
  floor?: number;
  size?: number;
  type?: UnitType;
  rentPrice?: number;
  status?: SettableUnitStatus;
}
