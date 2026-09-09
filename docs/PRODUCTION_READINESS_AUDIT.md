# Splitly Production-Readiness Audit

> Historical baseline: remediation has since been performed. See `docs/PRODUCTION_HARDENING_STATUS.md` for the current disposition, verification results, and remaining external release gates.

Audit date: 2026-09-09  
Scope: Current repository implementation after completion of `docs/BUILD_PLAN.md`

No application files were modified during the audit. `docs/BUILD_PLAN.md` was treated as a declaration of completion, and the implementation and operational evidence were audited against that declaration.

## Verification performed

| Check | Result |
|---|---|
| ESLint | Passed |
| TypeScript | Passed |
| Prisma schema check | Passed |
| Jest | 54 suites, 223 tests passed |
| Jest coverage | 87.22% statements, 71.65% branches |
| Production build | Passed with webpack |
| Playwright | 42 passed, 3 skipped |
| Prisma migration status | 8 migrations; database up to date |
| Production dependency audit | No known vulnerabilities |
| Environment readiness script | Passed with deferred-control warnings |
| Production health endpoint | Healthy; database response approximately 1.27 seconds |

The default Turbopack build could not bind a sandbox port, but the equivalent production webpack build succeeded. This is not assessed as a repository defect.

## Positive observations

The financial core has several strong foundations:

- Amounts are represented in integer minor units.
- Equal and percentage allocation use deterministic largest-remainder rounding.
- Exact, percentage, and share-weight splits preserve totals.
- Debt simplification is deterministic.
- Only confirmed settlements affect balances.
- Expense creation, editing, deletion, and settlement confirmation use Prisma transactions.
- Soft-deleted expenses are excluded from the principal balance calculations.
- Server-side Zod validation is used on important financial boundaries.
- RLS is enabled for exposed Supabase tables; server-only ledger tables are revoked from browser roles.
- No committed production secrets were found.
- Health checking, structured logging, security headers, CI, CSV exports, and receipt restrictions already exist.

These strengths do not remove the blockers below.

## 🔴 Critical — must fix before production

### C1. Mixed-currency balances are combined and displayed as INR

- **Problem:** Group cards and group-detail summaries accumulate expenses and settlements without separating them by currency. The resulting number is always formatted as INR.
- **Why it matters:** An INR expense and a USD expense can be added together as if they were the same unit. This produces materially false debts and is the most serious financial-correctness issue found.
- **Relevant files:** `src/lib/balances/group-balances.ts`, `src/lib/groups/dashboard.ts`, `src/lib/groups/details.ts`
- **Recommended fix:** Return balances keyed by currency and display one balance per currency. For Phase 1, the safer alternative is to enforce a single currency per group and reject mismatched expenses and settlements.
- **Test:** Yes. Add mixed-currency regression tests for group cards, group detail, expenses, settlements, and zero-balance states.

### C2. Production data is not demonstrably recoverable

- **Problem:** Operations documentation says the current Supabase plan does not provide managed backups/PITR, and the required disposable restoration test remains incomplete. Receipt storage recovery is also not guaranteed.
- **Why it matters:** Splitly is a financial ledger. Database loss, operator error, or migration damage could permanently destroy balances and transaction history.
- **Relevant files:** `docs/OPERATIONS.md`, `docs/RELEASE_CHECKLIST.md`, `docs/BUILD_PLAN.md`
- **Recommended fix:** Enable provider backups/PITR or establish automated encrypted database and receipt-object backups. Perform a clean restoration into a disposable environment and reconcile representative financial totals.
- **Test:** Yes. This requires a recorded restoration drill rather than a Jest test.

## 🟠 High — should fix before production

### H1. Group creation is not atomic

- **Problem:** The group is inserted first and owner membership is inserted separately. Membership failure leaves an inaccessible or partially initialized group.
- **Why it matters:** A transient failure can create orphaned records and a misleading activity trail.
- **Relevant files:** `src/app/(dashboard)/groups/new/actions.ts`, `prisma/migrations/20260905130000_group_activity_events/migration.sql`
- **Recommended fix:** Create the group, owner membership, and initial activity event inside one database transaction or transactional database function.
- **Test:** Yes. Add an integration test that forces membership creation to fail and verifies complete rollback.

