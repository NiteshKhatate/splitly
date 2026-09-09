# Splitly — Agent Instructions

## 1. Project Overview

Splitly is a shared-expense management application inspired by the core concept of Splitwise.

The application allows users to:

* Create accounts
* Create expense-sharing groups
* Add group members
* Record shared expenses
* Split expenses among members
* Calculate balances
* Record settlements
* View expense history

The current development target is **Phase 1**.

---

# 2. Source of Truth

The repository contains project-level documentation that must be followed.

### System and architecture

```text
docs/system-design.md
```

This is the source of truth for:

* System architecture
* Technology choices
* Database design
* Data relationships
* Authentication
* Authorization
* Supabase
* Row Level Security
* Data flows
* Financial/business logic
* Deployment architecture
* Testing architecture
* Phase 1 scope

### UI and visual design

Use the project's designated UI/design documentation for:

* Colors
* Typography
* Font sizes
* Spacing
* Buttons
* Inputs
* Forms
* Cards
* Dialogs
* Tables
* Badges
* Component variants
* Component states
* Responsive behavior
* Accessibility

If a dedicated UI/design document exists, read it before making UI changes.

---

# 3. Documentation Rules

Before making changes:

1. Read this `AGENTS.md`.
2. Read `docs/system-design.md` when the task involves architecture, backend, database, authentication, authorization, Supabase, testing architecture, or data flow.
3. Read the project's UI/design documentation when the task involves UI or UX.
4. Inspect the existing implementation before creating new components, utilities, services, or database structures.

Do not require the user to repeat these instructions in every prompt.

---

# 4. General Development Principles

* Prefer simple solutions over unnecessary complexity.
* Keep the application maintainable and easy to understand.
* Do not over-engineer Phase 1.
* Reuse existing functionality before creating new functionality.
* Avoid unnecessary dependencies.
* Do not introduce architectural changes without justification.
* Do not modify unrelated parts of the application.
* Keep changes focused on the requested task.
* Preserve existing working functionality.
* Follow established project conventions consistently.
* Prefer reusable components and utilities over duplicated implementations.
* Keep business logic separate from presentation where practical.

---

# 5. Technology Stack

Splitly uses:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Row Level Security (RLS)
* React Hook Form
* Zod
* Jest
* Vercel
* pnpm

Do not introduce another framework or backend technology unless explicitly approved.

---

# 6. Architecture

Phase 1 uses a single Next.js application.

```text
User
 │
 ▼
Vercel
 │
 ▼
Next.js Application
 │
 ├── Supabase Auth
 │
 └── Supabase PostgreSQL + RLS
```

Do not create a separate:

* Express backend
* NestJS backend
* Node.js API server
* Backend microservice
* API gateway

unless explicitly approved.

---

# 7. Next.js Development

Use the Next.js App Router.

Prefer Server Components by default.

Use Client Components only when required for:

* Browser interaction
* Client-side state
* Event handlers
* Interactive forms
* Other functionality requiring `"use client"`

Do not add `"use client"` unnecessarily.

Keep server-side logic on the server.

---

# 8. TypeScript

Use TypeScript throughout the application.

Avoid:

```ts
any
```

unless there is a documented technical reason.

Prefer:

* Explicit types where useful
* Type inference where appropriate
* Shared domain types
* Type-safe Supabase queries
* Zod-inferred form types

---

# 9. Forms and Validation

**React Hook Form and Zod are the standard form-management and validation solution for Splitly.**

Use:

* `react-hook-form` for form state and submission state.
* `zod` for validation schemas.
* `@hookform/resolvers/zod` to connect Zod with React Hook Form.

Do not introduce another form-management or validation library without explicit approval.

The standard architecture is:

```text
Zod Schema
    ↓
zodResolver
    ↓
React Hook Form
    ↓
Reusable Form UI
    ↓
Server boundary
    ↓
Supabase
```

Example:

```ts
const schema = z.object({
  name: z.string().min(1, "Name is required"),
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: {
    name: "",
  },
});
```

Prefer Zod-inferred types instead of duplicating form types manually.

---

# 10. Form Validation

Validation must happen at the appropriate layers.

### Client

Use Zod + React Hook Form for immediate user feedback.

