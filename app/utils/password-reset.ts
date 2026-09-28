import type { UserType } from '~/composables/useAuth'

/** Reset endpoints per account type (each has its own OTP flow). */
export const passwordResetEndpoints: Record<UserType, { request: string; reset: string }> = {
  user: { request: '/v1/app/auth/forgot-password', reset: '/v1/app/auth/reset-password' },
  manager: { request: '/v1/manager/auth/forgot-password', reset: '/v1/manager/auth/reset-password' },
  tenant: { request: '/v1/tenant/auth/request-otp', reset: '/v1/tenant/auth/reset-password' },
}

export const accountTypeOptions: Array<{ value: UserType; label: string }> = [
  { value: 'user', label: 'Building Owner' },
  { value: 'manager', label: 'Building Manager' },
  { value: 'tenant', label: 'Tenant' },
]

export function parseAccountType(value: unknown): UserType {
  return value === 'manager' || value === 'tenant' ? value : 'user'
}
