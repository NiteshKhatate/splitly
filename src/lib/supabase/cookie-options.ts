type CookieOptions = Record<string, unknown> & {
  sameSite?: boolean | "lax" | "none" | "strict";
  secure?: boolean;
};

export function secureCookieOptions<T extends CookieOptions>(options: T): T & CookieOptions {
  return {
    ...options,
    sameSite: options.sameSite ?? "lax",
    secure: process.env.NODE_ENV === "production" ? true : options.secure,
  };
}