### Server

Validate submitted data again before important database operations.

### Database

Use PostgreSQL constraints and RLS for data integrity and authorization.

These layers have different responsibilities:

```text
React Hook Form
    ↓
Form state

Zod
    ↓
Input validation

Server
    ↓
Trusted application boundary

PostgreSQL + RLS
    ↓
Data integrity + authorization
```

Never treat client-side validation as a security boundary.

---

# 11. Validation Schemas

Prefer reusable validation schemas under:

```text
src/lib/validations/
```

For example:

```text
src/lib/validations/
├── auth.ts
├── groups.ts
├── expenses.ts
└── settlements.ts
```

Adapt to the existing project structure.

Do not duplicate validation rules.

Use local schemas for genuinely page-specific forms when appropriate.

---

# 12. React Hook Form Rules

Use React Hook Form for interactive forms.

Prefer:

```ts
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```

Use:

```tsx
form.handleSubmit(...)
```

for form submission.

Do not manually manage every form field with separate `useState` calls when React Hook Form already provides the required functionality.

Avoid unnecessary controlled components.

Use `Controller` only when required by a controlled/third-party component.

---

# 13. Form Components

Use reusable UI components for forms.

Preferred structure:

```text
Form
 ├── FormField
 │    ├── Label
 │    ├── Input
 │    ├── Description
 │    └── ErrorMessage
 │
 └── FormActions
      ├── Cancel
      └── Submit
```

Reuse components from:

```text
src/components/ui/
```

Do not create one-off form styling.

---

# 14. Form Error Handling

Validation errors should:

* Appear close to the relevant field.
* Be understandable to users.
* Be accessible.
* Follow the UI/design documentation.
* Not expose technical details.

Prefer:

```text
Email address is required.
```

over:

```text
Validation failed.
```

Server/database errors must be converted into appropriate user-facing messages.

Do not expose:

* SQL errors
* Database constraint names
* Stack traces
* Supabase internals
* Secrets

---

# 15. Form Submission

Asynchronous forms must correctly handle:

* Loading state
* Duplicate submission prevention
* Successful submission
* Server errors
* Retry behavior

During submission:

* Disable the submit action where appropriate.
* Preserve user input.
* Show the standard loading state.
* Do not reset prematurely.

After failure:

* Preserve entered values.
* Show a useful error.
* Allow retry.

---

# 16. Supabase

Supabase is the primary backend/data platform.

Use the existing Supabase client/server utilities.

Never expose the Supabase service-role key to browser/client-side code.

Privileged credentials may only be used in secure server-side environments where explicitly required.

---

# 17. Row Level Security

RLS is a fundamental security boundary.

Never disable RLS to make a feature work.

Never bypass RLS from client-side code.

Do not create permissive policies such as:

```sql
WITH CHECK (true)
```

unless there is an explicitly documented and security-reviewed reason.

Use authenticated user identity through:

```sql
auth.uid()
```

where appropriate.

Do not rely on client-side authorization checks as the only security mechanism.

---

# 18. Authentication

Use Supabase Authentication.

Authentication supports:

* Signup
* Email confirmation where enabled
* Login
* Logout
* Session handling
* Protected routes
* Authenticated user identification

Do not implement a second authentication system.

Do not store passwords in application tables.

Authentication forms must use React Hook Form + Zod.

---

# 19. Database

Phase 1 application tables are:

```text
profiles
groups
group_members
expenses
expense_splits
settlements
```

Supabase manages:

```text
auth.users
```

Do not recreate `auth.users`.

Do not modify the database schema unless explicitly requested or required by a confirmed feature need.

When schema changes are necessary, use reproducible database migrations.

---

# 20. Database Changes

Before changing the schema:

1. Inspect the existing schema.
2. Inspect existing relationships.
3. Inspect existing constraints.
4. Inspect existing RLS policies.
5. Determine whether existing tables already support the requirement.

Avoid creating duplicate tables.

Do not create tables such as:

```text
dashboard
balances
user_groups
group_users
```

when existing tables already provide the required relationship/data.

---

# 21. Business Logic

Keep business logic separate from presentation components where practical.

For example:

```text
src/lib/
├── balances/
├── expenses/
├── settlements/
├── validations/
└── ...
```