### H2. The completed build-plan claim does not match the implementation

- **Problem:** The plan marks preferred currency, timezone, member role management, member removal, leaving groups, and group archiving complete. Corresponding schema fields and workflows are absent.
- **Why it matters:** Release decisions based on the plan will overstate product completeness and authorization coverage.
- **Relevant files:** `docs/BUILD_PLAN.md`, `prisma/schema.prisma`, `src/app/(dashboard)/groups/[groupId]/member-actions.ts`
- **Recommended fix:** Reconcile the plan with the actual Phase 1 acceptance criteria. Either implement these already-promised requirements in a later authorized remediation phase or explicitly defer them and update release criteria.
- **Test:** Yes. Role changes, removal, leave, and archive behavior need authorization and lifecycle coverage if retained in Phase 1.

### H3. Authenticated Playwright flows do not run in CI

- **Problem:** The authenticated suite requires account variables that CI does not provide. It also runs only under the tablet project. The current run passed 42 tests but skipped all three authenticated instances.
- **Why it matters:** Expense creation, editing, deletion, settlement confirmation, membership isolation, and receipt flows do not gate merges.
- **Relevant files:** `.github/workflows/ci.yml`, `tests/e2e/authenticated-critical-workflows.spec.ts`, `playwright.config.ts`
- **Recommended fix:** Provision deterministic CI-only users and data, fail rather than skip when CI credentials are absent, and run critical flows on at least desktop and mobile.
- **Test:** Yes. The authenticated Playwright suite is the required test.

### H4. Transaction and RLS tests are mock-only

- **Problem:** Rollback tests mock Prisma's `$transaction`; there is no test exercising real PostgreSQL constraints, rollback behavior, or Supabase RLS with two authenticated users.
- **Why it matters:** Mocks cannot prove atomicity, isolation, triggers, constraints, grants, or RLS policies.
- **Relevant files:** `src/lib/expenses/create-expense.test.ts`, `src/lib/expenses/manage-expense.test.ts`, `src/lib/settlements/create-settlement.test.ts`
- **Recommended fix:** Add a disposable PostgreSQL/Supabase integration suite covering rollback, constraints, RLS, cross-group reads, and unauthorized mutations.
- **Test:** Yes.

### H5. Currency validation assumes every currency has two decimal places

- **Problem:** The server accepts any three-letter uppercase currency but always multiplies amounts by 100.
- **Why it matters:** JPY, KWD, and other zero- or three-decimal currencies will be stored incorrectly. Crafted requests can bypass the currencies exposed by the UI.
- **Relevant files:** `src/lib/validations/expenses.ts`, `src/lib/validations/settlements.ts`
- **Recommended fix:** Whitelist currencies with two minor-unit digits for Phase 1, or introduce authoritative ISO-4217 exponent metadata throughout parsing and formatting.
- **Test:** Yes. Test INR/USD plus rejected or correctly processed JPY and KWD inputs.

### H6. Group-membership validity is not a database invariant

- **Problem:** Expense payers, share participants, and settlement participants reference users, but the database does not enforce that those users belong to the relevant group. Membership is checked before inserts under normal transaction isolation.
- **Why it matters:** Concurrent membership changes or future code paths can leave ledger rows referring to non-members.
- **Relevant files:** `prisma/schema.prisma`, `src/lib/expenses/create-expense.ts`, `src/lib/expenses/update-expense.ts`, `src/lib/settlements/create-settlement.ts`
- **Recommended fix:** Enforce membership with database constraints or triggers, or lock and revalidate membership within a serializable transaction.
- **Test:** Yes. Add concurrent membership-removal integration tests.

### H7. Database ownership is split between two inconsistent migration systems

