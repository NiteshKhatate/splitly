import type {
  CreateGroupFormErrors,
  CreateGroupFormFields,
} from "@/lib/validations/groups";

export type CreateGroupFormState = {
  fields: CreateGroupFormFields;
  errors: CreateGroupFormErrors;
  message?: string;
};

export const initialCreateGroupFormState: CreateGroupFormState = {
  fields: {
    name: "",
    description: "",
  },
  errors: {},
};
