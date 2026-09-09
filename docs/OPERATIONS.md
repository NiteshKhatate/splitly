# Splitly Operations Runbook

This runbook covers release checks, monitoring, database recovery, and migration rollback. Never paste credentials, access tokens, user records, or financial rows into tickets or logs.

## Environments

Keep development/test, preview, and production isolated. Automated E2E or restoration tests must never use production `DATABASE_URL`, `DIRECT_URL`, Supabase keys, or real users.

Before release:

1. Store production variables in Vercel environment management, scoped to Production.
2. Run `pnpm check:production` in a secure environment with production variables injected.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
4. Confirm a current recoverable backup and record its private evidence reference.
5. Run the protected `Production release` GitHub workflow. It validates configuration, applies Prisma migrations, verifies migration state, triggers Vercel, and waits for `/api/health` to identify the exact Git commit being released.

Prisma is the sole migration owner. `supabase/config.toml` disables the Supabase CLI migration and seed paths; `supabase/migrations/README.md` documents the handoff. Do not deploy SQL independently from `supabase/migrations`.

The release workflow only guarantees migration-before-code ordering when Vercel automatic production deployments are disabled. Configure a Vercel Deploy Hook as the `VERCEL_DEPLOY_HOOK_URL` production-environment secret, protect the GitHub `production` environment with required reviewers, and deploy production only through this workflow. Preview deployments may remain automatic.

`pnpm check:production` rejects missing, malformed, short-secret, and example values. It does not print secret values.

`APP_URL` is the canonical HTTPS origin for every authentication confirmation, password reset, account email change, and group invitation link. Configure the same origin as Supabase Auth's Site URL and allow these redirect patterns before deploying:

```text
https://your-domain.example/auth/callback
https://your-domain.example/reset-password
https://your-domain.example/invite/*
```

The application uses Vercel's system-provided production URL only as a fallback. It refuses to generate a localhost email link while running in production.

## Supabase Auth security audit

The app delegates signup, login, password recovery, and token refresh protection to Supabase Auth. Before launch, obtain a temporary Management API bearer token. Prefer an OAuth access token with the read-only `auth:read` scope. Supabase evaluates `auth_config_read` as an internal project permission; it is not a token type or dashboard scope that an operator creates. For a one-off operator audit, a personal access token belonging to a project administrator may be used when an OAuth token is unavailable, but it must be revoked immediately after the audit. Then run:

```bash
SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... APP_URL=https://your-domain.example pnpm check:auth-security
```

The command reads `GET /v1/projects/{ref}/config/auth`, whose read-only OAuth scope is `auth:read`, and fails unless the controls available on the configured Supabase Free plan—email confirmation, refresh-token rotation, positive provider rate limits, and the production site URL—are configured. CAPTCHA, leaked-password protection, provider-level eight-character enforcement, and password-change reauthentication are plan-gated or explicitly deferred for this MVP and are reported as non-blocking warnings. Splitly still enforces an eight-character minimum in its signup/reset forms and requires the current password for in-app password changes. Enabling CAPTCHA later requires corresponding CAPTCHA-token support in the authentication forms. Never store the Management API token in Vercel or commit it. Delete or revoke it after the audit.

## Monitoring and uptime

- Configure `ERROR_MONITORING_WEBHOOK_URL` and optionally `ERROR_MONITORING_TOKEN` for the server error-ingestion destination.
- Monitor `GET /api/health` externally at least every five minutes. Alert after two consecutive failures and on elevated latency.
- Set the GitHub Actions repository variable `PRODUCTION_HEALTHCHECK_URL` to the production HTTPS `/api/health` URL. `.github/workflows/uptime.yml` probes application and database availability every five minutes and can also be dispatched manually. Configure GitHub Actions failure notifications for the operations owner.
- Run `PRODUCTION_HEALTHCHECK_URL=https://your-domain.example/api/health pnpm check:uptime` for an on-demand probe.
- Configure Vercel deployment-failure notifications and review function errors after every production deployment.
- Logging passes through Splitly redaction before webhook ingestion. Never add passwords, tokens, cookies, email addresses, financial amounts, or notes as unredacted context.

## Customer domain and reminder handoff

The zero-cost handoff deployment uses `https://splitly-zeta.vercel.app`. `CRON_SECRET` is required for receipt-tombstone and rate-limit maintenance. Scheduled email delivery remains inactive until the customer owns a sending domain; `REMINDER_FROM_EMAIL` and `RESEND_API_KEY` are optional only when both are absent, and partial configuration fails `pnpm check:production`.

