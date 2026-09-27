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
  terminatedAt?: string | null;
  terminationReason?: string | null;
  terms?: Record<string, unknown>;
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
  terms?: Record<string, unknown>;
}

/** Edits apply to rent cycles that haven't started or been paid */
export interface UpdateLeaseRequest {
  startDate?: string;
  endDate?: string;
  rentAmount?: number;
  securityDeposit?: number;
  carsAllowed?: number;
  useDefaultPaymentDay?: boolean;
  paymentCollectionDay?: number;
  applyWithholding?: boolean;
  terms?: Record<string, unknown>;
}

export interface TerminateLeaseRequest {
  /** YYYY-MM-DD, defaults to today, cannot be in the future */
  effectiveDate?: string;
  reason?: string;
}

export interface TerminateLeaseResult {
  message: string;
  effectiveDate: string;
  removedPeriods: number;
  proratedPeriods: number;
  prepaidPeriodsAfterEnd: number;
  outstandingPeriods: number;
  outstandingRent: number;
  unitFreed: boolean;
  parkingReleased: number;
  tenantDeactivated: boolean;
}
