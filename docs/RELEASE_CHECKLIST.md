# Splitly Release Checklist

This file records whether release gates were verified, not secret values or screenshots. Keep detailed evidence in the private operations system and link only a non-sensitive evidence identifier here.

## Repository verification

- [x] `pnpm lint`
- [x] `pnpm typecheck`
- [x] `pnpm check:schema`
- [x] `pnpm test --runInBand` (50 suites, 216 tests)
- [x] Public accessibility and access-control Playwright matrix (30 passed, 3 credential-gated checks skipped)
- [x] `pnpm exec next build --webpack`
- [ ] Default Turbopack `pnpm build` in CI/Vercel (local sandbox blocks Turbopack's internal port binding)
- [x] `pnpm audit:production` reviewed (no known vulnerabilities)

## Supabase

- [ ] `pnpm check:auth-security` passes with a short-lived read-only Management API token
- [ ] Security Advisor findings reviewed
- [ ] Production migration status is current using `DIRECT_URL`
- [ ] Backup plan and retention recorded privately
- [ ] PITR decision recorded privately
- [ ] Receipt-object recovery policy confirmed
- [ ] Disposable-project database and receipt restoration completed

## Vercel and monitoring

- [ ] GitHub repository and protected production branch connected
- [ ] Preview deployment passes acceptance smoke tests
- [ ] Production variables pass `pnpm check:production`
- [ ] Production deployment and custom domain verified
- [ ] `PRODUCTION_HEALTHCHECK_URL` repository variable configured
- [ ] Scheduled uptime workflow passes and failure notifications reach the operations owner
- [ ] Error-monitoring webhook and deployment notifications verified

## Acceptance QA

- [x] Keyboard and automated accessibility audit passes for public authentication pages
- [x] Mobile, tablet, and desktop public/access-control journeys pass
- [ ] Performance audit reviewed on the production build
- [ ] Two fresh non-production users complete signup, invitation acceptance, expense, balance, settlement, and activity flow

Release owner: `TBD`

Verification date: `2026-09-06` (repository checks only)

Environment/commit: `Local workspace; commit pending`

Private evidence reference: `TBD`
