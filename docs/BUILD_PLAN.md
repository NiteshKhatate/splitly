# Splitly Build Plan

## How to use this plan with Codex

At the start of every work session, follow this instruction:

> You are implementing Splitly. Read `AGENTS.md` and `docs/BUILD_PLAN.md` completely before making changes. Read `docs/system-design.md` when the task involves architecture, database, authentication, authorization, server logic, or data flow.
>
> Identify the earliest incomplete stage. State the exact files you expect to change, then implement only that stage or a coherent vertical slice of it.
>
> Preserve the existing Splitly UI and design system. Do not introduce a new visual style unless explicitly requested.
>
> Use Prisma for all application database access and migrations. Use `DATABASE_URL` for runtime database access and `DIRECT_URL` for Prisma migrations.
>
> Do not skip database, authorization, validation, testing, accessibility, or responsive states.
>
> Run the prescribed verification and report the results.
>
> Update this document by checking off only work that is actually complete.
>
> Do not copy Splitwise trademarks, logos, text, source code, illustrations, UI assets, or data.

At the end of every work session, report:

1. Completed checklist items
2. Files created/modified
3. Commands executed and results
4. Database migrations added
5. Environment variables added or required
6. Tests added/updated
7. Known gaps
8. The single recommended next task

---

# Product Definition

## Primary user story

Three roommates create a household group.

One pays ₹2,400 for groceries, selects who participated, chooses how the expense is split, and saves it.

Everyone immediately sees the updated balances.

A debtor records an ₹800 settlement to the creditor.

The group's balances and activity trail update without modifying the original expense history.

---

# MVP Capabilities

Splitly v1 should support:

* Account authentication
* User profile
* Preferred currency
* Timezone
* Groups
* Group membership
* Group roles
* Invitations
* Expenses
* Multiple payers
* Participants
* Equal splits
* Exact-amount splits
* Percentage splits
* Shares/weights splits
* Personal dashboard
* Group dashboard
* Member balances
* Simplified debts
* Settlements
* Activity history
* Expense search/filtering
* Basic reminders
* CSV export

Receipt uploads are a later supporting workflow and should not block the core expense ledger.

---

# Explicit Non-Goals for v1

Do not implement:

* Payment gateway integration
* Bank/card transfers
* Automatic payment processing
* Currency conversion
* Recurring expenses
* Offline synchronization
* Native mobile applications
* Multi-organization administration
* Public social profiles
* AI receipt extraction
* Complex accounting/invoicing features

"Settle up" records an agreement/payment between users. It does not execute a real financial transfer.

---

# UX and Information Architecture

## Global Navigation

Desktop:

```text
Dashboard · Groups · Activity · Profile
```

Mobile:

```text
Bottom navigation
+
Persistent Add Expense action
```

Preserve the existing Splitly navigation and visual implementation.

Do not redesign the application while implementing domain functionality.

---

# Routes

| Route                        | Purpose            | Main actions                           |
| ---------------------------- | ------------------ | -------------------------------------- |
| `/`                          | Personal dashboard | View balances, activity, groups        |
| `/groups`                    | Group list         | Create/search/open groups              |
| `/groups/[groupId]`          | Group dashboard    | Add expense, settle up, manage members |
| `/groups/[groupId]/expenses` | Expense ledger     | Search/filter/view expenses            |
| `/groups/[groupId]/balances` | Group balances     | View debts and settlements             |
| `/expenses/[expenseId]`      | Expense detail     | View/edit/delete expense               |
| `/activity`                  | Activity history   | View/filter activity                   |
| `/settings`                  | Account settings   | Profile/preferences                    |

---

# UI Design Direction

The existing Splitly UI is the source of truth.

Preserve:

* Existing font family
* Existing typography scale
* Existing color tokens
* Existing green accent
* Existing spacing system
* Existing border radius
* Existing shadows
* Existing buttons
* Existing inputs
* Existing forms
* Existing cards
* Existing dialogs
* Existing navigation
* Existing responsive behavior

The visual direction is:

* Warm neutral background
* Confident green primary accent
* Clear numeric hierarchy
* Friendly original copy
* Cards only when they improve grouping
* Green for money owed to the user
* Amber/red for money the user owes
* Muted styling for settled states

Color must never be the only indicator of status.

Use icons, labels, or text alongside color.

