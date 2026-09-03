export const GROUP_NAME_MAX_LENGTH = 80;
export const GROUP_DESCRIPTION_MAX_LENGTH = 240;

export type CreateGroupFormFields = {
  name: string;
  description: string;
};

export type CreateGroupFormErrors = Partial<Record<keyof CreateGroupFormFields, string>>;

export function validateCreateGroupForm(fields: CreateGroupFormFields) {
  const errors: CreateGroupFormErrors = {};
  const name = fields.name.trim();
  const description = fields.description.trim();

  if (!name) {
    errors.name = "Enter a group name.";
  } else if (name.length > GROUP_NAME_MAX_LENGTH) {
    errors.name = `Group name must be ${GROUP_NAME_MAX_LENGTH} characters or less.`;
  }

  if (description.length > GROUP_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Description must be ${GROUP_DESCRIPTION_MAX_LENGTH} characters or less.`;
  }

  return errors;
}