Components should primarily handle presentation and user interaction.

Business calculations should not be duplicated across React components.

---

# 22. Financial Data

Splitly handles financial information.

Financial calculations must be deterministic.

Be careful with floating-point precision.

Where practical, represent monetary values using integer minor units or another precision-safe representation defined by the system design.

Test financial calculations thoroughly.

Any rounding must follow the documented application rules and preserve totals.

---

# 23. Testing

Jest is the standard testing framework for Splitly.

Tests should be added whenever they provide meaningful protection against regressions.

Do not blindly create tests for every component or line.

Test behavior and business logic rather than implementation details.

---

# 24. Testing Priorities

Highest priority:

* Financial calculations
* Balance calculations
* Expense splitting
* Settlement calculations
* Zod validation schemas
* Authentication behavior
* Authorization behavior
* Group membership logic
* Server actions/data-access functions
* Important form behavior
* Security-sensitive logic

Medium priority:

* Interactive components
* Dashboard behavior
* Group behavior
* Loading states
* Empty states
* Error states
* Important user interactions

Lower priority:

* Static markup
* Styling
* Tailwind classes
* Trivial wrappers
* Third-party library behavior
* Internal React state

---

# 25. Unit Tests

Use unit tests for isolated logic.

Examples:

```text
src/lib/balances/
src/lib/expenses/
src/lib/settlements/
src/lib/validations/
```

Test:

* Normal cases
* Edge cases
* Boundary conditions
* Invalid inputs
* Empty collections
* Rounding
* Financial precision
* Domain rules

Unit tests should be fast and deterministic.

They should not require production services.

---

# 26. Zod Tests

Important shared Zod schemas should have unit tests.

Test:

* Valid input
* Invalid input
* Required fields
* Minimum/maximum lengths
* Invalid formats
* Boundary values
* Domain-specific rules
* Whitespace behavior where applicable

Test the actual production schema.

Do not duplicate schema logic inside tests.

---

# 27. React Hook Form Tests

Do not test React Hook Form itself.

Test application behavior.

Important forms should test:

* Fields render
* User input
* Validation errors
* Invalid submission
* Valid submission
* Loading state
* Server errors
* Successful submission
* Duplicate submission prevention where relevant

Important forms include:

```text
Signup
Login
Create Group
Add Person
Add Expense
Settlement
```

---

# 28. Component Tests

For interactive components, test user-visible behavior.

Prefer:

```ts
getByRole()
getByLabelText()
getByText()
```

where appropriate.

Avoid tests based on:

* CSS classes
* Internal React state
* DOM nesting
* Implementation-specific function calls
* Third-party internals

---

# 29. Supabase Tests

Do not make normal Jest tests dependent on a production Supabase database.

Mock external Supabase boundaries where appropriate.

Do not test Supabase's implementation.

Keep application data access behind clear boundaries so application behavior can be tested independently.

---

# 30. RLS Testing

Jest mocks cannot prove that PostgreSQL RLS works.

Application tests may verify:

* Authorization decisions
* Error handling
* Correct data-access behavior

Actual RLS behavior should be tested through a suitable Supabase/database integration environment when available.

Never weaken RLS to make tests pass.

---

# 31. Authentication Tests

Test application behavior around:

* Login
* Signup
* Logout
* Protected routes
* Missing sessions
* Authentication errors
* User identity handling

Do not test Supabase Auth internals.

---

# 32. Regression Testing

When fixing a bug:

1. Reproduce the bug.
2. Add a regression test.
3. Fix the implementation.
4. Confirm the test passes.
5. Run the relevant existing test suite.

Bug fixes without appropriate regression coverage should be avoided.

---

# 33. Test Organization

Follow the existing repository convention.

If no convention exists, colocate tests with the code they cover where practical.

Examples:

```text
src/lib/balances/calculateBalance.ts
src/lib/balances/calculateBalance.test.ts
```

and:

```text
src/components/groups/AddMemberDialog.tsx
src/components/groups/AddMemberDialog.test.tsx
```

Avoid unnecessarily complex test structures.

---

# 34. Test Data

Tests must use deterministic test data.

Never use:

* Production data
* Real credentials
* Real user information
* Production database credentials
* Service-role keys

