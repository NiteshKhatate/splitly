export const AUTHENTICATED_HOME = "/dashboard";

const FALLBACK_ORIGIN = "https://splitly.invalid";
const UNSAFE_REDIRECT_CHARACTERS = /[\\\u0000-\u001F\u007F]/;
const ENCODED_PATH_SEPARATOR = /%(?:2f|5c)/i;

export function getSafeRedirectPath(
  value: string | null | undefined,
  canonicalOrigin?: string,
) {
  if (
    !value
    || value !== value.trim()
    || UNSAFE_REDIRECT_CHARACTERS.test(value)
    || ENCODED_PATH_SEPARATOR.test(value)
  ) {
    return AUTHENTICATED_HOME;
  }

  try {
    const origin = new URL(canonicalOrigin ?? FALLBACK_ORIGIN).origin;
    if (!canonicalOrigin && (!value.startsWith("/") || value.startsWith("//"))) {
      return AUTHENTICATED_HOME;
    }

    const redirect = new URL(value, origin);
    if (redirect.origin !== origin || !["http:", "https:"].includes(redirect.protocol)) {
      return AUTHENTICATED_HOME;
    }

    return `${redirect.pathname}${redirect.search}${redirect.hash}`;
  } catch {
    return AUTHENTICATED_HOME;
  }
}
