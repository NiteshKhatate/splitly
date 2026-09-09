# Splitly — Production Hardening Phase 1

**Status:** Ready to execute  
**Purpose:** Production-readiness remediation  
**Scope:** Financial correctness, security, database integrity, recovery, and integration assurance  
**Rule:** No new product features during this phase.

---

## 1. Objective

Splitly's MVP build plan is complete, but the production-readiness audit dated **2026-09-09** identified release blockers and high-risk issues.

This phase moves the project from:

> **Build Complete**

to:

> **Production Hardening**

The objective is to resolve the first remediation batch identified by the audit before considering a private beta or public production release.

The audit found a credible application foundation and strong pure financial-engineering coverage, but concluded that Splitly is **not currently production-ready** because financial correctness, recovery, database integration, authentication, and release-assurance gaps remain.

---

## 2. Source of Truth

Before making changes, inspect:

1. `AGENTS.md`
2. `docs/BUILD_PLAN.md`
3. Relevant sections of `docs/system-design.md`
4. `docs/RELEASE_CHECKLIST.md`
5. `docs/OPERATIONS.md`
6. The **Splitly Production-Readiness Audit dated 2026-09-09**

Do not assume an issue is fixed merely because documentation says it is complete. Verify the implementation and evidence.

---

## 3. Phase Rules

### No new product features

This phase is strictly for production hardening.

Do not introduce unrelated capabilities, UI redesigns, or scope expansion.

### Preserve the existing architecture

Continue using:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase PostgreSQL
- Prisma
- Auth.js
- React Hook Form
- Zod
- Jest
- Playwright
- GitHub Actions
- Vercel

### Preserve the existing UI

Use the existing Splitly design system and reusable components.

Do not redesign the application while fixing functionality.

### Financial safety takes priority

Maintain:

- Integer minor-unit money representation
- Deterministic split calculations
- Transactional financial writes
- Server-side validation
- Explicit authorization
- Auditability

Never weaken security or authorization to make tests pass.

---

# 4. Remediation Batch 1

## R1 — Prevent Mixed-Currency Balances

**Audit finding:** C1 — Critical

### Problem

Group cards and group-detail summaries currently combine expenses and settlements without separating currencies, then display the result as INR.

This can produce materially false balances when a group contains expenses in different currencies.

### Preferred Phase 1 approach

For the current MVP, prefer the safer and smaller solution:

> **Enforce one currency per group.**

The system should:

1. Define the group's authoritative currency.
2. Require every expense in the group to use that currency.
3. Require every settlement in the group to use that currency.
4. Reject mismatched currency values server-side.
5. Ensure existing balance queries cannot combine different currencies.
6. Display the authoritative group currency consistently.
7. Fail closed if legacy/inconsistent data is encountered.

Do not rely on UI restrictions alone.

### Alternative

A multi-currency balance model may be introduced later, but it is outside this hardening batch unless the existing architecture makes the single-currency constraint unsafe.

### Required tests

Add regression coverage for:

- Expense using the group currency.
- Expense using a different currency.
- Settlement using the group currency.
- Settlement using a different currency.
- Group dashboard/card balances.
- Group detail balances.
- Zero-balance groups.
- Existing mixed-currency records, if present in a disposable test database.

### Acceptance criteria

- No balance calculation can add INR and USD as one amount.
- Server-side validation rejects mismatched currencies.
- Group-level currency behavior is deterministic.
- Relevant Jest/integration tests pass.

---

## R2 — Establish Recoverable Production Data

**Audit finding:** C2 — Critical

### Problem

Production database recovery is not demonstrated, and receipt-object recovery is not guaranteed.

### Required work

Choose and document one supported recovery strategy:

- Provider-managed backups/PITR, or
- Automated encrypted database backups plus receipt-object backups.

The strategy must cover:

- PostgreSQL data
- Receipt/attachment objects
- Backup retention
- Access controls
- Restore procedure
- Restore ownership
- Verification procedure

### Restoration drill

Do not mark this item complete based only on documentation.

Perform a clean restoration into a disposable environment.

Verify representative financial data after restoration, including:

