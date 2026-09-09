# Splitly Production Hardening Status

Last updated: 2026-09-09  
Source audit: `docs/PRODUCTION_READINESS_AUDIT.md`  
Decision: repository remediation substantially complete; external release gates remain open

## Outcome

All Critical and High application-code defects identified by the audit have a repository remediation. Splitly is still **not approved for public production** because the new migrations, real RLS/transaction tests, authenticated browser journey, recovery process, and controlled deployment workflow have not been proven in disposable/production-like environments.

The application continues to use Supabase Authentication. The later hardening request's Auth.js line conflicted with the established architecture and installed implementation; changing providers during stabilization would have been a major, unauthorized migration. The conflicting documentation was reconciled to Supabase Authentication.

## Current settlement incident

The reported `settlement_creation_failed` response is caused by database schema drift. The configured Supabase database has six unapplied migrations, including `20260909110000_settlement_idempotency`; the deployed settlement service queries the migration's `settlements.idempotency_key` column. The application must not bypass that column because doing so would remove retry protection from a financial write.

The first pending migration failed safely in its preflight because one INR group contains one USD expense and one confirmed USD settlement, alongside INR ledger records. The failed migration installed no functions or triggers. An operator must determine whether the USD labels are mistakes or the records represent actual USD amounts; Splitly must not silently relabel or convert financial history. After reconciliation, mark the failed attempt rolled back and deploy the complete migration chain. The configured Supabase session-pooler endpoint on port 5432 is supported for Prisma migrations; transaction pooling on port 6543 is not.

## Audit finding disposition

| Finding | Repository status | Verification still required |
|---|---|---|
| C1 mixed-currency balances | Fixed: one authoritative two-decimal currency per group; services fail closed; database triggers enforce it | Apply/test migrations on disposable database |
| C2 backup/recovery | Runbook and release gate improved; cannot be completed in source | Provider backup/PITR or independent encrypted backup plus a real restore drill, including receipt objects |
| H1 atomic group creation | Fixed with a Prisma transaction | Real rollback integration test |
| H2 build-plan mismatch | Fixed by explicitly marking unimplemented profile/group lifecycle work as deferred, without adding features | Product owner accepts reconciled scope |
| H3 authenticated Playwright absent in CI | Fixed in workflow/test configuration; CI now fails when credentials are absent and runs all viewports | Configure CI-only users/secrets and observe a passing run |
| H4 mock-only PostgreSQL/RLS tests | Real disposable integration suite added and CI-gated | Configure disposable project and run it |
| H5 currency exponent ambiguity | Fixed by limiting Phase 1 to INR, USD, EUR, and GBP | Database migration verification |
| H6 membership not a database invariant | Fixed with locked membership triggers, member-removal protection, and historical-data preflight | Apply migrations and pass membership integration test |
| H7 split migration ownership | Fixed: Prisma is authoritative; Supabase CLI migrations/seeding are disabled | Rebuild a blank disposable database from all Prisma migrations |
| H8 authentication redirect | Fixed with canonical-origin parsing and hostile-path regression tests | Authenticated deployed smoke test |
| H9 expense history truncation | Fixed with server-side cursor pagination | Authenticated browser verification with more than one page |
| H10 split method overwritten on edits | Fixed: unchanged allocations preserve their original method | Existing unit regression coverage passes; deployed smoke test recommended |
| H11 stale financial writes | Fixed with `updatedAt` optimistic concurrency on expense update/delete | Real concurrent transaction test recommended |
| H12 unsafe `DIRECT_URL` certification | Fixed preflight rejects an identical runtime URL and transaction-pooler endpoints; Supabase session pooling on port 5432 is valid for Prisma migrations | Verify migration connectivity in the target environment |
| H13 migration/deployment order | Manual protected GitHub workflow added: config check → migrate → verify → Vercel hook → health | Disable automatic production deploys; configure protected environment and hook; exercise against staging/disposable DB |
| M1 settlement idempotency | Fixed with UUID request key and unique constraint | Apply migration; concurrent integration exercise recommended |
| M2 receipt consistency/content validation | Fixed with file signatures, membership checks, deletion tombstones, and retry cleanup | Apply migration; verify scheduled cleanup and storage failure behavior against disposable Supabase |
| M3 redundant ledger queries | Open optimization | Measure with representative data before a data-loader/SQL aggregation rewrite; not a current small-group correctness blocker |
| M4 settlement history index | Fixed with composite group/date/created-at index | Apply migration and capture a representative query plan |
| M5 body limit bypass | Fixed for JSON mutation routes with bounded stream parsing; receipt size still also relies on platform multipart limits | Oversized deployed multipart smoke test |
| M6 unbounded expense participants | Fixed at 10 payers/participants | Unit boundary tests pass |
| M7 CSP/HSTS | HSTS fixed; nonce-based CSP remains open | Convert away from `script-src 'unsafe-inline'` only with deployed Next.js browser verification |
| M8 incomplete monitoring | Fixed for unexpected financial, receipt, settings, member, invitation, export, and cron failures; webhook has a 3-second timeout | Configure a monitoring destination and verify delivery/alerting |
| M9 data-boundary authorization | Fixed for group balance Prisma queries | Unit authorization regression passes; real RLS suite pending |
| M10 design-system drift | Deferred consistency work; no redesign performed | Product/design review if required before public launch |
| M11 contradictory acceptance evidence | Release checklist corrected; gates remain unchecked until proven | Operator evidence and sign-off |
| M12 default onboarding README | Fixed with Splitly setup, checks, migration ownership, and operations links | Clean-checkout onboarding exercise |
| L1 floating GitHub Action tags | Open low-risk supply-chain hardening | Pin reviewed SHAs and enable automated update review |
| L2 rate-limit retention | Fixed with daily 30-day cleanup | Deploy cron and observe a successful run |
| L3 Tailwind ESM warning | Open low-impact build warning | Align package/config module format in a separate compatibility change |