- **Problem:** Both `prisma/migrations` and `supabase/migrations` contain schema history. Prisma has eight current migrations, while Supabase has only an earlier partial history. Supabase config also refers to a seed file that does not exist.
- **Why it matters:** A clean `supabase db reset`, a Prisma deployment, and a Supabase migration deployment do not necessarily create the same database.
- **Relevant files:** `prisma/migrations/`, `supabase/migrations/`, `supabase/config.toml`, `prisma.config.ts`
- **Recommended fix:** Establish one authoritative migration chain. Include all RLS, functions, and triggers in it and prove that a blank database can be created deterministically.
- **Test:** Yes. CI should migrate a blank database and compare its migration state.

### H8. Authentication redirects permit a backslash open redirect

- **Problem:** Redirect validation rejects `//evil.example` but accepts `/\\evil.example`. URL normalization treats that as an external host.
- **Why it matters:** A successful authentication flow can redirect users to an attacker-controlled site, enabling convincing phishing flows.
- **Relevant files:** `src/lib/auth/redirects.ts`, `src/app/auth/callback/route.ts`, `src/lib/auth/redirects.test.ts`
- **Recommended fix:** Parse against the application origin and accept the redirect only when the resulting origin matches exactly. Reject backslashes and encoded authority-like forms.
- **Test:** Yes. Add backslash, encoded slash/backslash, control-character, and alternate-origin cases.

### H9. Expense history silently stops after 100 records

- **Problem:** The expense query uses `take: 100`, but the page has no pagination or indication that older records exist.
- **Why it matters:** Users can believe the displayed list is their complete financial history when older expenses have been omitted.
- **Relevant files:** `src/lib/expenses/list-expenses.ts`, `src/app/(dashboard)/expenses/page.tsx`
- **Recommended fix:** Add cursor pagination or an explicit “load more” flow, keeping filters server-side.
- **Test:** Yes. Verify navigation and filtering across more than 100 expenses.

### H10. Expense editing destroys the original split method

- **Problem:** Existing splits are loaded as exact amounts, and every edit writes `EXACT` as the split method—even when the expense was created using equal, percentage, or weighted shares.
- **Why it matters:** Description-only edits rewrite financial metadata and make the audit history misleading.
- **Relevant files:** `src/lib/expenses/expense-detail.ts`, `src/app/(dashboard)/expenses/[expenseId]/edit/page.tsx`, `src/lib/expenses/manage-expense.ts`
- **Recommended fix:** Preserve unchanged split methods and the inputs needed to reconstruct percentages or weights. Only convert when the user explicitly changes the method.
- **Test:** Yes. Add edit-without-financial-change tests for all four split methods.

### H11. Financial writes lack concurrency/version protection

- **Problem:** Expense updates and deletes read state and then mutate it without an `updatedAt` version condition. Concurrent edits are last-write-wins, and an edit can race a soft delete.
- **Why it matters:** A financial record can be unintentionally overwritten or receive contradictory activity events.
- **Relevant files:** `src/lib/expenses/manage-expense.ts`, `prisma/schema.prisma`
- **Recommended fix:** Use optimistic concurrency with the record's last-seen version, reject stale updates, and recheck `deletedAt` inside the mutation.
- **Test:** Yes. Add concurrent edit/edit and edit/delete integration tests.

### H12. `DIRECT_URL` is not demonstrably a direct database connection

- **Problem:** Migration status resolved the configured direct URL to a `*.pooler.supabase.com:5432` host. Readiness validation only checks that the variable exists and is PostgreSQL-shaped.
- **Why it matters:** Production migrations may be routed through an unsuitable pooler, and the check can incorrectly certify a misconfigured environment.
- **Relevant files:** `prisma.config.ts`, `src/lib/config/release-checks.ts`, `.env.example`
- **Recommended fix:** Use the provider's documented direct endpoint for migrations, keep the runtime URL on the correct application pooler, and validate that the two endpoints have the intended roles.
- **Test:** Yes. Add a deployment preflight that checks connectivity and performs a migration-status query through `DIRECT_URL`.

