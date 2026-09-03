export const AUTHENTICATED_HOME = "/dashboard";

export function getSafeRedirectPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return AUTHENTICATED_HOME;
  }

  return value;
}
