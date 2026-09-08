# Splitly Release Checklist

This file records whether release gates were verified, not secret values or screenshots. Keep detailed evidence in the private operations system and link only a non-sensitive evidence identifier here.

Current topology: one production deployment backed by the configured Supabase project. No separate preview, staging, or test environment is available.

## Repository verification

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm check:schema`
- [x] `pnpm test --runInBand` (54 suites, 223 tests; rerun 2026-09-08)
- [x] Public accessibility and access-control Playwright matrix (30 passed, 3 credential-gated checks skipped)
- [x] `pnpm exec next build --webpack` (rerun 2026-09-08)
- [x] Default production build completed in Vercel (operator confirmed production deployment on 2026-09-07)
- [x] `pnpm audit:production` reviewed (no known vulnerabilities)

## Supabase

- [x] `pnpm check:auth-security` passes with a temporary Management API bearer token (passed under the documented Free-plan policy with expected non-blocking warnings; operator confirmed and token revoked 2026-09-08)
- Auth audit on 2026-09-08 identified four controls unavailable or deferred on the configured Supabase Free plan: CAPTCHA, leaked-password protection, provider-level eight-character enforcement, and password-change reauthentication. The release owner accepted these as non-blocking MVP warnings. Splitly retains application-level eight-character validation and current-password verification; CAPTCHA must not be enabled until the application submits CAPTCHA tokens.
- [x] Security Advisor findings reviewed (operator accepted the reported function-related warnings for the MVP on 2026-09-08; no dashboard auto-fixes or database changes applied)
- [x] Production migration status is current using `DIRECT_URL` (8 migrations; verified 2026-09-07)
- [ ] Backup plan and retention recorded privately
- [ ] PITR decision recorded privately
- Production Supabase Free plan provides no managed database backups or PITR (operator confirmed 2026-09-08); no restore guarantee currently exists.
- [x] Receipt-object recovery policy confirmed (best-effort Free-plan storage with no guaranteed recovery; operator accepted 2026-09-08)
- [ ] Disposable-project database and receipt restoration completed

## Vercel and monitoring

- [x] GitHub repository connected to Vercel (`NiteshKhatate/splitly`, production branch `main`, automatic production deployments enabled; operator confirmed 2026-09-08)
- [x] GitHub production-branch protection configured for `main` with pull requests, CI status checks, up-to-date branches, conversation resolution, deletion protection, and force-push protection (operator confirmed 2026-09-08)
- [x] Preview/staging deployment intentionally deferred for the current single-environment release
- [x] Production variables pass `pnpm check:production` (passed 2026-09-08 with the expected customer-handoff reminder warning)
- Production check on 2026-09-07 failed because `APP_URL`, `CRON_SECRET`, `REMINDER_FROM_EMAIL`, and `RESEND_API_KEY` were missing.
- `APP_URL=https://splitly-zeta.vercel.app` was configured for Vercel Production (operator confirmed 2026-09-08). Scheduled email reminder delivery is implemented, but `CRON_SECRET`, `REMINDER_FROM_EMAIL`, and `RESEND_API_KEY` are an optional all-or-none customer-handoff configuration pending an owned sending domain.
- Supabase Auth Site URL and production callback, password-reset, and invitation redirects were configured for `https://splitly-zeta.vercel.app` (operator confirmed 2026-09-08).
- [x] Production deployment confirmed by the operator
- [x] Production URL independently verified (`https://splitly-zeta.vercel.app`; database-aware health probe passed on 2026-09-08 with a 1,251 ms database response)
- [x] Custom domain intentionally deferred to customer handoff; production continues on the verified `vercel.app` domain
- [x] `PRODUCTION_HEALTHCHECK_URL` repository variable configured (operator confirmed 2026-09-08)
- [x] Scheduled uptime workflow passes (operator confirmed 2026-09-08)
- [x] Uptime workflow failure notifications reach the operations owner (controlled failure email received 2026-09-08)
- [x] Vercel deployment-failure email notifications verified (operator received a failed-deployment email on 2026-09-08)
- [x] Optional external error-monitoring webhook intentionally deferred to customer handoff; Vercel built-in email/web notifications remain active

## Acceptance QA

- [x] Keyboard and automated accessibility audit passes for public authentication pages
- [x] Mobile, tablet, and desktop public/access-control journeys pass
- [x] Performance audit reviewed on the production build (mobile and desktop: Performance 100, Accessibility 95, Best Practices 100, SEO 100; operator confirmed 2026-09-08)
- [ ] Two fresh non-production users complete signup, invitation acceptance, expense, balance, settlement, and activity flow

Release owner: `TBD`

Verification date: `2026-09-07` (repository and migration checks)

Environment/commit: `Production; 002cd21bc749eb8bf793b35c026f0c6c930224a9`

Private evidence reference: `TBD`