### H13. Deployment does not enforce migration-before-code ordering

- **Problem:** Migration instructions are manual and separate from Vercel deployment.
- **Why it matters:** Code can be deployed before its required schema, creating avoidable production outages or partial writes.
- **Relevant files:** `docs/OPERATIONS.md`, `.github/workflows/ci.yml`, `vercel.json`
- **Recommended fix:** Define an explicit release workflow with backup, migration, migration verification, application deployment, smoke testing, and rollback ownership.
- **Test:** Yes. Exercise it against staging or an ephemeral production-like database.

## 🟡 Medium — should fix soon

### M1. Settlement creation is not idempotent

- **Problem:** Repeated submissions can create duplicate pending settlements. Button disabling reduces ordinary double clicks but does not cover network retries.
- **Why it matters:** Duplicate confirmations can double-count repayments.
- **Relevant files:** `src/lib/settlements/create-settlement.ts`, `src/components/settlements/settlement-form.tsx`
- **Recommended fix:** Add an idempotency key or stable client submission token backed by a unique constraint.
- **Test:** Yes. Resubmit the same token concurrently and assert one settlement.

### M2. Receipt deletion is non-atomic and content validation trusts MIME metadata

- **Problem:** Storage is deleted before database metadata; a database failure leaves broken metadata. Upload validation trusts `File.type` without checking content signatures.
- **Why it matters:** Receipt records can point to missing objects, and disguised content can be stored under an allowed MIME type.
- **Relevant files:** `src/app/api/expenses/[expenseId]/receipts/[attachmentId]/route.ts`, `src/lib/validations/receipts.ts`, `src/app/api/expenses/[expenseId]/receipts/route.ts`
- **Recommended fix:** Mark records for deletion before object removal and support retry/reconciliation. Verify basic file signatures and normalize images before serving where practical.
- **Test:** Yes. Cover storage failure, database failure, retry, mismatched signatures, and deleted-expense behavior.

### M3. Dashboard and balance pages repeatedly load overlapping ledger data

- **Problem:** The dashboard calls several independent services that refetch groups, expenses, settlements, and memberships. Some balance pages load the complete group ledger.
- **Why it matters:** Query count and memory use will grow with each user's history and can make dashboard latency unpredictable.
- **Relevant files:** `src/app/(dashboard)/dashboard/page.tsx`, `src/lib/dashboard/overview.ts`, `src/lib/balances/group-balance-detail.ts`
- **Recommended fix:** Consolidate authorized data loading, aggregate in SQL where useful, and paginate historical data.
- **Test:** Yes. Add query-count and large-fixture performance checks.

### M4. Missing indexes for common settlement history ordering

- **Problem:** Settlement history is commonly scoped by group and ordered by date and creation time, but the current index is only group-based.
- **Why it matters:** History and balance queries will increasingly sort larger group result sets.
- **Relevant files:** `prisma/schema.prisma`
- **Recommended fix:** Validate query plans with representative volumes and add a composite group/date/created-at index if confirmed.
- **Test:** No unit test. Record `EXPLAIN ANALYZE` evidence in a migration review.

### M5. The application's body-size guard can be bypassed when `Content-Length` is absent

- **Problem:** The guard treats a missing or chunked `Content-Length` as zero, after which handlers can parse the full body.
- **Why it matters:** The application-level request limit does not reliably protect JSON and multipart parsing.
- **Relevant files:** `src/lib/security/request-guards.ts`, `src/proxy.ts`
- **Recommended fix:** Enforce streaming or platform-level limits and reject unsupported transfer patterns where appropriate.
- **Test:** Yes. Send an oversized request without `Content-Length`.

### M6. Expense payloads have no participant-count maximum

- **Problem:** Expense payer and participant arrays require at least one entry but have no Phase 1 maximum.
- **Why it matters:** Large crafted requests increase validation, query, and transaction load and diverge from the stated small-group target.
- **Relevant files:** `src/lib/validations/expenses.ts`
- **Recommended fix:** Enforce the documented group/participant maximum at both validation and database/business boundaries.
- **Test:** Yes. Add boundary tests at and above the maximum.

