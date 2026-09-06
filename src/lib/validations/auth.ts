import { z } from "zod";

export const SIGNUP_PASSWORD_MIN_LENGTH = 8;
export const PROFILE_NAME_MAX_LENGTH = 100;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Enter your email address.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

const fullNameSchema = z
  .string()
  .trim()
  .min(1, "Enter your full name.")
  .max(PROFILE_NAME_MAX_LENGTH, `Use ${PROFILE_NAME_MAX_LENGTH} characters or less.`);

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

export const profileNameFormSchema = z.object({
  fullName: fullNameSchema,
});

export const profileEmailFormSchema = z.object({
  email: emailSchema,
});

export const profilePasswordFormSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
}).refine((values) => values.password === values.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
}).refine((values) => values.currentPassword !== values.password, {
  message: "Choose a password different from your current password.",
  path: ["password"],
});

export const accountUpdateSchema = z.discriminatedUnion("kind", [
  profileNameFormSchema.extend({ kind: z.literal("name") }),
  profileEmailFormSchema.extend({ kind: z.literal("email") }),
  profilePasswordFormSchema.extend({ kind: z.literal("password") }),
]);

export type LoginFormData = z.infer<typeof loginFormSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordFormSchema>;
export type SignupFormData = z.infer<typeof signupFormSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordFormSchema>;
export type InvitationAccountSetupData = z.infer<typeof invitationAccountSetupSchema>;
export type ProfileNameFormData = z.infer<typeof profileNameFormSchema>;
export type ProfileEmailFormData = z.infer<typeof profileEmailFormSchema>;
export type ProfilePasswordFormData = z.infer<typeof profilePasswordFormSchema>;
export type AccountUpdateData = z.infer<typeof accountUpdateSchema>;
