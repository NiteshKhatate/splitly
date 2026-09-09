# Splitly Production Hardening Status

Last updated: 2026-09-09  
Source audit: `docs/PRODUCTION_READINESS_AUDIT.md`  
Current phase: Batch 1 in progress

## Current state

The MVP implementation remains feature-frozen for production hardening. The current repository has strong unit coverage for deterministic integer-minor-unit calculations, but production readiness is still blocked by operational recovery evidence and unverified real-database controls.

The repository uses Supabase Authentication. The production-hardening additions to `AGENTS.md` and `docs/Splitly_PRODUCTION_HARDENING_PHASE_1.md` also mention Auth.js, which conflicts with the original architecture, `docs/system-design.md`, `docs/BUILD_PLAN.md`, installed dependencies, and current implementation. No authentication-provider migration was performed.

## Audit reconciliation

### Confirmed unresolved

- Production backup/PITR and receipt-object recovery are not demonstrated.
- Real PostgreSQL rollback and two-user Supabase RLS tests cannot run until a dedicated disposable environment is configured.
- Group membership is not yet a commit-time database invariant under concurrent membership changes.
- Prisma and Supabase migration histories remain partially overlapping.
- Currency exponent validation still assumes two decimal digits while accepting arbitrary three-letter codes.
- Expense writes lack optimistic concurrency protection.
- Deployment does not yet enforce migration-before-code ordering.
- Authenticated Playwright tests still skip when CI credentials are absent.
- Expense edits still convert split metadata to `EXACT`.
- Expense history still silently stops after 100 records.
- Settlement creation still lacks idempotency.
- Receipt content validation, object/metadata reconciliation, CSP/HSTS, and handled-500 monitoring remain incomplete.
- Build and release documentation still contains implementation and evidence contradictions.

### Partially remediated in this batch

#### Mixed-currency financial correctness

Implemented:

- Group cards and group detail now carry the authoritative group currency into balance calculation and formatting.
- Expense, settlement, dashboard, detail, and reminder balance consumers fail closed when a ledger row differs from its group currency.
- Expense creation, expense updates, and settlement creation reject a currency different from the group currency.
- The expense form exposes only the authoritative group currency.
- A forward Prisma migration rejects pre-existing inconsistent rows during deployment, enforces group currency on expense and settlement writes, and prevents changing a group's currency after financial activity exists.

Verification:

- Unit and regression tests pass.
- Prisma schema validation passes.
- The migration has not been applied to or tested against a disposable database, so the database-enforced portion is not yet integration verified.

#### Atomic group creation

Implemented:

- Group and owner-membership creation now run in one Prisma transaction.
- The existing PostgreSQL group-activity trigger remains responsible for the initial activity event, placing it in the same transaction.
- Partial-success user messaging was removed.

Verification:

- Unit tests verify that both writes use one transaction and that membership failure propagates.
- Real PostgreSQL rollback remains pending until the disposable integration environment is configured.

#### Real database and RLS test foundation

Implemented:

- Added a separate Node-based Jest integration configuration.
- Added real PostgreSQL rollback, atomic group creation, currency-trigger, server-only ledger, and two-user RLS test cases.
- Added explicit safeguards that reject missing confirmation or reuse of `DATABASE_URL`/`DIRECT_URL`.
- Added a CI job that fails when disposable database or test-user configuration is missing; it does not silently skip.

Verification:

- TypeScript and lint validation pass for the integration test source.
- `pnpm test:integration` currently fails at its required environment preflight because no disposable integration database is configured. No database connection was attempted.

### Remediated and unit verified

#### Authentication redirect security

Implemented:

- Redirects are parsed and normalized against the canonical application origin.
- External origins, protocol-relative values, backslashes, encoded path separators, control characters, and whitespace-padded values fall back to `/dashboard`.
- Absolute same-origin values normalize to internal paths.
- The authentication callback redirects against the canonical origin rather than the untrusted request origin.

Verification:

- Regression tests cover safe relative paths, absolute same-origin URLs, external origins, double slashes, backslashes, encoded separators, control characters, and alternate origins.
- Targeted and full Jest suites pass.

### Already present before this batch

- Integer-minor-unit persisted financial values.
- Deterministic equal, exact, percentage, and weighted allocation.
- Deterministic debt simplification.
- Prisma transactions for expense and settlement writes.
- Server-side membership checks for existing financial mutations.
- RLS on exposed Supabase tables and revoked browser access to server-only ledger tables.
- Production health endpoint, basic security headers, structured logging, and operational runbooks.

### No longer applicable

No original Critical or High audit finding is fully retired solely because documentation declares the build complete. Redirect security is the only finding in this batch that is currently implementation-complete and unit verified; environment-dependent and database-dependent findings require stronger evidence.

### New issue discovered

The current instructions conflict over authentication ownership:

- The established architecture mandates Supabase Authentication.
- Newly added hardening text mandates Auth.js.
- Auth.js is not installed or implemented.

