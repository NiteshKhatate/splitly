export const protectedPrefixes = ["/activity", "/dashboard", "/exports", "/groups", "/expenses", "/settings"];

export function isProtected(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
