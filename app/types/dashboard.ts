export interface DashboardStats {
  totalTenants: number;
  totalUnits: number;
  occupiedUnits: number;
  occupancyRate: number;
  /** null when the viewer has no payment/reports role in this building */
  revenueThisMonth: number | null;
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
  /** Period keys (cycle start dates, YYYY-MM-DD) grouped for this tenant+unit */
  months: string[];
  /** Total the tenant owes for these periods, tax included */
  totalAmount: number;
  /** At least one of the periods is overdue */
  overdue: boolean;
}

export interface RevenueByMonth {
  month: string;
  label: string;
  revenue: number;
}
