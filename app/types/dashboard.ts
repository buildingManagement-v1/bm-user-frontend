export interface DashboardStats {
  totalTenants: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  revenueThisMonth: number;
  pendingMaintenanceRequests: number;
}

export interface UpcomingPayment {
  tenantId: string;
  tenantName: string;
  tenantEmail: string;
  unit: {
    id: string;
    unitNumber: string;
  };
  /** Months (YYYY-MM) grouped for this tenant+unit */
  months: string[];
  totalAmount: number;
}