### M7. CSP permits inline scripts and HSTS is absent

- **Problem:** Production CSP includes `'unsafe-inline'` for scripts, and no Strict-Transport-Security header is configured.
- **Why it matters:** This weakens defense against XSS and transport downgrade or misconfiguration.
- **Relevant files:** `next.config.ts`
- **Recommended fix:** Move to nonce- or hash-based CSP compatible with the deployed Next.js version and enable HSTS after confirming HTTPS-only operation.
- **Test:** Yes. Add header assertions and a deployed smoke check.

### M8. Error monitoring misses many handled 500 responses

- **Problem:** Several route handlers convert unexpected exceptions into generic 500 responses without sending them to the configured monitoring boundary. The monitoring webhook request also has no timeout.
- **Why it matters:** Production failures can be invisible, while a slow monitoring service can delay error handling.
- **Relevant files:** `src/lib/monitoring/server-monitor.ts`, `src/instrumentation.ts`, `src/app/api/settlements/route.ts`
- **Recommended fix:** Capture unexpected handler exceptions centrally with request IDs and a short webhook timeout. Keep user-facing responses generic.
- **Test:** Yes. Verify reporting, redaction, timeout, and unavailable-monitor behavior.

### M9. Authorization is not consistently enforced inside data-access boundaries

- **Problem:** Some helpers accept already-authorized group IDs rather than independently restricting their Prisma query to the current user's active memberships.
- **Why it matters:** A future caller can accidentally pass unauthorized IDs and bypass the intended defense in depth.
- **Relevant files:** `src/lib/balances/group-balances.ts`, `src/lib/groups/dashboard.ts`
- **Recommended fix:** Make current-user membership part of each sensitive data-access query or expose only a higher-level authorized service.
- **Test:** Yes. Call the boundary with another group's ID and assert no data is returned.

### M10. Design-system implementation has visible specification drift

- **Problem:** The design documentation specifies green primary actions, while the global primary token is blue. The plan also describes toast infrastructure and mobile navigation patterns that are absent; forms use differing inline status patterns.
- **Why it matters:** The application is usable, but states and actions are not consistently communicated.
- **Relevant files:** `src/app/globals.css`, `docs/BUILD_PLAN.md`, `src/components/dashboard/dashboard-header.tsx`
- **Recommended fix:** Reconcile the existing tokens and component behaviors with the approved design documentation. This should be a consistency pass, not a redesign.
- **Test:** Yes. Add focused accessibility and responsive interaction tests; visual regression tests are optional.

### M11. Production acceptance evidence is incomplete and contradictory

- **Problem:** `docs/BUILD_PLAN.md` now records fresh-account and backup/recovery verification, while the release checklist still says there is no staging environment, restoration is unchecked, two-user acceptance is incomplete, and ownership/evidence are TBD.
- **Why it matters:** There is no auditable basis for approving a release despite the completion declaration.
- **Relevant files:** `docs/BUILD_PLAN.md`, `docs/RELEASE_CHECKLIST.md`
- **Recommended fix:** Attach dated evidence, environment, tester identities, data-reset process, restoration output, release owner, and sign-off. Remove contradictory status.
- **Test:** Yes. This requires operational acceptance evidence rather than unit testing.

### M12. The repository lacks usable production onboarding documentation

- **Problem:** The README remains largely the default Next.js scaffold and does not explain Splitly's environment, database bootstrap, migrations, test accounts, deployments, or incident procedures.
- **Why it matters:** Recovery and maintenance depend on undocumented knowledge.
- **Relevant files:** `README.md`, `docs/OPERATIONS.md`
- **Recommended fix:** Replace the scaffold content with a concise project setup and release index pointing to authoritative operational documents.
- **Test:** No automated test. Verify setup from a clean checkout.

## 🟢 Low — optional improvement