Use fixtures/factories when test data is repeated.

---

# 35. Test Independence

Tests must be independent.

Do not rely on:

* Test execution order
* Shared mutable state
* Previous test results
* Production services

Reset mocks and shared state appropriately.

---

# 36. Coverage

Do not chase 100% coverage.

Use coverage to identify meaningful gaps.

Prioritize coverage of:

```text
Business logic
Financial calculations
Validation
Authorization
Critical user flows
Error handling
```

A smaller suite of meaningful tests is preferable to a large brittle suite.

---

# 37. Regression and Existing Functionality

When implementing a feature:

* Preserve existing behavior.
* Do not rewrite unrelated functionality.
* Add regression tests for discovered bugs.
* Run the relevant existing tests.

---

# 38. UI Development

Before modifying UI:

1. Read the project's UI/design documentation.
2. Inspect `src/components/ui/`.
3. Reuse existing components.
4. Follow established variants and states.
5. Create reusable components when necessary.

Do not create one-off styles when an existing component can be reused.

---

# 39. Reusable UI Components

Common components should live under:

```text
src/components/ui/
```

Examples:

```text
Button
Input
Textarea
Select
Checkbox
Radio
Switch
Form
FormField
Card
Dialog
Modal
Badge
Avatar
Toast
Alert
Spinner
Skeleton
```

Use component variants rather than duplicating CSS.

---

# 40. Accessibility

All user-facing UI should be accessible.

Follow appropriate practices for:

* Semantic HTML
* Form labels
* Keyboard navigation
* Focus states
* Button semantics
* Input errors
* Dialog accessibility
* Screen-reader-friendly messaging

Use native HTML semantics whenever possible.

---

# 41. Responsive Design

All pages must work across:

* Mobile
* Tablet
* Desktop

Follow the project's UI/design documentation.

Do not simply shrink desktop layouts for mobile.

---

# 42. Error Handling

Handle errors explicitly.

Common categories:

```text
Authentication error
Authorization error
Validation error
Database error
Not found
Unexpected error
```

User-facing messages must be clear.

Never expose sensitive implementation details.

---

# 43. Dependencies

Before adding a dependency:

1. Check existing dependencies.
2. Check existing utilities/components.
3. Determine whether the problem can be solved without another dependency.
4. Add a dependency only when there is a meaningful benefit.

Current standard form dependencies:

```text
react-hook-form
zod
@hookform/resolvers
```

Current testing framework:

```text
jest
```

Do not replace these without explicit approval.

---

# 44. File Organization

Follow the existing project structure.

A typical structure is:

```text
src/
├── app/
├── components/
│   ├── ui/
│   ├── dashboard/
│   ├── groups/
│   └── expenses/
├── lib/
│   ├── supabase/
│   ├── balances/
│   ├── expenses/
│   ├── settlements/
│   └── validations/
└── types/
```

Adapt this to the actual repository.

---

# 45. Scope Control

When asked to implement a feature:

* Implement the requested feature.
* Make only necessary supporting changes.
* Do not redesign unrelated pages.
* Do not refactor unrelated code.
* Do not introduce future-phase functionality.
* Do not change architecture without justification.

---

# 46. Documentation Updates

When an implementation changes an important architectural or design decision, update the appropriate documentation.

Architecture:

```text
docs/system-design.md
```

UI:

```text
[project's designated UI/design documentation]
```

Do not duplicate the same specification unnecessarily.

---

# 47. Verification

After making changes, run relevant checks.

Where configured:

```bash
pnpm test
pnpm lint
pnpm typecheck
pnpm build
```

For coverage:

```bash
pnpm test -- --coverage
```

Inspect `package.json` before assuming exact command names.

---

# 48. Security

Never:

* Commit secrets
* Expose environment secrets
* Expose service-role credentials
* Disable RLS
* Trust client-side authorization
* Log sensitive user information unnecessarily
* Bypass authentication
* Introduce insecure database policies for convenience

Security-sensitive changes require careful review.

---

# 49. When Requirements Are Ambiguous

Use existing documentation and code to make low-risk decisions.

Ask the user before making significant decisions involving:

