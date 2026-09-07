type ApplicationEnvironment = Partial<Record<
  "APP_URL" | "NODE_ENV" | "VERCEL_PROJECT_PRODUCTION_URL" | "VERCEL_URL",
  string
>>;

function normalizeOrigin(value: string, source: string): string {
  const candidate = value.includes("://") ? value : `https://${value}`;
  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error(`${source} must be a valid application URL.`);
  }
  if (!url.hostname || url.username || url.password) {
    throw new Error(`${source} must be a valid application URL.`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`${source} must be an HTTP(S) origin without a path, query, or fragment.`);
  }
  return url.origin;
}

function isLocalOrigin(origin: string): boolean {
  const hostname = new URL(origin).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

export function getConfiguredApplicationOrigin(
  environment: ApplicationEnvironment = process.env,
): string | undefined {
  const appUrl = environment.APP_URL?.trim();
  if (appUrl) {
    const origin = normalizeOrigin(appUrl, "APP_URL");
    if (environment.NODE_ENV === "production" && new URL(origin).protocol !== "https:") {
      throw new Error("APP_URL must use HTTPS in production.");
    }
    return origin;
  }

  const vercelProductionUrl = environment.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProductionUrl) return normalizeOrigin(vercelProductionUrl, "VERCEL_PROJECT_PRODUCTION_URL");

  const vercelDeploymentUrl = environment.VERCEL_URL?.trim();
  if (vercelDeploymentUrl) return normalizeOrigin(vercelDeploymentUrl, "VERCEL_URL");

  return undefined;
}

export function getApplicationOrigin(
  fallbackOrigin: string,
  environment: ApplicationEnvironment = process.env,
): string {
  const configuredOrigin = getConfiguredApplicationOrigin(environment);
  if (configuredOrigin) return configuredOrigin;

  const fallback = normalizeOrigin(fallbackOrigin, "Request origin");
  if (environment.NODE_ENV === "production" && isLocalOrigin(fallback)) {
    throw new Error("A public APP_URL is required for production email links.");
  }
  return fallback;
}

export function buildApplicationUrl(
  pathname: string,
  fallbackOrigin: string,
  environment: ApplicationEnvironment = process.env,
): string {
  if (!pathname.startsWith("/")) throw new Error("Application URL paths must start with '/'.");
  return new URL(pathname, getApplicationOrigin(fallbackOrigin, environment)).toString();
}
