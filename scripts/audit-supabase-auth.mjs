import releaseChecks from "./lib/release-checks.js";

const accessToken = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const projectRef = process.env.SUPABASE_PROJECT_REF?.trim();

if (!accessToken || !projectRef) {
  console.error("Set SUPABASE_ACCESS_TOKEN and SUPABASE_PROJECT_REF to run the read-only Auth audit.");
  process.exit(1);
}

let response;
try {
  response = await fetch(`https://api.supabase.com/v1/projects/${encodeURIComponent(projectRef)}/config/auth`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    signal: AbortSignal.timeout(15_000),
  });
} catch (error) {
  console.error(`Supabase Auth audit could not reach the Management API: ${error instanceof Error ? error.message : "Unknown network error."}`);
  process.exit(1);
}

if (!response.ok) {
  console.error(`Supabase Auth audit request failed with HTTP ${response.status}.`);
  process.exit(1);
}

const config = await response.json();
const errors = releaseChecks.inspectAuthConfig(config, process.env.APP_URL);

if (errors.length) {
  console.error("Supabase Auth configuration is not release-ready:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Supabase Auth endpoint protection and rate-limit configuration passed the audit.");
}
