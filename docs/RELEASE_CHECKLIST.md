# Splitly Release Checklist

This file records whether release gates were verified, not secret values or screenshots. Keep detailed evidence in the private operations system and link only a non-sensitive evidence identifier here.

Current topology: one production deployment backed by the configured Supabase project. No separate preview, staging, or test environment is available.

## Repository verification

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm check:schema`
- [x] `pnpm test --runInBand` (53 suites, 222 tests)
- [x] Public accessibility and access-control Playwright matrix (30 passed, 3 credential-gated checks skipped)
- [x] `pnpm exec next build --webpack`
- [x] Default production build completed in Vercel (operator confirmed production deployment on 2026-09-07)
- [x] `pnpm audit:production` reviewed (no known vulnerabilities)

## Supabase

- [ ] `pnpm check:auth-security` passes with a short-lived read-only Management API token
- [ ] Security Advisor findings reviewed
- [x] Production migration status is current using `DIRECT_URL` (8 migrations; verified 2026-09-07)
- [ ] Backup plan and retention recorded privately
- [ ] PITR decision recorded privately
- [ ] Receipt-object recovery policy confirmed
- [ ] Disposable-project database and receipt restoration completed

## Vercel and monitoring

- [ ] GitHub repository and protected production branch connected
- [x] Preview/staging deployment intentionally deferred for the current single-environment release
- [ ] Production variables pass `pnpm check:production`
- Production check on 2026-09-07: failed because `APP_URL`, `CRON_SECRET`, `REMINDER_FROM_EMAIL`, and `RESEND_API_KEY` are missing.
- [x] Production deployment confirmed by the operator
- [ ] Production URL and custom domain independently verified
- [ ] `PRODUCTION_HEALTHCHECK_URL` repository variable configured
- [ ] Scheduled uptime workflow passes and failure notifications reach the operations owner
- [ ] Error-monitoring webhook and deployment notifications verified

## Acceptance QA

- [x] Keyboard and automated accessibility audit passes for public authentication pages
- [x] Mobile, tablet, and desktop public/access-control journeys pass
- [ ] Performance audit reviewed on the production build
- [ ] Two fresh non-production users complete signup, invitation acceptance, expense, balance, settlement, and activity flow

Release owner: `TBD`

Verification date: `2026-09-07` (repository and migration checks)

Environment/commit: `Production; 002cd21bc749eb8bf793b35c026f0c6c930224a9`

Private evidence reference: `TBD`
