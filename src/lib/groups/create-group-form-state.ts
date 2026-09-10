import type {
  CreateGroupFormErrors,
  CreateGroupFormFields,
} from "@/lib/validations/groups";

export type CreateGroupFormState = {
  fields: CreateGroupFormFields;
  errors: CreateGroupFormErrors;
  message?: string;
  redirectTo?: string;
  status?: "error" | "success";
};

export const initialCreateGroupFormState: CreateGroupFormState = {
  fields: {
    name: "",
    description: "",
  },
  errors: {},
};
