import {
  GROUP_DESCRIPTION_MAX_LENGTH,
  GROUP_NAME_MAX_LENGTH,
  createGroupFormSchema,
  groupMemberEmailFormSchema,
  validateCreateGroupForm,
  validateGroupMemberEmail,
} from "./groups";

describe("group validation schemas", () => {
  it("trims create group fields", () => {
    const result = createGroupFormSchema.safeParse({
      name: " Weekend trip ",
      description: " Snacks and fuel ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Weekend trip",
        description: "Snacks and fuel",
      });
    }
  });

  it("returns field errors for invalid create group input", () => {
    const result = validateCreateGroupForm({
      name: "",
      description: "x".repeat(GROUP_DESCRIPTION_MAX_LENGTH + 1),
    });

    expect(result.data).toBeNull();
    expect(result.errors).toEqual({
      name: "Enter a group name.",
      description: `Description must be ${GROUP_DESCRIPTION_MAX_LENGTH} characters or less.`,
    });
  });

  it("enforces the group name length limit", () => {
    const result = createGroupFormSchema.safeParse({
      name: "x".repeat(GROUP_NAME_MAX_LENGTH + 1),
      description: "",
    });

    expect(result.success).toBe(false);
  });

  it("normalizes member email form data", () => {
    const result = groupMemberEmailFormSchema.safeParse({
      email: " Friend@Example.COM ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("friend@example.com");
    }
  });

  it("returns friendly member email errors", () => {
    expect(validateGroupMemberEmail("")).toBe("Enter an email address.");
    expect(validateGroupMemberEmail("not-an-email")).toBe("Enter a valid email address.");
    expect(validateGroupMemberEmail("friend@example.com")).toBeUndefined();
  });
});
