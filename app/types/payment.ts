export enum PaymentStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled",
}

export enum PaymentType {
  RENT = "rent",
  UTILITY = "utility",
  DEPOSIT = "deposit",
  OTHER = "other",
}

export enum PaymentPeriodStatus {
  UNPAID = "unpaid",
  PAID = "paid",
  OVERDUE = "overdue",
}

export interface PaymentPeriod {
  id: string;
  leaseId: string;
  month: string;
  rentAmount: number;
  periodStart?: string;
  periodEnd?: string;
  daysInCycle?: number;
  status: PaymentPeriodStatus;
  paidAt?: string;
  paymentId?: string;
}

export interface Payment {
  id: string;
  buildingId: string;
  unitId?: string;
  tenantId: string;
  invoiceId?: string;
  amount: number;
  type: PaymentType;
  status: PaymentStatus;
  paymentDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
  };
}

export interface CreatePaymentRequest {
  tenantId: string;
  unitId: string;
  amount: number;
  type: PaymentType;
  paymentDate: string;
  monthsCovered?: string[];
  notes?: string;
}

export enum InvoiceStatus {
  DRAFT = "draft",
  SENT = "sent",
  PAID = "paid",
  OVERDUE = "overdue",
  CANCELLED = "cancelled",
}

export interface InvoiceItem {
  description: string;
  amount: number;
}

export interface Invoice {
  id: string;
  buildingId: string;
  unitId?: string;
  tenantId: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  };
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: PaymentStatus;
  }>;
}

export interface PaymentCalendar {
  leaseId: string;
  unitId: string;
  unitNumber: string;
  unitFloor?: number;
  startDate: string;
  endDate: string;
  rentAmount: number;
  periods: PaymentPeriod[];
}