When the customer provides a domain:

1. Add and verify the application domain in Vercel, then update `APP_URL`.
2. Update the Supabase Auth Site URL and callback, password-reset, and invitation redirects.
3. Update the GitHub `PRODUCTION_HEALTHCHECK_URL` repository variable.
4. Verify an owned sending domain in Resend.
5. Configure both email reminder variables in Vercel Production and redeploy. Keep the existing `CRON_SECRET`.
6. Configure the optional external error-monitoring webhook if the customer adopts a monitoring provider.
7. Reconfigure Vercel deployment-failure and error-anomaly notifications for the customer's account because notification preferences are per-user.
8. Run `pnpm check:production`, the uptime workflow, and the authenticated email-link smoke tests.

## Backup policy verification

Before launch, an operator must record the Supabase plan, available daily-backup retention, and whether PITR is enabled in the release checklist. Do not infer these settings from application database access.

Production was confirmed on 2026-09-08 to use the Supabase Free plan, with no managed database backups or PITR. Until an independent backup process or paid recovery feature is configured, production database restoration is not guaranteed.

Receipt objects are best-effort attachments for the Free-plan MVP and have no guaranteed recovery. Users must retain their original receipt files. Database restoration does not restore Supabase Storage objects, and the application must not represent receipt uploads as a durable backup service.

Supabase documents that paid projects receive plan-dependent daily backups and that PITR is a separate option. Storage objects are not restored by database backups, so receipt recovery requires a separate storage policy. See [Supabase database backups](https://supabase.com/docs/guides/platform/backups).

Required evidence:

- Screenshot or exported record of the Database > Backups page, stored in the private operations system.
- Earliest and latest restorable points, or the daily-backup retention window.
- A documented receipt-object retention/export policy.
- Named owner and date of the most recent restore exercise.

## Disposable restoration test

Run quarterly and before a major schema release:

1. Create a disposable, non-production Supabase project in the same region and compatible PostgreSQL version.
2. Restore a production backup to a new project using Supabase's restore workflow, or restore a sanitized logical dump.
3. Use temporary `DATABASE_URL` and `DIRECT_URL` values that target only the disposable project.
4. Run `pnpm exec prisma migrate status` and `pnpm exec prisma validate`.
5. Verify representative counts and financial invariants without copying row-level PII into logs.
6. Run the authenticated Playwright acceptance journey against the disposable environment.
7. Delete the disposable project only after recording the test result and confirming no evidence depends on it.

Restoration causes downtime when performed in place. Prefer restore-to-new-project testing where the current plan supports it. See [Supabase restore to a new project](https://supabase.com/docs/guides/platform/clone-project).

## Incident recovery

1. Stop writes by enabling a maintenance deployment.
2. Identify the last known-good timestamp and preserve logs using redacted identifiers.
3. Select the closest backup before the incident, or a PITR target if enabled.
4. Restore through the Supabase dashboard/management workflow. Do not execute ad-hoc schema fixes first.
5. Reapply any required custom database-role passwords because physical/daily backups may not include them.
6. Confirm Prisma migration status, `/api/health`, authentication, group access, balances, settlement confirmation, activity, and private receipt access.
7. Resume traffic only after financial reconciliation and authorization smoke tests pass.

## Prisma migration rollback

Applied migrations are immutable. Do not edit an applied migration and do not use `prisma migrate resolve` to pretend a failed data change was reverted.

For a backward-compatible fault:

1. Roll back the application deployment.
2. Create a new forward migration that reverses the faulty schema change safely.
3. Review data-loss and locking implications.
4. Test the compensating migration against a disposable restored database.
5. Deploy it with `pnpm db:deploy` using `DIRECT_URL`.

For a destructive or data-corrupting fault, use the incident-recovery procedure and restore from backup/PITR. Verify migration history afterward with `pnpm exec prisma migrate status`.

## Release evidence still requiring account access

- Supabase backup/PITR configuration and restoration test
- Supabase Auth abuse/rate-limit configuration
- Vercel GitHub connection, preview and production deployments, domain, environment scopes, and alerts
- GitHub production-environment reviewers, Vercel automatic-production-deploy disablement, and deploy-hook secret
- External uptime monitor status
- Fresh-account, two-user production-like acceptance run

Record the owner, date, environment, and private evidence location in `docs/RELEASE_CHECKLIST.md`. Do not place tokens, screenshots containing user data, or connection strings in the repository.