## Additional remediation in the final pass

- Added a forward migration that refuses to certify historical expenses, payments, shares, or settlements whose users are not members of the relevant group.
- Preserved intentional group cascade deletion while preventing direct deletion of financially referenced memberships.
- Added authenticated, daily maintenance for receipt tombstones and expired rate-limit buckets.
- Applied bounded streaming JSON parsing to financial, settings, member, and invitation mutations.
- Expanded handled-500 monitoring and retained PII/financial redaction.
- Added a production release workflow that requires backup evidence and ensures migrations precede the Vercel deploy hook.
- Made `CRON_SECRET` a required production setting and clarified optional email-reminder variables.
- Added real-database membership-invariant coverage to the disposable integration suite.

## Local verification

| Check | Result |
|---|---|
| Targeted Jest | 7 suites, 48 tests passed |
| Full Jest | 58 suites, 263 tests passed |
| ESLint | Passed |
| TypeScript/Next route types | Passed |
| Prisma schema validation | Passed |
| Production webpack build | Passed |
| Production dependency audit | No known vulnerabilities |
| Release workflow syntax | YAML parses; deployed workflow still requires account configuration |
| Playwright public/access-control matrix | 42 passed |
| Authenticated Playwright | 3 skipped locally because non-production accounts are not configured; CI is configured to fail, not skip |
| Real PostgreSQL/Supabase integration | Correctly failed preflight because `TEST_DATABASE_URL` is absent; no database was contacted |
| Default Turbopack build | Blocked by sandbox network access to Google Fonts; the webpack production build passed |
| Production environment check | Correctly failed locally because production variables are not injected |

## External work required

### Release-blocking

1. Provision or reuse a **disposable** Supabase project, apply all 14 Prisma migrations, configure the `TEST_*` variables listed in `.env.example`, and run `pnpm test:integration`.
2. Configure CI-only owner/outsider accounts and the `TEST_*` GitHub secrets; obtain a green CI run including authenticated Playwright on desktop, tablet, and mobile.
3. Establish recoverability: enable provider backups/PITR or an automated encrypted independent database backup, separately back up receipt objects, and complete a dated restore/reconciliation drill.
4. Verify `DIRECT_URL` uses either the Supabase direct endpoint or session pooler on port 5432, then rerun `pnpm check:production` and Prisma migration status.
5. In GitHub, protect the `production` environment with reviewers and add the production secrets/variables used by `.github/workflows/release.yml`.
6. In Vercel, disable automatic production deployment, create a Deploy Hook, save it as `VERCEL_DEPLOY_HOOK_URL`, add the newly required `CRON_SECRET`, and release only through the protected workflow.
7. Run a two-user production-like acceptance journey and confirm `/api/cron/maintenance`, `/api/health`, monitoring delivery, and receipt cleanup.
8. Name a release owner and record dates plus private evidence references in `docs/RELEASE_CHECKLIST.md`.

### Recommended before broad public scale

- Replace the inline-script CSP allowance with a nonce-based policy and test it against the deployed Next.js application.
- Measure dashboard query count/latency using representative ledger sizes, then consolidate/aggregate only if the evidence warrants it.
- Pin GitHub Actions to reviewed commit SHAs.
- Resolve the Tailwind module-format warning.
- Conduct a final design-system/accessibility review without redesigning the application.

## Release assessment

- **Private beta:** Conditionally safe only after items 1–4 above pass and beta users are told the receipt/recovery guarantees. If data is relied upon, item 3 is mandatory.
- **Public production:** Not safe until all release-blocking external work is complete and signed off.
- **Recommended next step:** Configure the disposable Supabase/CI environment and run the migration plus RLS/transaction suite. It is the fastest way to validate the largest remaining body of risk before touching production.