- Users/groups
- Memberships
- Expenses
- Payments
- Shares
- Settlements
- Activity history
- Receipt metadata
- Receipt objects

Reconcile representative totals before and after restoration.

### Evidence

Record:

- Date
- Environment
- Backup source
- Restore destination
- Migration state
- Validation results
- Financial reconciliation results
- Receipt verification
- Operator/reviewer
- Any deviations

### Acceptance criteria

Recovery is not complete until a real restoration drill succeeds and evidence is recorded.

---

## R3 — Make Group Creation Atomic

**Audit finding:** H1 — High

### Problem

Group creation can insert the group separately from owner membership and activity creation.

A partial failure can leave an orphaned or inaccessible group.

### Required behavior

Group creation must be one atomic operation containing:

1. Group creation
2. Owner membership creation
3. Initial activity event

If any operation fails, all changes must roll back.

Use a Prisma transaction or an appropriate transactional database function.

### Required tests

Add an integration test that forces membership creation to fail and verifies:

- No group remains.
- No owner membership remains.
- No activity event remains.

Also test successful creation.

### Acceptance criteria

- No partially initialized group can be committed.
- Rollback is demonstrated against a real database integration environment.

---

## R4 — Harden Authentication Redirects

**Audit finding:** H8 — High

### Problem

Redirect validation rejects common external redirects such as `//evil.example` but can accept a backslash-based authority form such as `/\evil.example`.

URL normalization can turn this into an external host.

### Required behavior

Validate redirects against the application's canonical origin.

A redirect is acceptable only when the normalized resulting origin exactly matches the application origin.

Reject:

- External origins
- `//evil.example`
- `/\evil.example`
- Backslash authority forms
- Encoded slash forms
- Encoded backslash forms
- Control characters
- Alternate-origin URLs
- Other authority-like normalization tricks

Preserve legitimate internal relative redirects.

### Required tests

Add cases for:

- Safe relative path
- Root path
- Nested internal path
- Absolute same-origin URL
- Absolute external URL
- Double-slash external URL
- Backslash external URL
- Encoded slash
- Encoded backslash
- Control characters
- Alternate origin

### Acceptance criteria

- No attacker-controlled external redirect is accepted.
- Existing legitimate authentication redirects continue to work.

---

## R5 — Build Real PostgreSQL/Supabase Integration Tests

**Audit finding:** H4 — High

### Problem

Current transaction and RLS tests are primarily mock-based.

Mocks cannot prove:

- PostgreSQL rollback
- Database constraints
- Triggers
- Grants
- Isolation
- RLS policies
- Cross-user authorization

### Required test environment

Create a disposable integration environment capable of running against real PostgreSQL/Supabase-compatible database behavior.

Do not replace existing unit tests. Add integration coverage.

### Required coverage

At minimum:

#### Transactions

- Group creation rollback
- Expense creation rollback
- Expense update rollback
- Expense deletion rollback
- Settlement transaction behavior

#### Authorization

- User can access their own group
- User cannot read another user's private group data
- User cannot mutate another group's data
- Cross-group expense access is rejected
- Cross-group settlement access is rejected

#### Membership

- Membership boundaries are respected
- Unauthorized participant references fail
- Concurrent membership changes are handled according to the chosen invariant

#### RLS

Where browser/data-API exposure exists, verify actual RLS behavior with two authenticated users.

Do not disable RLS to make tests pass.

### Acceptance criteria

- At least one real database integration suite exists.
- Rollback behavior is proven against PostgreSQL.
- Authorization isolation is proven with multiple users.
- RLS is tested where applicable.

---

# 5. Verification Required Before Leaving Batch 1

Run:

- ESLint
- TypeScript
- Prisma schema validation
- Jest
- Jest coverage
- Production build
- Relevant Playwright tests
- Database integration tests
- Migration checks

Also verify:

- No production secrets are committed.
- `DATABASE_URL` remains the runtime connection.
- `DIRECT_URL` is configured for its intended migration/direct-connection role.
- RLS has not been disabled as a workaround.

---

# 6. Follow-Up Remediation Backlog

After Batch 1, continue with the audit findings in this order.

## Batch 2 — Financial and Deployment Integrity

