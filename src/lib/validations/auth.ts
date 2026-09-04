import { z } from "zod";

export const SIGNUP_PASSWORD_MIN_LENGTH = 8;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your full name.");

const passwordSchema = z
  .string()
  .min(1, "Enter a password.")
  .min(SIGNUP_PASSWORD_MIN_LENGTH, `Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`);

const confirmPasswordSchema = z
  .string()
  .min(1, "Confirm your password.");

const signupPasswordFieldsSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: confirmPasswordSchema,
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export const loginFormSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordFormSchema = z.object({
  email: emailSchema,
});

export const signupFormSchema = z
  .object({
    fullName: fullNameSchema,
    email: emailSchema,
  })
  .and(signupPasswordFieldsSchema);

export const resetPasswordFormSchema = signupPasswordFieldsSchema;

export const invitationAccountSetupSchema = z
  .object({
    fullName: fullNameSchema,
  })
  .and(signupPasswordFieldsSchema);

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type InvitationAccountSetupData = z.infer<typeof invitationAccountSetupSchema>;