* Architecture
* Database schema
* Authentication
* Authorization
* RLS
* Major UX changes
* External services
* Breaking changes

Do not silently make major architectural decisions.

---

# 50. Definition of Done

A task is complete when:

* Requested functionality is implemented.
* Existing functionality continues to work.
* Relevant documentation has been followed.
* Existing reusable components have been reused.
* Forms use React Hook Form + Zod where applicable.
* Client and server validation are appropriately separated.
* RLS is respected.
* Important behavior is tested.
* Regression tests are added when appropriate.
* TypeScript checks pass.
* Lint passes.
* Tests pass.
* Build passes when applicable.
* No secrets are exposed.
* No unnecessary dependencies or infrastructure are introduced.

---

# 51. Core Principle

When implementing Splitly, optimize for:

```text
Consistency
Security
Simplicity
Type safety
Testability
Maintainability
User experience
```

Build the simplest solution that correctly satisfies the current Phase 1 requirements.

## 52. Production Hardening Mode

The MVP build plan is complete. The current engineering target is **Production Hardening / Stabilization**.

Until the production-hardening gate is passed:

* Do not add new product features unless explicitly approved.
* Do not expand scope to improve UX, add integrations, or introduce optional functionality.
* Prioritize correctness, security, recoverability, concurrency safety, operational readiness, and test evidence.
* Treat the production-readiness audit and `docs/BUILD_PLAN.md` as the primary remediation references.
* When an existing implementation conflicts with the documented architecture or production-hardening requirements, stop and resolve the discrepancy rather than silently working around it.

The goal is to make the existing MVP safe and demonstrably reliable for production use, not to increase feature count.

---

## 53. Production Hardening Priority

Work in this order unless a higher-severity production issue requires otherwise:

1. Financial correctness and currency isolation.
2. Production backup, recovery, and restoration evidence.
3. Transactional integrity and membership invariants.
4. Authentication, authorization, and redirect security.
5. Real PostgreSQL/RLS integration testing.
6. Migration ownership and deployment ordering.
7. Concurrency protection and idempotency.
8. Authenticated E2E coverage in CI.
9. Financial history pagination and operational limits.
10. Monitoring, security headers, receipt recovery, and performance.
11. Documentation and build-plan reconciliation.
12. Final production acceptance and go/no-go review.

Do not declare production readiness based solely on unit tests, successful builds, or local development behavior.

---

## 54. Financial Correctness — Currency Isolation

Currency handling is a production-critical invariant.

Until multi-currency accounting is explicitly designed, implemented, and tested:

* A group must use one currency for all financial records.
* Expenses, shares, settlements, and balances belonging to a group must use the group's currency.
* Do not aggregate amounts with different currencies.
* Do not display mixed-currency totals as though they were one currency.
* Reject currency mismatches at server-side validation and authorization boundaries.
* Prefer deriving the effective currency from the group rather than trusting arbitrary client input.
* Add regression tests proving that mixed-currency records cannot contaminate balances.
* Any future multi-currency design must explicitly define conversion rates, conversion dates, precision, rounding, reporting semantics, and audit behavior before implementation.

Currency isolation must be enforced server-side. UI restrictions alone are insufficient.

---

## 55. Financial Correctness — Money Representation

All financial amounts must use integer minor units.

Rules:

* Never use JavaScript floating-point arithmetic for persisted financial calculations.
* Never persist monetary values as floating-point database types.
* Convert user-entered decimal amounts to integer minor units using deterministic decimal handling.
* Preserve exact totals through deterministic rounding.
* Use largest-remainder allocation where proportional allocation requires rounding.
* Equal, percentage, and weighted splits must reconcile exactly to the expense total.
* Reject invalid, negative, NaN, infinite, or otherwise malformed monetary input.
* Currency exponent handling must be explicit and authoritative.
* Do not assume every ISO currency has two decimal places.

Any financial calculation change requires regression tests for normal values, rounding boundaries, zero values, and invalid input.

---

## 56. Database Transactions and Atomicity

Any operation that changes multiple related financial or membership records must be atomic.

Examples include:

* Creating a group and its owner membership.
* Creating or editing an expense and its shares.
* Deleting an expense and all related state.
* Confirming or reversing a settlement.
* Changing membership where related financial authorization is affected.

