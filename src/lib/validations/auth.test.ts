import {
  forgotPasswordFormSchema,
  loginFormSchema,
  resetPasswordFormSchema,
  signupFormSchema,
} from "./auth";

describe("auth validation schemas", () => {
  it("normalizes email addresses for login", () => {
    const result = loginFormSchema.safeParse({
      email: " User@Example.COM ",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("requires matching signup passwords", () => {
    const result = signupFormSchema.safeParse({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      password: "password123",
      confirmPassword: "different123",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.confirmPassword).toContain("Passwords do not match.");
    }
  });

  it("validates forgot password email input", () => {
    const result = forgotPasswordFormSchema.safeParse({
      email: "not-an-email",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email).toContain("Enter a valid email address.");
    }
  });

  it("requires a minimum reset password length", () => {
    const result = resetPasswordFormSchema.safeParse({
      password: "short",
      confirmPassword: "short",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password).toContain("Use at least 8 characters.");
    }
  });
});
