export enum LeaseStatus {
  ACTIVE = "active",
  EXPIRED = "expired",
  TERMINATED = "terminated",
}

export interface Lease {
  id: string;
  tenantId: string;
  unitId: string;
  buildingId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit?: number;
  carsAllowed?: number;
  useDefaultPaymentDay: boolean;
  paymentCollectionDay?: number;
  applyWithholding: boolean;
  status: LeaseStatus;
  terms?: any;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  unit: {
    id: string;
    unitNumber: string;
    floor?: number;
  };
}

export interface CreateLeaseRequest {
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  rentAmount: number;
  securityDeposit?: number;
  carsAllowed?: number;
  useDefaultPaymentDay: boolean;
  paymentCollectionDay?: number;
  applyWithholding: boolean;
  status?: LeaseStatus;
  terms?: any;
}

export interface UpdateLeaseRequest {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  securityDeposit?: number;
  carsAllowed?: number;
  status?: LeaseStatus;
  terms?: any;
}
