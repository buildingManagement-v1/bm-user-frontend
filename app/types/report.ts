export interface ReportSummary {
  occupancyRate: number;
  totalUnits: number;
  occupiedUnits: number;
  vacantCount: number;
  expectedRentThisMonth: number;
  collectedRentThisMonth: number;
  collectionRateThisMonth: number;
  outstandingAmount: number;
  outstandingCount: number;
  expiringIn30Days: number;
  openMaintenanceCount: number;
  period: { year: number; month: number };
  summaryText?: string;
  highlights?: string[];
}

export interface MaintenanceReport {
  openCount: number;
  byPriority: Record<string, number>;
}

export interface PortfolioBuilding {
  id: string;
  name: string;
  occupancyRate: number;
  collectedThisMonth: number;
  expectedThisMonth: number;
  outstandingAmount: number;
  vacantCount: number;
  expiringIn30: number;
  openMaintenance: number;
}

export interface PortfolioReport {
  buildings: PortfolioBuilding[];
}

export interface OccupancyReport {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  lostRentPerMonth: number;
  vacantUnitsList: Array<{
    id: string;
    unitNumber: string;
    floor?: number;
    type?: string;
    rentPrice: number;
  }>;
  occupancyByMonth: Array<{
    month: string;
    occupancyRate: number;
    occupied: number;
    total: number;
  }>;
}

export interface RevenueReport {
  expectedRent: number;
  collectedRent: number;
  collectionRate: number;
  totalRevenue: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  revenueByMonth: Array<{
    month: string;
    expected: number;
    collected: number;
  }>;
  outstanding: {
    count: number;
    amount: number;
    aging: {
      days0_30: number;
      days31_60: number;
      days61Plus: number;
    };
    periods: Array<{
      month: string;
      amount: number;
      status: string;
      daysOverdue: number;
      tenant: { id: string; name: string };
      unit: { id: string; unitNumber: string };
    }>;
    groupedByLease: Array<{
      tenant: { id: string; name: string };
      unit: { id: string; unitNumber: string };
      totalAmount: number;
      periodCount: number;
      months: string[];
      maxDaysOverdue: number;
    }>;
  };
}

export interface TenantReport {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  expiringIn30: { count: number; list: LeaseExpirationItem[] };
  expiringIn60: { count: number; list: LeaseExpirationItem[] };
  expiringIn90: { count: number; list: LeaseExpirationItem[] };
  paymentHistory: Array<{
    tenantId: string;
    tenantName: string;
    email: string;
    totalPaid: number;
    paymentsCount: number;
    lastPayment: string | null;
  }>;
}

export interface LeaseExpirationItem {
  leaseId: string;
  tenant: { id: string; name: string; email: string };
  unit: { id: string; unitNumber: string };
  endDate: string;
  daysUntilExpiration: number;
}