Changing providers would be a major architecture change and is outside a stabilization batch. The documentation should be corrected to identify Supabase Authentication consistently unless an explicit, separately approved migration is intended.

## Files and modules changed in Batch 1

### Currency isolation

- `src/lib/balances/group-balances.ts`
- `src/lib/balances/dashboard-balances.ts`
- `src/lib/balances/group-balance-detail.ts`
- `src/lib/dashboard/overview.ts`
- `src/lib/groups/dashboard.ts`
- `src/lib/groups/details.ts`
- `src/lib/reminders/process-reminders.ts`
- `src/lib/expenses/create-expense.ts`
- `src/lib/expenses/manage-expense.ts`
- `src/lib/settlements/create-settlement.ts`
- `src/components/expenses/add-expense-form.tsx`
- `prisma/migrations/20260909090000_group_currency_invariant/migration.sql`
- Associated Jest regression tests

### Atomic group creation

- `src/lib/groups/create-group.ts`
- `src/app/(dashboard)/groups/new/actions.ts`
- `src/lib/groups/create-group.test.ts`

### Redirect security

- `src/lib/auth/redirects.ts`
- `src/lib/auth/redirects.test.ts`
- `src/app/auth/callback/route.ts`

### Integration foundation

- `jest.integration.config.mjs`
- `jest.config.mjs`
- `tests/integration/database.integration.test.ts`
- `tests/integration/README.md`
- `.github/workflows/ci.yml`
- `package.json`

## Verification results

| Verification | Result | Evidence level |
|---|---|---|
| Targeted Jest | 12 suites, 72 tests passed | Unit verified |
| Full Jest | 55 suites, 241 tests passed | Unit verified |
| ESLint | Passed | Static verification |
| TypeScript | Passed | Static verification |
| Prisma schema validation | Passed | Schema-source verification |
| Next.js production build | Passed with webpack | Build verified |
| Integration preflight | Failed because `TEST_DATABASE_URL` is absent | Correctly blocked; not skipped |
| PostgreSQL/RLS integration behavior | Not run | Environment blocked |
| New migration deployment | Not run | Environment/operations blocked |
| Backup restoration | Not run | Provider/operations blocked |
| Authenticated Playwright | Not rerun in this batch | Still blocked by test credentials |

The existing Tailwind ESM module-type build warning remains and is unrelated to Batch 1.

## Required tests and evidence still outstanding

### Test-verifiable

1. Run `pnpm test:integration` against a dedicated disposable Supabase project.
2. Prove the new currency triggers reject expense and settlement mismatches.
3. Prove a forced intermediate failure rolls back group and activity rows.
4. Prove owner/outsider RLS isolation using two authenticated test users.
5. Add concurrent membership-removal tests after the membership invariant is implemented.
6. Configure CI authenticated Playwright users and remove credential-based skips.

### Environment-dependent

The integration environment must supply:

```text
TEST_DATABASE_URL
TEST_SUPABASE_URL
TEST_SUPABASE_PUBLISHABLE_KEY
TEST_OWNER_EMAIL
TEST_OWNER_PASSWORD
TEST_OUTSIDER_EMAIL
TEST_OUTSIDER_PASSWORD
INTEGRATION_TEST_CONFIRMATION=NON_PRODUCTION_DATABASE_CONFIRMED
```

The test database must have the authoritative Prisma migrations applied and must not share credentials with development runtime, preview, or production.

### Provider- and operations-dependent

Backup/recovery cannot be closed through source changes or unit tests. Required evidence is:

1. A provider-managed backup/PITR entitlement or an automated encrypted independent backup.
2. A separate receipt-object backup strategy.
3. Retention, access control, and named ownership.
4. A restore into a disposable project.
5. Migration-state verification after restoration.
6. Reconciliation of representative users, groups, memberships, expenses, payments, shares, settlements, activities, receipt metadata, receipt objects, and computed balances.
7. A dated operator/reviewer record in the release checklist.

## Recommended remediation order from here

1. Provision the disposable integration environment and apply the new migration there.
2. Run and repair any failures from the PostgreSQL/RLS integration suite.
3. Configure the production recovery capability and complete a restoration drill.
4. Add the commit-time membership invariant and concurrent tests.
5. Consolidate migration ownership and prove blank-database reproducibility.
6. Add financial-write optimistic concurrency and settlement idempotency.
7. Correct currency exponent validation.
8. Enable authenticated Playwright tests in CI without skip behavior.
9. Preserve expense split methods and paginate financial history.
10. Complete receipt, headers, monitoring, deployment-order, and documentation hardening.

## Current release decision

- **Private beta:** Not approved for relied-upon financial data.
- **Public production:** Not approved.
- **Primary blockers:** Recovery evidence, disposable database/RLS verification, unapplied currency-invariant migration, and remaining High-severity concurrency/integrity findings.
