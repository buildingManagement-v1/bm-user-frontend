import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().min(6, "OTP must be 6 digits").max(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required to delete your account"),
});

export type LoginSchema = z.output<typeof loginSchema>;
export type RegisterSchema = z.output<typeof registerSchema>;
export type ForgotPasswordSchema = z.output<typeof forgotPasswordSchema>;
export type ResetPasswordSchema = z.output<typeof resetPasswordSchema>;
/** Email changes are confirmed with the current password (mirrors UpdateEmailDto) */
export const updateEmailSchema = z.object({
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().min(1, "Enter your current password"),
});

/** Tenant contact details editable from the portal (UpdateTenantProfileDto.phone) */
export const tenantContactSchema = z.object({
  phone: z.string().max(30, "Phone number is too long"),
});

export type UpdateEmailSchema = z.output<typeof updateEmailSchema>;
export type TenantContactSchema = z.output<typeof tenantContactSchema>;
export type ChangePasswordSchema = z.output<typeof changePasswordSchema>;
export type DeleteAccountSchema = z.output<typeof deleteAccountSchema>;