Do not create one-off styling when an existing UI component can be reused.

---

# Technology Stack

## Application

* Next.js App Router
* TypeScript
* Tailwind CSS
* Node.js 22.x

## Database

* Supabase-hosted PostgreSQL
* Prisma ORM

## Authentication

* Auth.js

## Forms

* React Hook Form

## Validation

* Zod

## Testing

* Jest
* Playwright

## Deployment

* Vercel

## CI

* GitHub Actions

---

# Database Architecture

Supabase hosts PostgreSQL.

Prisma is the application's database access layer and owns:

* Prisma schema
* Database migrations
* Server-side queries
* Database transactions
* Seed data

Use:

```env
DATABASE_URL=
DIRECT_URL=
```

---

# DATABASE_URL

`DATABASE_URL` is the runtime database connection.

Use it for:

* Next.js server-side database access
* Prisma Client
* Application queries
* Application mutations

It must remain server-only.

Never expose it through:

```text
NEXT_PUBLIC_*
```

---

# DIRECT_URL

`DIRECT_URL` is the direct database connection.

Use it for:

* Prisma migrations
* Prisma schema operations
* Database administration
* Seed operations where required

It must remain server-only.

Never expose it through:

```text
NEXT_PUBLIC_*
```

---

# Prisma Rules

Prisma is the only application ORM.

Do not use:

* Raw Supabase database access from application code
* A second ORM
* Direct PostgreSQL queries from page components

Raw SQL may be used only when Prisma cannot reasonably express a required operation and the reason is documented.

All schema changes must be represented by Prisma migrations.

Do not make undocumented schema changes through the Supabase dashboard.

---

# Prisma Schema

The Prisma schema should live at:

```text
prisma/schema.prisma
```

Migrations should live under:

```text
prisma/migrations/
```

Seed logic should live in the project's configured Prisma seed location.

Use UUIDs for primary keys.

Use:

```text
createdAt
updatedAt
```

where appropriate.

Use archive/soft-delete fields where historical information matters.

---

# Core Domain Model

The initial domain model is:

```text
User
Group
GroupMember
Invite

Expense
ExpensePayment
ExpenseShare

Settlement

ActivityEvent

Attachment
```

---

# User

Suggested fields:

```text
id
name
email
avatarUrl
defaultCurrency
timezone
createdAt
updatedAt
```

Authentication identity comes from Auth.js.

Do not duplicate password storage in the User table.

---

# Group

Suggested fields:

```text
id
name
imageUrl
defaultCurrency
archivedAt
createdAt
updatedAt
```

Relationships:

```text
Group
 ├── GroupMember
 ├── Expense
 ├── Settlement
 ├── ActivityEvent
 └── Invite
```

---

# GroupMember

Suggested fields:

```text
id
groupId
userId
role
joinedAt
leftAt
createdAt
updatedAt
```

Roles:

```text
OWNER
MEMBER
```

A user must not have duplicate active membership in the same group.

---

# Invite

Suggested fields:

```text
id
groupId
email
token
role
expiresAt
acceptedAt
createdAt
```

Invitation tokens must:

* Be securely generated
* Expire
* Be single-use
* Not expose unnecessary information

---

# Expense

Suggested fields:

```text
id
groupId
description
date
currency
totalMinor
notes
category
createdBy
deletedAt
createdAt
updatedAt
```

Money must always use integer minor units.

Example:

```text
₹2,400.00 → 240000 paise
$24.00    → 2400 cents
```

Never use JavaScript floating-point numbers as the financial source of truth.

---

# ExpensePayment

Represents who actually paid money for an expense.

Suggested fields:

```text
id
expenseId
payerId
amountMinor
createdAt
```

An expense may have one or multiple payers.

Invariant:

```text
sum(ExpensePayment.amountMinor) === Expense.totalMinor
```

---

# ExpenseShare

Represents who owes what portion of an expense.

Suggested fields:

```text
id
expenseId
participantId
owedMinor
splitMethod
createdAt
```

`ExpenseShare` is the canonical participant obligation.

Invariant:

```text
sum(ExpenseShare.owedMinor) === Expense.totalMinor
```

Do not rewrite historical shares merely to simplify debts.

---

# Settlement

Suggested fields:

```text
id
groupId
payerId
payeeId
amountMinor
currency
date
note
createdBy
createdAt
updatedAt
```

Rules:

* Payer and payee must differ.
* Both must be active group members.
* Amount must be positive.
* Currency must match the relevant group/financial context.
* Settlement does not modify historical expenses.

---

# ActivityEvent

Suggested fields:

```text
id
groupId
actorId
type
entityType
entityId
metadata
createdAt
```

Use structured metadata rather than storing only human-readable strings.

Activity events should allow the UI to generate useful descriptions.

---

# Attachment

Receipt attachments are optional and belong to the later receipt-storage phase.

Suggested fields:

```text
id
expenseId
storageKey
mimeType
byteSize
uploadedBy
createdAt
```

Do not implement public receipt storage during the core expense phase.

---

# Financial Invariants

Every financial implementation must preserve these rules.

## Expense payments

```text
sum(payments) === expense.totalMinor
```

## Expense shares

```text
sum(shares) === expense.totalMinor
```

## Group membership

Every payer and participant must be an active member of the group.

## Positive amounts

Expense and settlement amounts must be positive where applicable.

## Integer arithmetic

Financial calculations must use integer minor units.

## Balance conservation

For every group and currency:

```text
sum(memberNetBalances) === 0
```

---

# Balance Formula

For each member:

```text
net balance = amount paid - amount owed
```

Settlements adjust the resulting balance.

Positive balance:

```text
The group owes this person.
```

Negative balance:

```text
This person owes the group.
```

Zero:

```text
Settled.
```

---

# Debt Simplification

Do not modify expenses or expense shares to simplify debts.

First calculate raw member balances.

Then:

1. Separate creditors and debtors.
2. Sort deterministically.
3. Match debtor and creditor amounts.
4. Transfer the minimum outstanding amount.
5. Continue until all possible balances are resolved.

The output should be deterministic and testable.

Preserve both:

```text
Raw balances
```

and:

```text
Suggested transfers
```

---

# Authorization

Every protected operation must verify:

1. Authentication
2. Group membership
3. Required role
4. Resource ownership/permission where applicable

Examples:

```text
Create group
→ authenticated user

View group
→ active member

Add/remove member
→ owner

Archive group
→ owner

Create expense
→ active member

Edit expense
→ expense creator or owner

Delete expense
→ expense creator or owner

Create settlement
→ authorized group member
```

Exact permissions should follow the product rules and system design.

---

# Supabase RLS

Supabase PostgreSQL is the database host.

Prisma server-side queries must enforce application-level authorization.

Do not rely on RLS as the only authorization layer for Prisma.

If a browser-facing Supabase client or Supabase Data API is introduced later:

* Enable RLS on every exposed table.
* Add explicit policies.
* Test those policies.
* Do not disable RLS to resolve application errors.

---

# Forms and Validation

Use React Hook Form for interactive forms.

Use Zod for validation.

Preferred pattern:

```text
React Hook Form
      ↓
Zod validation
      ↓
Server Action / Route Handler
      ↓
Server-side Zod validation
      ↓
Authorization
      ↓
Service layer
      ↓
Prisma transaction
      ↓
PostgreSQL
```

Never rely solely on client-side validation.

---

# Application Structure

Use the repository's existing directory conventions.

Expected areas include:

```text
src/
├── app/
├── components/
├── features/
├── lib/
└── server/

prisma/
tests/
docs/
```

Keep page components thin.

Business logic belongs in appropriate service/domain modules.

Database operations should not be scattered across UI components.

---

# Testing Strategy

Use Jest for:

* Domain logic
* Validation
* Balance calculations
* Split calculations
* Authorization/service logic
* Important integration behavior

Use Playwright for:

* Critical end-to-end journeys
* Authentication flow
* Group creation
* Invitation/acceptance
* Expense creation
* Balance viewing
* Settlement
* Access-denied scenarios
* Mobile workflow verification

---

# Test Priorities

Highest priority:

```text
Split calculations
Balance calculations
Debt simplification
Financial invariants
Authorization
Validation
Transactions
Settlement behavior
```

Do not write tests merely to increase coverage percentages.

---

# Stage 0 — Foundation

Status:

```text
[x] Complete
```

Tasks:

