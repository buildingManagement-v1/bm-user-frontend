import type { Manager } from "./manager";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: "active" | "inactive";
  mustResetPassword?: boolean;
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
  mustResetPassword?: boolean;
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

/** Tokens handed back when a password change revokes older sessions. */
export interface PasswordChangeResponse {
  message: string;
  accessToken: string;
  refreshToken: string;
}

/** 409 body when a tenant's email exists in several buildings. */
export interface BuildingChoice {
  id: string;
  name: string;
}
