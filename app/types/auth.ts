import type { Manager } from "./manager";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: "active" | "inactive";
}

export type AuthUser = User | Manager;

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user?: User;
  manager?: Manager;
  mustResetPassword?: boolean;
}
