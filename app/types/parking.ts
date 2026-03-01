export interface ParkingRegistration {
  id: string
  buildingId: string
  leaseId: string
  tenantId: string
  unitId: string
  licensePlate: string
  createdAt: string
  updatedAt: string
  tenant: {
    id: string
    name: string
    email: string
  }
  unit: {
    id: string
    unitNumber: string
    floor?: number
  }
  lease?: {
    id: string
    carsAllowed: number
  }
}

export interface CreateParkingRegistrationRequest {
  tenantId: string
  unitId: string
  licensePlate: string
}

export type ParkingRequestStatus = 'pending' | 'approved' | 'rejected'

export interface TenantParkingRequest {
  id: string
  buildingId: string
  tenantId: string
  leaseId: string
  unitId: string
  licensePlate: string
  status: ParkingRequestStatus
  reviewedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  tenant?: { id: string; name: string; email: string }
  unit?: { id: string; unitNumber: string; floor?: number }
}
