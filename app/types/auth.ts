import type { Manager } from "./manager";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
}

export interface TenantAuthData {
  id: string;
  name: string;
  email: string;
  phone?: string;
  building: {
    id: string;
    name: string;
  };
  unit: {
    id: string;
    unitNumber: string;
    floor?: number;
  } | null;
}

export type AuthUser = User | Manager | TenantAuthData;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  manager?: Manager;
  tenant?: TenantAuthData;
  mustResetPassword?: boolean;
}