Rules:

* Use Prisma transactions for multi-record state changes.
* Do not perform partial writes followed by unrelated cleanup.
* Do not rely on UI sequencing for consistency.
* Validate all required invariants before committing.
* If any operation fails, related writes must roll back.
* Add integration tests that deliberately trigger failure after an intermediate write and verify that no partial state remains.

A successful happy-path test is not sufficient evidence of atomicity.

---

## 57. Database Membership Integrity

Users referenced as:

* expense payers,
* expense participants,
* settlement participants,
* group members,

must be valid members of the relevant group when the operation is committed.

Rules:

* Never trust client-supplied membership identifiers.
* Revalidate membership server-side immediately before financial writes.
* Do not authorize an operation merely because a user ID exists.
* Protect against membership changes occurring concurrently with financial writes.
* Prefer database constraints, triggers, serializable transactions, or appropriate locking where required by the invariant.
* Add two-user and concurrent membership-removal tests.

Application-level checks are necessary but must not be treated as equivalent to a database invariant when a race condition can violate the invariant.

---

## 58. Real Database and RLS Testing

Mock-only database tests are insufficient for production-hardening sign-off.

The project must maintain a disposable PostgreSQL/Supabase integration environment capable of testing:

* real foreign keys,
* unique constraints,
* check constraints,
* transactions,
* rollback behavior,
* concurrent operations where relevant,
* RLS policies,
* cross-user isolation,
* membership authorization,
* server-only financial tables,
* migration reproducibility.

Tests must include at least two distinct users where authorization or RLS behavior is relevant.

Do not mark RLS or transactional behavior as production-verified based solely on mocked Prisma calls.

---

## 59. Authentication and Redirect Security

Authentication boundaries are security-critical.

Rules:

* Use Supabase Authentication for application authentication and session handling.
* Every protected server action and route must independently establish authorization.
* Never trust client-side authentication state as authorization.
* Redirect targets must be constrained to safe same-origin destinations.
* Reject absolute URLs, protocol-relative URLs, backslash-based authority bypasses, encoded authority forms, control characters, and equivalent open-redirect variants.
* Validate redirects after URL parsing against the canonical application origin.
* Add regression tests for malicious redirect forms, including `/\evil.example` and encoded variants.
* Do not weaken redirect validation merely to preserve a convenience navigation path.

---

## 60. Authorization at Data-Access Boundaries

Authorization must occur as close as practical to the data-access operation.

Rules:

* Every group-scoped query must establish that the current user belongs to the group.
* Every financial mutation must verify authorization for the affected group.
* Do not fetch sensitive records broadly and filter authorization only in UI code.
* Do not assume that a route-level authorization check protects downstream reusable data-access functions.
* Reusable server-side data-access functions should make required authorization context explicit.
* Server actions must independently validate identity, authorization, input, and invariants.

A hidden or inaccessible UI element is not an authorization mechanism.

---

## 61. Concurrency Protection and Idempotency

Financial writes must be safe under concurrent requests.

Rules:

* Protect expense edits and deletes against stale writes.
* Use optimistic concurrency/version checks or an equivalent database-safe mechanism.
* Recheck relevant state inside the transaction before committing.
* Prevent an edit from overwriting a newer edit.
* Prevent an edit from silently modifying an expense that was concurrently deleted.
* Design settlement confirmation to be idempotent.
* Retries must not create duplicate financial effects.
* Add tests for concurrent edit/edit, edit/delete, duplicate settlement confirmation, and retry behavior.

Do not assume browser serialization prevents concurrent requests.

---

## 62. Split-Method Preservation

Editing an expense must preserve its original split method and semantics unless the user explicitly changes the method.

Supported split methods currently include:

* exact,
* equal,
* percentage,
* weighted.

Rules:

* Do not silently convert all edited expenses to `EXACT`.
* Preserve the original method and source inputs where the edit does not change the split definition.
* Recalculate derived shares deterministically when relevant inputs change.
* Validate that resulting shares reconcile exactly with the expense total.
* Add regression tests covering create → edit → read behavior for every supported split method.

---

## 63. Recovery and Production Data

Production data must be demonstrably recoverable.

Before production approval:

