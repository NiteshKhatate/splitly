const PLACEHOLDER_PATTERN = /(example\.com|placeholder|project_ref|publishable_key|secret_key|resend_api_key|user:password|generate_a_long_random_secret)/i;

function parseHttpsUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url : null;
  } catch {
    return null;
  }
}

function inspectProductionEnvironment(environment) {
  const required = [
    "APP_URL",
    "CRON_SECRET",
    "DATABASE_URL",
    "DIRECT_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "SUPABASE_SECRET_KEY",
  ];
  const reminderVariables = ["REMINDER_FROM_EMAIL", "RESEND_API_KEY"];
  const errors = [];

  for (const name of required) {
    const value = environment[name]?.trim();
    if (!value) errors.push(`${name} is missing.`);
    else if (PLACEHOLDER_PATTERN.test(value)) errors.push(`${name} still contains an example value.`);
  }

  const configuredReminderVariables = reminderVariables.filter((name) => environment[name]?.trim());
  if (configuredReminderVariables.length > 0 && configuredReminderVariables.length < reminderVariables.length) {
    for (const name of reminderVariables) {
      if (!environment[name]?.trim()) errors.push(`${name} is required when scheduled email reminders are configured.`);
    }
  }

  for (const name of ["APP_URL", "NEXT_PUBLIC_SUPABASE_URL"]) {
    const value = environment[name]?.trim();
    if (value && !parseHttpsUrl(value)) errors.push(`${name} must be a valid HTTPS URL.`);
  }

  const appUrl = environment.APP_URL?.trim();
  const parsedAppUrl = appUrl ? parseHttpsUrl(appUrl) : null;
  if (parsedAppUrl && (parsedAppUrl.pathname !== "/" || parsedAppUrl.search || parsedAppUrl.hash)) {
    errors.push("APP_URL must be an origin without a path, query, or fragment.");
  }

  for (const name of ["DATABASE_URL", "DIRECT_URL"]) {
    const value = environment[name]?.trim();
    if (!value) continue;
    try {
      const url = new URL(value);
      if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.pathname.slice(1)) {
        errors.push(`${name} must be a complete PostgreSQL connection URL.`);
      }
    } catch {
      errors.push(`${name} must be a complete PostgreSQL connection URL.`);
    }
  }

  const runtimeConnection = environment.DATABASE_URL?.trim();
  const migrationConnection = environment.DIRECT_URL?.trim();
  if (runtimeConnection && migrationConnection && runtimeConnection === migrationConnection) {
    errors.push("DATABASE_URL and DIRECT_URL must use distinct runtime and migration connections.");
  }
  if (migrationConnection) {
    try {
      const directUrl = new URL(migrationConnection);
      if (directUrl.hostname.endsWith(".pooler.supabase.com")) {
        errors.push("DIRECT_URL must use the Supabase direct database host, not a pooler host.");
      }
    } catch {
      // The structural URL error is reported above.
    }
  }

  if (environment.CRON_SECRET && environment.CRON_SECRET.trim().length < 32) {
    errors.push("CRON_SECRET must contain at least 32 characters.");
  }
  if (
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    && environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY === environment.SUPABASE_SECRET_KEY
  ) {
    errors.push("The Supabase publishable and secret keys must be different.");
  }
  if (environment.ERROR_MONITORING_TOKEN && !environment.ERROR_MONITORING_WEBHOOK_URL) {
    errors.push("ERROR_MONITORING_WEBHOOK_URL is required when ERROR_MONITORING_TOKEN is set.");
  }
  if (environment.ERROR_MONITORING_WEBHOOK_URL && !parseHttpsUrl(environment.ERROR_MONITORING_WEBHOOK_URL)) {
    errors.push("ERROR_MONITORING_WEBHOOK_URL must be a valid HTTPS URL.");
  }

  return errors;
}

function inspectProductionEnvironmentWarnings(environment) {
  const reminderVariables = ["REMINDER_FROM_EMAIL", "RESEND_API_KEY"];
  return reminderVariables.every((name) => !environment[name]?.trim())
    ? ["Scheduled email reminders are deferred until the customer configures an owned sending domain."]
    : [];
}

function inspectAuthConfig(config, expectedSiteUrl) {
  const errors = [];
  const requiredPositiveLimits = [
    "rate_limit_email_sent",
    "rate_limit_otp",
    "rate_limit_token_refresh",
    "rate_limit_verify",
  ];

  if (config.external_email_enabled !== true) errors.push("Email authentication is not enabled.");
  if (config.mailer_autoconfirm !== false) errors.push("Email confirmation is disabled or could not be verified.");
  if (
    config.security_captcha_enabled === true
    && (typeof config.security_captcha_provider !== "string" || !config.security_captcha_provider)
  ) {
    errors.push("The CAPTCHA provider could not be verified.");
  }
  if (config.refresh_token_rotation_enabled !== true) errors.push("Refresh-token rotation is not enabled.");
  for (const name of requiredPositiveLimits) {
    if (!Number.isFinite(config[name]) || config[name] < 1) errors.push(`${name} must be a positive limit.`);
  }

  if (expectedSiteUrl) {
    const configured = parseHttpsUrl(String(config.site_url ?? ""));
    const expected = parseHttpsUrl(expectedSiteUrl);
    if (!configured || !expected || configured.origin !== expected.origin) {
      errors.push("The Supabase Auth site URL does not match APP_URL.");
    }
  }
  return errors;
}

function inspectAuthConfigWarnings(config) {
  const warnings = [];
  if (config.security_captcha_enabled !== true) {
    warnings.push("CAPTCHA protection is intentionally deferred for the Free-plan MVP.");
  }
  if (config.password_hibp_enabled !== true) {
    warnings.push("Supabase leaked-password protection is unavailable on the configured Free plan.");
  }
  if (!Number.isFinite(config.password_min_length) || config.password_min_length < 8) {
    warnings.push("The Supabase provider cannot enforce the desired 8-character minimum on the configured Free plan; Splitly still enforces it in application forms.");
  }
  if (config.security_update_password_require_reauthentication !== true) {
    warnings.push("Supabase password-change reauthentication is unavailable on the configured Free plan; Splitly requires the current password for in-app changes.");
  }
  return warnings;
}

function inspectHealthResponse(status, body, expectedRelease) {
  const errors = [];
  if (status !== 200) errors.push(`Health endpoint returned HTTP ${status}.`);
  if (!body || body.status !== "ok" || body.database !== "available") {
    errors.push("Health response did not confirm application and database availability.");
  }
  if (!Number.isFinite(body?.responseTimeMs) || body.responseTimeMs < 0) {
    errors.push("Health response did not contain a valid response time.");
  }
  if (expectedRelease && body?.release !== expectedRelease) {
    errors.push("Health response does not identify the expected application release.");
  }
  return errors;
}

module.exports = {
  inspectAuthConfig,
  inspectAuthConfigWarnings,
  inspectHealthResponse,
  inspectProductionEnvironment,
  inspectProductionEnvironmentWarnings,
};
