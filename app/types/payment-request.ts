export type PaymentRequestStatus = 'pending' | 'approved' | 'rejected'

export interface TenantPaymentRequest {
  id: string
  buildingId: string
  tenantId: string
  leaseId: string
  unitId: string
  amount: number
  type: string
  paymentDate: string
  monthsCovered?: string[]
  notes?: string
  receiptUrl: string
  status: PaymentRequestStatus
  reviewedAt?: string
  rejectionReason?: string
  createdAt: string
  updatedAt: string
  tenant?: { id: string; name: string; email: string }
  unit?: { id: string; unitNumber: string; floor?: number }
}