* Establish the provider-supported backup/PITR strategy.
* Document retention and recovery procedures.
* Ensure database backups are protected appropriately.
* Ensure receipt/file data has an explicit recovery strategy.
* Perform a clean restoration into a disposable environment.
* Verify that restored schema, users, groups, expenses, shares, settlements, and balances reconcile with the source.
* Record restoration evidence and the date of the latest successful drill.
* Do not treat "the provider probably has backups" as recovery evidence.

A backup strategy without a successful restoration drill is incomplete.

---

## 64. Migration Ownership

There must be one authoritative migration history for the application database.

Rules:

* Prisma migrations are authoritative for Prisma-managed schema changes unless the architecture explicitly establishes another source of truth.
* Database functions, triggers, RLS policies, and other required database behavior must have deterministic ownership.
* Do not maintain conflicting or partially overlapping migration histories without explicit justification.
* A clean database must be reproducible from the authoritative migration chain.
* Migration configuration must not depend on missing seed files or undocumented local state.
* Any migration-history reconciliation must preserve existing production data.

Before release, verify that a fresh database can be built deterministically from source control.

---

## 65. Database Connection Roles

Runtime and migration database connections must be intentionally separated.

Rules:

* `DATABASE_URL` is the runtime connection.
* `DIRECT_URL` is reserved for Prisma migrations/admin operations and must resolve to the provider's intended direct/non-pooled endpoint.
* Do not assume a URL is direct merely because it is stored in `DIRECT_URL`.
* Verify host, port, role behavior, and provider documentation.
* Runtime pooling and migration connectivity must both be tested in the target environment.
* Never expose privileged database credentials to browser code.

---

## 66. Migration-Before-Deployment Ordering

Schema changes must be compatible with the deployed application during rollout.

The release process must explicitly define:

1. Backup/recovery checkpoint.
2. Database migration.
3. Migration verification.
4. Application deployment.
5. Smoke tests.
6. Rollback/forward-fix ownership.

Do not deploy application code that requires a schema change before the required migration is applied.

Prefer backward-compatible migration patterns for changes that cannot be deployed atomically.

---

## 67. Authenticated E2E Tests in CI

Authenticated Playwright tests are part of the production gate.

Rules:

* CI must provision deterministic test accounts and required test data.
* Authenticated tests must not silently skip because credentials are unavailable.
* Missing required CI credentials/configuration must fail the appropriate CI job.
* Run critical authenticated workflows on both desktop and mobile/tablet profiles where supported.
* Keep test data isolated from production.
* Verify critical flows including authentication, group access, expense creation/edit/delete, settlement confirmation, and authorization boundaries.

A locally passing authenticated suite does not compensate for a skipped CI suite.

---

## 68. Financial History and Pagination

Financial history must not silently truncate.

Rules:

* Do not impose an undocumented hard `take` limit that causes older records to disappear from the UI.
* Implement cursor pagination, load-more, or another explicit history pagination strategy.
* Keep server-side filtering and ordering deterministic.
* Document the pagination behavior.
* Add tests for datasets larger than the default page size.
* Ensure pagination cannot cause duplicate or missing records between pages.

---

## 69. Request Limits and Abuse Protection

User-controlled inputs must have explicit server-side bounds.

At minimum review:

* request body size,
* participant count,
* expense description length,
* notes/comments length,
* receipt size,
* receipt count,
* pagination limits,
* export range,
* batch operation size.

Do not rely exclusively on `Content-Length` because it may be absent or unreliable.

Limits must be enforced at the server boundary and covered by tests.

---

## 70. Receipt Security and Recovery

Receipt uploads are untrusted input.

Rules:

* Validate file size server-side.
* Validate MIME type using actual file content where practical; do not blindly trust client metadata.
* Restrict allowed file types explicitly.
* Prevent unauthorized users from accessing receipts.
* Ensure receipt deletion and associated database state cannot leave inconsistent references.
* Include receipt data in the production recovery strategy.
* Test unauthorized access and invalid-file cases.

---

## 71. Security Headers and Monitoring

Production security and observability must be explicit.

Review and verify:

