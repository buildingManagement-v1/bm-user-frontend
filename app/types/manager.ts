export enum ManagerRole {
  TENANT_MANAGER = "tenant_manager",
  PAYMENT_MANAGER = "payment_manager",
  MAINTENANCE_MANAGER = "maintenance_manager",
  OPERATIONS_MANAGER = "operations_manager",
  REPORTS_VIEWER = "reports_viewer",
}

export interface BuildingAssignment {
  buildingId: string;
  buildingName: string;
  roles: ManagerRole[];
}

export interface Manager {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
  mustResetPassword?: boolean;
  lastLoginAt?: string;
  buildingCount?: number;
  buildings?: BuildingAssignment[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateManagerRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  buildingAssignments: Array<{
    buildingId: string;
    roles: ManagerRole[];
  }>;
}

export interface UpdateManagerRequest {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  status?: "active" | "inactive";
}
