export type AddMemberCandidate = {
  userId: string;
  name: string;
  email: string;
};

export type AddMemberState = {
  email: string;
  candidate?: AddMemberCandidate;
  fieldError?: string;
  message?: string;
  tone?: "error" | "success";
};

export const initialAddMemberState: AddMemberState = {
  email: "",
};
