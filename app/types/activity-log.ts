export enum ActivityAction {
  CREATE = "create",
  UPDATE = "update",
  DELETE = "delete",
  STATUS_CHANGE = "status_change",
}

export enum ActivityEntityType {
  UNIT = "unit",
  TENANT = "tenant",
  LEASE = "lease",
  PAYMENT = "payment",
  MAINTENANCE_REQUEST = "maintenance_request",
  MANAGER = "manager",
  INVOICE = "invoice",
  SUBSCRIPTION_PLAN = "subscription_plan",
}

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  entityType: ActivityEntityType;
  entityId: string;
  userId: string;
  userName: string;
  userRole: string;
  buildingId: string;
  details: Record<string, any> | null;
  createdAt: string;
}
