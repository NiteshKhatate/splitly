const required = [
  "APP_URL",
  "CRON_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "REMINDER_FROM_EMAIL",
  "RESEND_API_KEY",
  "SUPABASE_SECRET_KEY",
];

const missing = required.filter((name) => !process.env[name]?.trim());
const invalid = [];

for (const name of ["APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
  const value = process.env[name];
  if (!value) continue;
  try {
    if (new URL(value).protocol !== "https:") invalid.push(name);
  } catch {
    invalid.push(name);
  }
}

for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
  const value = process.env[name];
  if (value && !/^postgres(?:ql)?:\/\//.test(value)) invalid.push(name);
}

if (missing.length || invalid.length) {
  if (missing.length) console.error(`Missing production variables: ${missing.join(", ")}`);
  if (invalid.length) console.error(`Invalid production variables: ${invalid.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log("Required production configuration is present and structurally valid.");
}