* Content Security Policy,
* HSTS,
* X-Content-Type-Options,
* frame protections,
* referrer policy,
* permissions policy where applicable,
* secure cookie configuration,
* structured error logging,
* handled 5xx monitoring,
* webhook timeout/error handling,
* alerting for critical production failures.

Do not treat security headers as complete merely because a subset is configured.

---

## 72. Production Documentation Integrity

Documentation must describe the implementation that actually exists.

Before release:

* Reconcile `docs/BUILD_PLAN.md` with `prisma/schema.prisma` and implemented workflows.
* Do not mark functionality complete if the schema or workflow is absent.
* Explicitly label deferred functionality.
* Update `docs/OPERATIONS.md` with verified recovery, migration, deployment, and rollback procedures.
* Update `docs/RELEASE_CHECKLIST.md` with evidence-based production gates.
* Keep README onboarding instructions accurate.
* Do not claim an operational capability has been verified without evidence.

Documentation is part of the production system.

---

## 73. Production Hardening Workflow

For each remediation:

1. Identify the audit finding or production invariant.
2. Inspect the current implementation before editing.
3. Make the smallest safe change that resolves the underlying issue.
4. Add or update regression tests.
5. Run targeted tests.
6. Run relevant integration tests.
7. Run lint and TypeScript checks.
8. Run the production build when applicable.
9. Update documentation when behavior or operational procedure changes.
10. Record remaining limitations.
11. Re-run the production-readiness audit after the high-severity remediation batch.

Do not close a finding merely because code was changed. Close it only when the required behavior and verification evidence exist.

---

## 74. Verification Standards

Production-hardening verification must distinguish:

* **Unit verified** — behavior tested in isolation.
* **Integration verified** — behavior tested against a real database/service boundary.
* **E2E verified** — behavior tested through the actual application workflow.
* **Operationally verified** — deployment, backup, restore, monitoring, or recovery behavior demonstrated in a realistic environment.

A production-critical control should use the strongest applicable verification level.

For financial correctness, authorization, RLS, transaction rollback, concurrency, migration reproducibility, and recovery, mocks alone are not sufficient.

---

## 75. Production-Hardening Definition of Done

Production hardening is complete only when:

* Mixed currencies cannot be combined incorrectly.
* Financial calculations use deterministic integer-minor-unit arithmetic.
* Group creation and other multi-record writes are atomic.
* Membership invariants are protected against race conditions.
* Authentication and redirect handling resist open redirects.
* Authorization is enforced server-side at relevant data-access boundaries.
* Real PostgreSQL/RLS integration tests pass.
* Concurrent financial writes are protected against stale updates.
* Settlement operations are idempotent.
* Expense split methods are preserved during edits.
* Financial history is paginated rather than silently truncated.
* Database migrations have one authoritative source of truth.
* Migration-before-deployment ordering is tested/documented.
* Runtime and migration database connections are correctly configured.
* Authenticated Playwright coverage runs in CI without silent skips.
* Production database restoration has been successfully demonstrated.
* Receipt recovery/access controls are verified.
* Security headers and monitoring are production-appropriate.
* Documentation accurately reflects implemented behavior.
* The release checklist is complete with evidence.
* No critical or high-severity production-readiness finding remains unresolved or explicitly accepted by the project owner.

---

## 76. Prohibitions During Production Hardening

Unless explicitly approved, do not:

* Add unrelated product features.
* Rewrite stable modules solely for stylistic reasons.
* Replace the established stack.
* Introduce a new backend service.
* Introduce a second ORM.
* Bypass Prisma authorization checks.
* Move financial logic into the browser.
* Disable RLS to make tests pass.
* Disable security checks to make E2E tests pass.
* Silence failing tests or convert meaningful failures into skips.
* Delete regression tests because they expose a real defect.
* Mark audit findings resolved without verification evidence.
* Use floating-point arithmetic for financial persistence or reconciliation.
* Treat client validation as sufficient for security or financial correctness.
* Treat successful local development as production readiness.

---

## 77. Final Engineering Principle

**Correctness before convenience. Recoverability before launch. Security before speed. Evidence before claims.**

When choosing between a faster implementation and one that provides stronger financial integrity, authorization, concurrency safety, recovery, or operational evidence, choose the safer implementation.

The MVP already exists. The remaining job is to make it trustworthy.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
