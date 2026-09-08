/** @jest-environment node */
/* eslint-disable @typescript-eslint/no-require-imports */

const {
  inspectAuthConfig,
  inspectAuthConfigWarnings,
  inspectHealthResponse,
  inspectProductionEnvironment,
  inspectProductionEnvironmentWarnings,
} = require("./release-checks");

const validEnvironment = {
  APP_URL: "https://splitly.test",
  CRON_SECRET: "a-secure-random-value-with-more-than-32-characters",
  DATABASE_URL: "postgresql://runtime:password@pool.splitly.test:6543/splitly",
  DIRECT_URL: "postgresql://migrate:password@db.splitly.test:5432/splitly",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_realistic-value",
  NEXT_PUBLIC_SUPABASE_URL: "https://splitly.supabase.co",
  REMINDER_FROM_EMAIL: "Splitly <reminders@splitly.test>",
  RESEND_API_KEY: "re_realistic-value",
  SUPABASE_SECRET_KEY: "sb_secret_realistic-value",
};

describe("release checks", () => {
  it("accepts complete production configuration and rejects placeholders", () => {
    expect(inspectProductionEnvironment(validEnvironment)).toEqual([]);
    expect(inspectProductionEnvironment({ ...validEnvironment, APP_URL: "https://splitly.example.com" }))
      .toContain("APP_URL still contains an example value.");
  });

  it("rejects weak secrets, malformed database URLs, and mismatched keys", () => {
    const errors = inspectProductionEnvironment({
      ...validEnvironment,
      CRON_SECRET: "short",
      DATABASE_URL: "mysql://db.test/splitly",
      SUPABASE_SECRET_KEY: validEnvironment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    });
    expect(errors).toEqual(expect.arrayContaining([
      "CRON_SECRET must contain at least 32 characters.",
      "DATABASE_URL must be a complete PostgreSQL connection URL.",
      "The Supabase publishable and secret keys must be different.",
    ]));
  });

  it("allows deferred reminders but rejects partial reminder configuration", () => {
    const deferredEnvironment = { ...validEnvironment };
    delete deferredEnvironment.CRON_SECRET;
    delete deferredEnvironment.REMINDER_FROM_EMAIL;
    delete deferredEnvironment.RESEND_API_KEY;

    expect(inspectProductionEnvironment(deferredEnvironment)).toEqual([]);
    expect(inspectProductionEnvironmentWarnings(deferredEnvironment)).toEqual([
      "Scheduled email reminders are deferred until the customer configures an owned sending domain.",
    ]);
    expect(inspectProductionEnvironment({ ...deferredEnvironment, CRON_SECRET: validEnvironment.CRON_SECRET }))
      .toEqual(expect.arrayContaining([
        "REMINDER_FROM_EMAIL is required when scheduled email reminders are configured.",
        "RESEND_API_KEY is required when scheduled email reminders are configured.",
      ]));
  });

  it("audits security-sensitive Supabase Auth configuration", () => {
    const secureConfig = {
      external_email_enabled: true,
      mailer_autoconfirm: false,
      password_hibp_enabled: true,
      password_min_length: 10,
      rate_limit_email_sent: 2,
      rate_limit_otp: 360,
      rate_limit_token_refresh: 1800,
      rate_limit_verify: 360,
      refresh_token_rotation_enabled: true,
      security_captcha_enabled: true,
      security_captcha_provider: "turnstile",
      security_update_password_require_reauthentication: true,
      site_url: "https://splitly.test",
    };
    expect(inspectAuthConfig(secureConfig, "https://splitly.test")).toEqual([]);
    const freePlanConfig = {
      ...secureConfig,
      password_hibp_enabled: false,
      password_min_length: 6,
      security_captcha_enabled: false,
      security_update_password_require_reauthentication: false,
    };
    expect(inspectAuthConfig(freePlanConfig, "https://splitly.test")).toEqual([]);
    expect(inspectAuthConfigWarnings(freePlanConfig)).toHaveLength(4);
    expect(inspectAuthConfigWarnings(secureConfig)).toEqual([]);
    expect(inspectAuthConfig({ ...secureConfig, security_captcha_provider: "" }, "https://splitly.test"))
      .toContain("The CAPTCHA provider could not be verified.");
  });

  it("validates both health status and database availability", () => {
    expect(inspectHealthResponse(200, { database: "available", responseTimeMs: 12, status: "ok" })).toEqual([]);
    expect(inspectHealthResponse(503, { database: "unavailable", responseTimeMs: 4, status: "degraded" })).toHaveLength(2);
  });
});
