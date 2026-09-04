import { z } from "zod";

export const GROUP_NAME_MAX_LENGTH = 80;
export const GROUP_DESCRIPTION_MAX_LENGTH = 240;

export const groupMemberEmailSchema = z
  .string()
  .trim()
  .min(1, "Enter an email address.")
  .email("Enter a valid email address.")
  .transform((email) => email.toLowerCase());

export const createGroupFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Enter a group name.")
    .max(GROUP_NAME_MAX_LENGTH, `Group name must be ${GROUP_NAME_MAX_LENGTH} characters or less.`),
  description: z
    .string()
    .trim()
    .max(GROUP_DESCRIPTION_MAX_LENGTH, `Description must be ${GROUP_DESCRIPTION_MAX_LENGTH} characters or less.`),
});

export const groupMemberEmailFormSchema = z.object({
  email: groupMemberEmailSchema,
});

export type CreateGroupFormFields = z.infer<typeof createGroupFormSchema>;
export type CreateGroupFormErrors = Partial<Record<keyof CreateGroupFormFields, string>>;
export type GroupMemberEmailFormData = z.infer<typeof groupMemberEmailFormSchema>;

export function validateCreateGroupForm(fields: CreateGroupFormFields) {
  const result = createGroupFormSchema.safeParse(fields);

  if (result.success) {
    return {
      data: result.data,
      errors: {},
    };
  }

  const errors: CreateGroupFormErrors = {};

  for (const issue of result.error.issues) {
    const fieldName = issue.path[0];

    if ((fieldName === "name" || fieldName === "description") && !errors[fieldName]) {
      errors[fieldName] = issue.message;
    }
  }

  return {
    data: null,
    errors,
  };
}

export function validateGroupMemberEmail(email: string) {
  const result = groupMemberEmailSchema.safeParse(email);

  if (!result.success) {
    return result.error.issues[0]?.message ?? "Enter a valid email address.";
  }

  return undefined;
}
