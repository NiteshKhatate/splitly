import releaseChecks from "./lib/release-checks.js";

const endpoint = process.env.PRODUCTION_HEALTHCHECK_URL?.trim();
if (!endpoint) {
  console.error("Set PRODUCTION_HEALTHCHECK_URL to the production /api/health HTTPS URL.");
  process.exit(1);
}

let url;
try {
  url = new URL(endpoint);
} catch {
  console.error("PRODUCTION_HEALTHCHECK_URL must be a valid URL.");
  process.exit(1);
}
if (url.protocol !== "https:" || !url.pathname.endsWith("/api/health")) {
  console.error("PRODUCTION_HEALTHCHECK_URL must be an HTTPS /api/health URL.");
  process.exit(1);
}

try {
  const response = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", "User-Agent": "splitly-uptime-check/1.0" },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await response.json().catch(() => null);
  const errors = releaseChecks.inspectHealthResponse(
    response.status,
    body,
    process.env.EXPECTED_RELEASE_SHA?.trim(),
  );
  if (errors.length) {
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Splitly is healthy (${body.responseTimeMs} ms database response).`);
  }
} catch (error) {
  console.error(`Health probe failed: ${error instanceof Error ? error.message : "Unknown network error."}`);
  process.exitCode = 1;
}