* [x] Create Next.js TypeScript application.
* [x] Configure App Router.
* [x] Configure Tailwind CSS.
* [x] Configure ESLint.
* [x] Configure Prettier.
* [x] Configure strict TypeScript.
* [x] Establish `src/app`.
* [x] Establish `src/components`.
* [x] Establish `src/features`.
* [x] Establish `src/lib`.
* [x] Establish `src/server`.
* [x] Establish `prisma`.
* [x] Establish `tests`.
* [x] Create `.env.example`.
* [x] Configure Prisma.
* [x] Configure database connection structure.
* [x] Add health endpoint.
* [x] Add CI.
* [x] Create original Splitly application shell.
* [x] Create responsive navigation.
* [x] Create existing Splitly design tokens.
* [x] Add toast infrastructure.
* [x] Add error boundary.
* [x] Add loading states.
* [x] Add empty states.

### Stage 0 Acceptance

A new developer can:

1. Install dependencies.
2. Configure environment variables.
3. Start the application.
4. Load the responsive Splitly shell.
5. Run lint.
6. Run typecheck.
7. Run tests.
8. Build the application successfully.

---

# Stage 1 — Identity and Groups

Status:

```text
[x] Complete
```

Tasks:

* [x] Configure `DATABASE_URL`.
* [x] Configure `DIRECT_URL`.
* [x] Configure Prisma migrations using `DIRECT_URL`.
* [x] Verify pooled runtime connection.
* [x] Verify direct migration connection.
* [x] Configure Auth.js.
* [x] Configure protected application routes.
* [x] Implement profile onboarding.
* [x] Implement display name.
* [x] Implement preferred currency.
* [x] Implement timezone.
* [x] Create User schema.
* [x] Create Group schema.
* [x] Create GroupMember schema.
* [x] Create Invite schema.
* [x] Add Prisma migrations.
* [x] Implement create group.
* [x] Implement group list.
* [x] Implement group detail.
* [x] Implement membership authorization.
* [x] Implement invitations.
* [x] Implement expiring invitation tokens.
* [x] Handle already-registered invitation emails.
* [x] Handle invitation acceptance by another account safely.
* [x] Implement member management.
* [x] Implement role controls.
* [x] Implement leave group.
* [x] Implement archive group.
* [x] Add Flatmates development seed data.

### Stage 1 Acceptance

* [x] Unauthenticated users cannot access protected group data.
* [x] Authenticated users can create groups.
* [x] Owners can invite members.
* [x] Members can see only their authorized groups.
* [x] Membership changes enforce authorization.

---

# Stage 2 — Expense Ledger

Status:

```text
[x] Complete
```

This stage is complete.

## Database

* [x] Create `Expense`.
* [x] Create `ExpensePayment`.
* [x] Create `ExpenseShare`.
* [x] Create `ActivityEvent`.
* [x] Create expense categories.
* [x] Add Prisma migration.
* [x] Update seed data if necessary. (No seed change was required; existing development data was preserved.)
* [x] Verify database constraints.

## Split Calculation Engine

* [x] Create a pure, independently testable calculation module.

Support:

* [x] Equal splits.
* [x] Exact-amount splits.
* [x] Percentage splits using integer basis points.
* [x] Shares/weights splits.

The calculation engine must:

* [x] Use integer minor units.
* [x] Detect invalid inputs.
* [x] Detect totals that do not reconcile.
* [x] Handle rounding deterministically.
* [x] Allocate remainders with largest-remainder allocation and participant-ID tie-breaking.
* [x] Never produce negative owed amounts.
* [x] Never lose minor units.

Example:

```text
₹10.00 / 3
```

must produce integer minor-unit allocations whose sum is exactly ₹10.00.

## Add Expense

* [x] Build the add-expense flow.

The form should support:

* [x] Description
* [x] Amount
* [x] Currency
* [x] Date
* [x] Payer(s)
* [x] Participants
* [x] Split method
* [x] Split amounts
* [x] Notes
* [x] Category

* [x] Use React Hook Form with shared Zod validation.

```text
React Hook Form
+
Zod
```

* [x] Provide a live, precise amount preview.

* [x] Validate all values again on the server and recalculate shares there.

## Transaction

* [x] Create an expense using one Prisma database transaction:

```text
Expense
+
ExpensePayment[]
+
ExpenseShare[]
+
ActivityEvent
```

If any operation fails:

```text
rollback everything
```

* [x] Propagate any failed write so Prisma rolls back the complete transaction.

## Expense List

* [x] Implement:

```text
/groups/[groupId]/expenses
```

Support:

* [x] Expense list
* [x] Date
* [x] Description
* [x] Payer
* [x] Amount
* [x] Category
* [x] Participants
* [x] Empty state
* [x] Loading state
* [x] Error state
* [x] Responsive/mobile layout

## Expense Detail

* [x] Implement:

```text
/expenses/[expenseId]
```

Display:

* [x] Description
* [x] Total
* [x] Currency
* [x] Date
* [x] Payers
* [x] Participants
* [x] Individual shares
* [x] Split method
* [x] Notes
* [x] Activity information where appropriate

## Edit/Delete

* [x] Allow editing/deletion for the expense creator or group owner.

* [x] Use Prisma transactions.

* [x] Write activity events for financially material changes.

* [x] Soft-delete expenses to preserve audit/history.

## Filters

* [x] Add:

* [x] Date filter
* [x] Member filter
* [x] Category filter

* [x] Add description search.

## Receipts

Do not implement actual receipt storage during the core ledger stage.

Only expose receipt UI if the storage architecture is already configured.

### Stage 2 Acceptance

The system can:

* [x] Create expenses for 2–10 members.
* [x] Support equal splits.
* [x] Support exact splits.
* [x] Support percentage splits.
* [x] Support shares/weights.
* [x] Support multiple payers.
* [x] Correctly handle rounding.
* [x] Prevent invalid totals.
* [x] Persist all records transactionally.
* [x] Display expenses.
* [x] View expense details.
* [x] Edit authorized expenses.
* [x] Delete authorized expenses.
* [x] Record appropriate activity events.

No financial amount may be lost through rounding.

---

# Stage 3 — Balances and Settlements

Status:

```text
[x] Complete
```

## Balance Engine

* [x] Implement pure tested functions for:

* [x] Member net balances
* [x] Group balances
* [x] Currency isolation
* [x] Settlement adjustments
* [x] Debt simplification

Tests must include:

* [x] Multiple expenses
* [x] Multiple payers
* [x] Unequal splits
* [x] Zero balances
* [x] Partial settlements
* [x] Multiple settlements
* [x] Rounding
* [x] Multiple currencies where applicable

## Dashboard

Implement/update:

```text
/
```

Display:

* [x] Total owed to user
* [x] Total user owes
* [x] Net position
* [x] Recent activity
* [x] Groups
* [x] Group-level summaries

Preserve the existing Splitly UI.

## Group Balances

Implement:

```text
/groups/[groupId]/balances
```

Display:

* [x] Raw member balances
* [x] Who owes whom
* [x] Suggested repayments
* [x] Currency
* [x] Settlement history

Clearly distinguish:

```text
You owe
You are owed
Settled
```

Never rely solely on color.

## Settlement

* [x] Create the `Settlement` Prisma model/migration.

Build:

```text
Record settlement
```

The form should support:

* [x] Authenticated user shown as the fixed payer
* [x] Payee
* [x] Amount
* [x] Date
* [x] Note

Use React Hook Form + Zod.

Validate:

* [x] Authenticated payer exists
* [x] Payee exists
* [x] Payer != payee
* [x] Both are active members
* [x] Amount > 0
* [x] Currency is valid

* [x] Write settlement and activity in one transaction.
* [x] Create settlements as pending until the recipient confirms them.
* [x] Allow only the recipient to confirm a pending settlement.
* [x] Exclude pending settlements from balances and dashboard activity.

## Settle Up

Allow a suggested debt to prefill:

* [x] Payer
* [x] Payee
* [x] Amount

* [x] Allow a valid partial amount.

### Stage 3 Acceptance

* [x] Every posted expense changes balances correctly.
* [x] Every settlement changes balances correctly.
* [x] Group balances reconcile to zero.
* [x] Debt simplification is deterministic.
* [x] Raw balances remain available.
* [x] Suggested transfers resolve outstanding balances.
* [x] Historical expenses remain unchanged.

---

# Stage 4 — Supporting Workflows and Polish

Status:

```text
[ ] Incomplete
```

## Activity

Implement:

```text
/activity
```

and group activity feeds.

Support useful human-readable events such as:

```text
Alex added ₹2,400 grocery expense
Sam joined the group
Priya settled ₹800 with Alex
```

Activity data must come from structured events.

## Reminders

Implement reminder preferences.

Scheduled reminders should:

* Target valid members.
* Respect notification preferences.
* Only contact members with outstanding balances.
* Avoid duplicate notifications.
* Log deliveries.

Do not implement a complex notification platform.

## CSV Export

Support authorized export of expenses.

Allow:

* Group filter
* Date filter
* Appropriate expense fields

Verify exported values are financially correct.

## Receipt Upload

Implement secure receipt uploads:

```text
User
 ↓
MIME validation
 ↓
File-size validation
 ↓
Private storage
 ↓
Attachment metadata
 ↓
Signed retrieval URL
```

Requirements:

* Private objects
* MIME checks
* Size limits
* Signed URLs
* Authorization
* Cleanup after deletion

## Accessibility

Complete:

* Keyboard navigation
* Focus states
* Screen-reader labels
* Form errors
* Dialog accessibility
* Touch target checks

## Responsive QA

Manually verify:

* Mobile
* Tablet
* Desktop

Critical workflows:

```text
Login
Create group
Add member
Add expense
View expense
View balance
Settle up
```

## Empty/Error/Loading States

Ensure all important screens have:

* Loading
* Empty
* Error
* Unauthorized
* Success states

### Stage 4 Acceptance

Core workflows are polished on mobile and desktop.

Exports are correct.

Receipts are securely handled.

Optional workflows fail gracefully.

---

# Stage 5 — Release Readiness

Status:

```text
[ ] Incomplete
```

## Security

Add:

* Rate limiting
* Authentication endpoint protection
* Invite endpoint protection
* Upload limits
* Mutation protection
* Content Security Policy
* Security headers
* Secure cookies
* Input size limits

## Monitoring

Add:

* Error monitoring
* PII redaction
* Health checks
* Uptime monitoring

Do not log:

* Passwords
* Database credentials
* Auth tokens
* Service-role keys
* Sensitive financial information unnecessarily

## Database Reliability

Confirm:

* Supabase backup policy
* PITR configuration where applicable
* Recovery process
* Restoration procedure
* Disposable-project restoration test

Document Prisma migration rollback procedures.

## Production Configuration

Configure:

```text
DATABASE_URL
DIRECT_URL
Auth.js secrets
Auth.js provider credentials
Application URL
Other required production variables
```

All production secrets must be stored in Vercel/environment secret management.

Never commit them.

## Vercel

Confirm:

* GitHub repository connection
* Preview deployments
* Production deployment
* Production environment variables
* Build configuration
* Domain
* Health endpoint

Vercel handles application deployment.

GitHub Actions handles CI.

Do not create a separate deployment server.

## Final QA

Perform:

* Accessibility audit
* Performance audit
* Security review
* Mobile QA
* Desktop QA
* Fresh-account acceptance test
* Database migration verification
* Backup/recovery verification

### Stage 5 Acceptance

A fresh user can:

```text
Sign up
  ↓
Create group
  ↓
Invite member
  ↓
Add expense
  ↓
View balances
  ↓
Settle up
  ↓
Review activity
```

without encountering critical errors.

---

# Test Matrix

## Unit Tests

Jest must cover:

* Equal split
* Exact split
* Percentage split
* Shares/weights split
* Rounding
* Remainder allocation
* Invalid split
* Multiple payers
* Balance calculation
* Debt simplification
* Currency isolation
* Settlement calculations
* Zod validation

Example fixture:

```text
₹10.00 split among 3 people
```

Example:

```text
₹2,400
40% / 35% / 25%
```

Assert integer minor-unit values.

Do not assert formatted display strings for financial correctness.

---

# Integration Tests

Cover:

* Authorization
* Group membership
* Invitation acceptance
* Expense creation
* Transaction rollback
* Expense edit
* Expense deletion
* Settlement creation
* Unauthorized access

Financial writes must be tested for atomicity.

---

# End-to-End Tests

Playwright should cover the critical journey:

```text
Sign in
 ↓
Create group
 ↓
Invite/accept member
 ↓
Add expense
 ↓
View balance
 ↓
Settle up
 ↓
Verify updated balance
```

Also include:

* Mobile viewport
* Access-denied scenario
* Invalid form submission

---

# Database Test Rules

Do not run ordinary tests against production Supabase.

Do not use:

```text
Production DATABASE_URL
Production DIRECT_URL
Production service_role credentials
```

for normal automated tests.

Use a dedicated test/development environment where database integration tests are required.

---

# CI/CD

GitHub Actions is responsible for CI.

Vercel is responsible for application deployment.

CI should run:

```text
Install dependencies
 ↓
Lint
 ↓
Typecheck
 ↓
Jest
 ↓
Production build
```

Playwright may run in CI when the required test environment is available.

The exact commands must be taken from `package.json`.

Do not invent package scripts.

---

# Environment Variables

Local development should use:

```env
DATABASE_URL=
DIRECT_URL=
```

plus the required Auth.js and application variables.

Example documentation only:

```env
DATABASE_URL="..."
DIRECT_URL="..."
```

Never place real credentials in:

* Git
* Documentation
* Tests
* Screenshots
* Logs
* Example files

`.env.example` must contain placeholders only.

---

# Git and Commit Strategy

Prefer reviewable commits:

```text
chore: scaffold application
feat: add authentication and groups
feat: add expense split ledger
feat: add balances and settlements
feat: add activity and export
chore: harden release
```

Do not bundle unrelated visual rewrites with database migrations.

Do not mix unrelated refactoring into feature commits.

---

# Development Commands

Use the package manager and scripts actually configured in `package.json`.

Typical commands:

```bash
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
npx prisma generate
npx prisma migrate dev
npx prisma db seed
```

For Prisma migrations:

```text
Development:
DIRECT_URL

Runtime:
DATABASE_URL
```

Never print either connection string while verifying connectivity.

---

# Definition of Done

A task is complete only when:

* [ ] Implementation is complete.
* [ ] TypeScript passes.
* [ ] Lint passes.
* [ ] Relevant Jest tests pass.
* [ ] Relevant Playwright tests pass where applicable.
* [ ] Authorization has been considered.
* [ ] Validation has been implemented.
* [ ] Loading state exists where required.
* [ ] Empty state exists where required.
* [ ] Error state exists where required.
* [ ] Unauthorized state exists where required.
* [ ] Mobile layout has been considered.
* [ ] Desktop layout has been considered.
* [ ] Existing Splitly UI/design has been preserved.
* [ ] Schema changes have Prisma migrations.
* [ ] Seed data remains valid.
* [ ] No secrets were committed.
* [ ] No unnecessary dependencies were introduced.
* [ ] No unrelated files were modified.

---

# Recorded Decisions

1. **Application:** Next.js App Router + TypeScript.
2. **Styling:** Tailwind CSS with the existing Splitly design system.
3. **Database:** Supabase-hosted PostgreSQL.
4. **ORM:** Prisma.
5. **Runtime database connection:** `DATABASE_URL`.
6. **Migration database connection:** `DIRECT_URL`.
7. **Authentication:** Auth.js.
8. **Forms:** React Hook Form.
9. **Validation:** Zod.
10. **Unit/integration testing:** Jest.
11. **End-to-end testing:** Playwright.
12. **CI:** GitHub Actions.
13. **Deployment:** Vercel.
14. **Currency storage:** Integer minor units.
15. **Expense source of truth:** `ExpenseShare`.
16. **Settlement:** Ledger event/agreement; no payment gateway.
17. **Membership:** Email-bound expiring invitations.
18. **Initial currency:** User-selected, with INR preselected.
19. **Scope:** Private beta for friends/households before public launch.

---

# Current Development Position

```text
Stage 0 — Foundation
████████████████████ 100%

Stage 1 — Identity & Groups
████████████████████ 100%

Stage 2 — Expense Ledger
████████████████████ 100%

Stage 3 — Balances & Settlements
████████████████████ 100%

Stage 4 — Supporting Workflows & Polish
░░░░░░░░░░░░░░░░░░░░ 0%

Stage 5 — Release Readiness
░░░░░░░░░░░░░░░░░░░░ 0%
```

## Next Recommended Task

**Begin Stage 4 with the authorized activity history.**

Implement:

```text
Authorized personal activity feed
Authorized group activity feeds
Activity type and group filters
Pagination or load-more behavior
Loading, empty, error, and responsive states
```
