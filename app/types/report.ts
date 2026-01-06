export interface OccupancyReport {
  totalUnits: number;
  occupiedUnits: number;
  vacantUnits: number;
  occupancyRate: number;
  vacantUnitsList: Array<{
    id: string;
    unitNumber: string;
    floor?: number;
    type?: string;
    rentPrice: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  revenueByUnit: Array<{
    unitId: string;
    unitNumber: string;
    revenue: number;
  }>;
  outstanding: {
    count: number;
    amount: number;
    periods: Array<{
      month: string;
      amount: number;
      status: string;
      tenant: {
        id: string;
        name: string;
      };
      unit: {
        id: string;
        unitNumber: string;
      };
    }>;
  };
}

export interface TenantReport {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  upcomingExpirations: Array<{
    leaseId: string;
    tenant: {
      id: string;
      name: string;
      email: string;
    };
    unit: {
      id: string;
      unitNumber: string;
    };
    endDate: string;
    daysUntilExpiration: number;
  }>;
  paymentHistory: Array<{
    tenantId: string;
    tenantName: string;
    email: string;
    totalPaid: number;
    paymentsCount: number;
    lastPayment: string | null;
  }>;
}
