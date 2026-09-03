export const SIGNUP_PASSWORD_MIN_LENGTH = 8;

export type SignupFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type SignupFormErrors = Partial<Record<keyof SignupFormValues, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateSignupForm(values: SignupFormValues) {
  const errors: SignupFormErrors = {};
  const fullName = values.fullName.trim();
  const email = values.email.trim();

  if (!fullName) {
    errors.fullName = "Enter your full name.";
  }

  if (!email) {
    errors.email = "Enter your email address.";
  } else if (!emailPattern.test(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.password) {
    errors.password = "Enter a password.";
  } else if (values.password.length < SIGNUP_PASSWORD_MIN_LENGTH) {
    errors.password = `Use at least ${SIGNUP_PASSWORD_MIN_LENGTH} characters.`;
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  return errors;
}