1. Currency minor-unit handling (H5)
2. Database membership invariant (H6)
3. Migration ownership consolidation (H7)
4. Expense concurrency/version protection (H11)
5. `DIRECT_URL` verification (H12)
6. Migration-before-deployment sequencing (H13)

## Batch 3 — Product Correctness

1. Authenticated Playwright in CI (H3)
2. Expense history pagination (H9)
3. Preserve split methods during edits (H10)
4. Settlement idempotency (M1)
5. Receipt deletion/content validation (M2)

## Batch 4 — Operational and Security Hardening

1. Dashboard/balance query efficiency (M3)
2. Settlement history indexing (M4)
3. Request body-size enforcement (M5)
4. Participant-count limits (M6)
5. CSP/HSTS (M7)
6. Error monitoring (M8)
7. Authorization at data-access boundaries (M9)

## Batch 5 — Consistency and Documentation

1. Design-system specification drift (M10)
2. Production acceptance evidence (M11)
3. Production onboarding documentation (M12)
4. GitHub Actions SHA pinning (L1)
5. Rate-limit retention (L2)
6. ESM configuration warning (L3)

---

# 7. Build-Plan Reconciliation

The audit identified a mismatch between the completion declaration and the implementation for:

- Preferred currency
- Timezone
- Member role management
- Member removal
- Leaving groups
- Group archiving

Do not silently implement these as part of this hardening batch.

Instead:

1. Inspect the actual implementation.
2. Decide whether each capability remains part of the intended MVP.
3. If retained, create an explicit remediation task.
4. If deferred, update the build/release documentation so completion status is accurate.
5. Add tests if the capability remains release-critical.

Documentation must reflect verified implementation and evidence.

---

# 8. Release Gate

Splitly must **not** be considered production-ready merely because:

- The build passes.
- Jest passes.
- Unit coverage is high.
- Prisma reports the database is up to date.
- The health endpoint is healthy.

Production readiness requires evidence at the database, security, recovery, and authenticated workflow boundaries.

Before private beta approval:

- Critical findings are resolved.
- Real database integration tests pass.
- Recovery has been demonstrated.
- Two-user acceptance testing is complete.
- Release documentation is internally consistent.
- A formal go/no-go decision is recorded.

---

# 9. Definition of Done for This Phase

A remediation is complete only when all applicable conditions are true:

- [ ] Implementation is complete.
- [ ] Server-side validation is present.
- [ ] Authorization is preserved/enforced.
- [ ] Database integrity is preserved.
- [ ] Required migrations are created and verified.
- [ ] Regression tests are added.
- [ ] Integration tests are added where required.
- [ ] Relevant Playwright coverage exists.
- [ ] Existing UI/design system is preserved.
- [ ] Loading/empty/error/unauthorized/success states remain correct.
- [ ] Lint passes.
- [ ] Typecheck passes.
- [ ] Tests pass.
- [ ] Production build passes.
- [ ] Documentation reflects actual implementation.
- [ ] Operational evidence exists for non-code requirements.

---

# 10. Final Instruction to Codex

When executing this phase:

> **Do not add new product features.**
>
> Read `AGENTS.md`, `docs/BUILD_PLAN.md`, `docs/system-design.md`, `docs/RELEASE_CHECKLIST.md`, and `docs/OPERATIONS.md` before making changes.
>
> Use the production-readiness audit dated 2026-09-09 as the remediation backlog.
>
> Start with Batch 1 only:
>
> 1. Currency isolation / single-currency group constraint
> 2. Backup/recovery strategy and restoration drill
> 3. Atomic group creation
> 4. Authentication redirect hardening
> 5. Real PostgreSQL/Supabase integration-test harness
>
> Inspect the implementation before changing it.
>
> Do not claim operational work is complete without actual evidence.
>
> Do not disable RLS, weaken authorization, or bypass financial invariants to make tests pass.
>
> Preserve the existing Splitly architecture and UI design system.
>
> After implementation, report:
>
> - Files changed
> - Migrations added
> - Tests added
> - Tests passed
> - Operational evidence produced
> - Remaining audit findings
> - Any manual actions still required
> - Whether each Batch 1 acceptance criterion is genuinely satisfied
