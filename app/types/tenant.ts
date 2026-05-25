export enum TenantStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export interface Tenant {
  id: string;
  buildingId: string;
  name: string;
  email: string;
  phone?: string;
  tin?: string;
  status: TenantStatus;
  createdAt: string;
  updatedAt: string;
  leases?: Array<{
    id: string;
    status: string;
    unit: {
      id: string;
      unitNumber: string;
      floor?: number;
    };
  }>;
}

export interface CreateTenantRequest {
  name: string;
  email: string;
  phone?: string;
  tin?: string;
  unitId?: string;
  status?: TenantStatus;
}

export interface UpdateTenantRequest {
  name?: string;
  email?: string;
  phone?: string;
  tin?: string;
  unitId?: string;
  status?: TenantStatus;
}
