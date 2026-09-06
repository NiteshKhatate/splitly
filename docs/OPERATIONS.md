# Splitly Operations Runbook

This runbook covers release checks, monitoring, database recovery, and migration rollback. Never paste credentials, access tokens, user records, or financial rows into tickets or logs.

## Environments

Keep development/test, preview, and production isolated. Automated E2E or restoration tests must never use production `DATABASE_URL`, `DIRECT_URL`, Supabase keys, or real users.

Before release:

1. Store production variables in Vercel environment management, scoped to Production.
2. Run `pnpm check:production` in a secure environment with production variables injected.
3. Run `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`.
4. Run `pnpm exec prisma migrate status` using the production `DIRECT_URL`.
5. Confirm `/api/health` returns HTTP 200 without credentials or connection details.

`pnpm check:production` rejects missing, malformed, short-secret, and example values. It does not print secret values.

## Supabase Auth security audit

The app delegates signup, login, password recovery, and token refresh protection to Supabase Auth. Before launch, create a short-lived, read-only Management API token with `auth_config_read`, then run:

```bash
SUPABASE_ACCESS_TOKEN=... SUPABASE_PROJECT_REF=... APP_URL=https://your-domain.example pnpm check:auth-security
```

The command reads `GET /v1/projects/{ref}/config/auth` and fails unless email confirmation, CAPTCHA, leaked-password protection, password reauthentication, refresh-token rotation, positive provider rate limits, and the production site URL are configured. Never store the Management API token in Vercel or commit it. Delete or revoke it after the audit.

## Monitoring and uptime

- Configure `ERROR_MONITORING_WEBHOOK_URL` and optionally `ERROR_MONITORING_TOKEN` for the server error-ingestion destination.
- Monitor `GET /api/health` externally at least every five minutes. Alert after two consecutive failures and on elevated latency.
- Set the GitHub Actions repository variable `PRODUCTION_HEALTHCHECK_URL` to the production HTTPS `/api/health` URL. `.github/workflows/uptime.yml` probes application and database availability every five minutes and can also be dispatched manually. Configure GitHub Actions failure notifications for the operations owner.
- Run `PRODUCTION_HEALTHCHECK_URL=https://your-domain.example/api/health pnpm check:uptime` for an on-demand probe.
- Configure Vercel deployment-failure notifications and review function errors after every production deployment.
- Logging passes through Splitly redaction before webhook ingestion. Never add passwords, tokens, cookies, email addresses, financial amounts, or notes as unredacted context.

## Backup policy verification

Before launch, an operator must record the Supabase plan, available daily-backup retention, and whether PITR is enabled in the release checklist. Do not infer these settings from application database access.

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
- External uptime monitor status
- Fresh-account, two-user production-like acceptance run

Record the owner, date, environment, and private evidence location in `docs/RELEASE_CHECKLIST.md`. Do not place tokens, screenshots containing user data, or connection strings in the repository.
