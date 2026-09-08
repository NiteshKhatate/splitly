import releaseChecks from "./lib/release-checks.js";

const errors = releaseChecks.inspectProductionEnvironment(process.env);
const warnings = releaseChecks.inspectProductionEnvironmentWarnings(process.env);

for (const warning of warnings) console.warn(`Warning: ${warning}`);

if (errors.length) {
  console.error("Production configuration is not ready:");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log("Production configuration is present, non-placeholder, and structurally valid.");
}