### L1. CI actions are pinned to major tags rather than commit SHAs

- **Problem:** GitHub Actions use floating major-version tags.
- **Why it matters:** A compromised or unexpectedly changed upstream action can alter CI behavior.
- **Relevant files:** `.github/workflows/ci.yml`
- **Recommended fix:** Pin actions to reviewed commit SHAs and use an automated dependency update process.
- **Test:** No.

### L2. Rate-limit buckets have no cleanup process

- **Problem:** Rate-limit bucket rows accumulate indefinitely.
- **Why it matters:** The table will grow even though old rows are no longer operationally useful.
- **Relevant files:** `src/lib/security/rate-limit.ts`, `prisma/schema.prisma`
- **Recommended fix:** Add a scheduled retention cleanup with a conservative age threshold.
- **Test:** Yes. Test cutoff selection without relying on wall-clock timing.

### L3. Build emits an ESM configuration warning

- **Problem:** The build reparses Tailwind configuration because package module type is not explicit.
- **Why it matters:** It causes minor startup/build overhead and noisy output.
- **Relevant files:** `package.json`, `tailwind.config.ts`
- **Recommended fix:** Align configuration extensions or module declarations with the current Next.js documentation after confirming compatibility.
- **Test:** No beyond lint, typecheck, and build.

## Overall production-readiness assessment

Splitly has a credible application foundation and a well-tested pure financial engine, but it is **not production-ready**.

The primary reasons are:

- Financial summaries can report false balances across currencies.
- Production data recovery is not proven.
- Group initialization is non-atomic.
- Real database and RLS behavior is not tested.
- Authenticated critical flows are skipped in CI.
- The declared build-plan completion does not match implementation or release evidence.
- Migration ownership and deployment sequencing are not sufficiently deterministic.

The passing build and unit suite demonstrate code health, but they do not prove financial and authorization correctness at the production database boundary.

## Top 10 issues to fix

1. Stop mixed-currency amounts from being combined.
2. Establish backups and complete a restoration drill.
3. Make group creation atomic.
4. Run authenticated critical Playwright flows in CI.
5. Add real PostgreSQL/Supabase transaction and RLS tests.
6. Enforce participant membership as a database invariant.
7. Consolidate the Prisma/Supabase migration strategy.
8. Fix the authentication open redirect.
9. Correct currency minor-unit handling or restrict supported currencies.
10. Add concurrency protection to expense mutations.

## Recommended order of fixes

1. Freeze feature work and resolve C1 and C2.
2. Fix the open redirect and verify production secrets and endpoints.
3. Make group and ledger mutations atomic, membership-safe, and concurrency-aware.
4. Consolidate migrations and define migration-before-deployment sequencing.
5. Build the disposable database and RLS integration environment.
6. Enable authenticated Playwright tests in CI.
7. Correct split-method preservation, pagination, and idempotency.
8. Resolve performance and monitoring issues.
9. Reconcile the build plan, release checklist, and actual Phase 1 scope.
10. Perform the design consistency and documentation pass.
11. Run a fresh-account, two-user acceptance test and a restoration drill.
12. Record a formal go/no-go sign-off.

## Private-beta safety

**No, not in its current form for real or relied-upon financial data.**

A tightly controlled internal alpha could proceed only if it is restricted to one currency, uses disposable data, has explicit acknowledgement that data may be lost, and has no expectation of ledger recovery. That is not equivalent to a normal private beta.

## Public-production safety

**No.** The mixed-currency correctness defect, lack of proven recovery, missing database integration assurance, and incomplete authenticated CI coverage are release blockers.

## Recommended next step

Begin a production-hardening remediation phase without adding product features. The first remediation batch should contain only:

1. Currency isolation or a single-currency constraint.
2. Backup/PITR plus a verified restoration drill.
3. Atomic group creation.
4. Authentication redirect hardening.
5. A real database/RLS integration-test harness.

After those changes, rerun this audit and conduct the documented two-user acceptance test before considering a private beta.
