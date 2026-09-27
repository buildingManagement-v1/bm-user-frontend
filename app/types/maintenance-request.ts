export enum MaintenanceRequestStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum MaintenanceRequestPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent",
}

export interface Note {
  text: string;
  author: string;
  timestamp: string;
}

export interface MaintenanceRequest {
  id: string;
  buildingId: string;
  /** null for common-area requests logged by staff */
  tenantId: string | null;
  unitId?: string | null;
  title: string;
  description: string;
  priority: MaintenanceRequestPriority;
  status: MaintenanceRequestStatus;
  notes?: Note[];
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  tenant: {
    id: string;
    name: string;
    email: string;
  } | null;
  unit?: {
    id: string;
    unitNumber: string;
    floor?: number;
  };
}

export interface CreateMaintenanceRequestRequest {
  title: string;
  description: string;
  priority?: MaintenanceRequestPriority;
  tenantId?: string;
  unitId?: string;
}

export interface UpdateMaintenanceRequestRequest {
  status?: MaintenanceRequestStatus;
  note?: string;
}
