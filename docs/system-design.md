# Splitly — System Design

## 1. Purpose

This document defines the technical architecture and engineering design for Splitly.

Splitly is a web application for tracking shared expenses between people, calculating balances, and recording settlements.

The system must prioritize:

1. Financial correctness
2. Data integrity
3. Authorization and security
4. Auditability
5. Maintainability
6. Responsive UX
7. Low operational complexity

This document describes **how the system works**.

`docs/BUILD_PLAN.md` describes **what should be built and in what order**.

`AGENTS.md` describes **how agents and developers should work within this architecture**.

---

# 2. System Overview

```text
┌─────────────────────────────────────────────┐
│                   Browser                   │
│                                             │
│  Next.js UI                                │
│  React Components                          │
│  React Hook Form                            │
│  Client-side Zod validation                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                Next.js Server               │
│                                             │
│  App Router                                 │
│  Server Components                          │
│  Server Actions / Route Handlers            │
│                                             │
│  Authentication                             │
│  Authorization                              │
│  Server-side Zod validation                 │
│  Domain Services                             │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                 Domain Layer                │
│                                             │
│  Expense calculations                       │
│  Split calculations                          │
│  Balance calculations                        │
│  Debt simplification                         │
│  Settlement calculations                     │
│  Business invariants                         │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│                    Prisma                   │
│                                             │
│  Queries                                    │
│  Mutations                                  │
│  Transactions                               │
│  Schema                                     │
│  Migrations                                 │
└──────────────────────┬──────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────┐
│            Supabase PostgreSQL              │
│                                             │
│  Persistent application data                │
│  RLS enabled                                │
└─────────────────────────────────────────────┘
```

---

# 3. Technology Stack

## Frontend

* Next.js App Router
* React
* TypeScript
* Tailwind CSS
* Node.js 22.x runtime

## Forms

* React Hook Form

## Validation

* Zod

## Authentication

* Supabase Authentication

## Database

* Supabase PostgreSQL

## ORM

* Prisma

## Testing

* Jest
* Playwright

## CI

* GitHub Actions

## Deployment

* Vercel

---

# 4. Architectural Principles

## 4.1 Thin UI

React components should primarily handle:

* Presentation
* User interaction
* Form state
* Loading state
* Error state
* Accessibility

They should not contain significant business logic.

---

## 4.2 Server-Owned Business Rules

Business rules must be enforced on the server.

The client is untrusted.

Never assume a client-provided value is correct merely because the UI generated it.

Examples:

* Total amount
* Currency
* User ID
* Group ID
* Group membership
* Role
* Expense ownership
* Split amounts

---

## 4.3 Pure Financial Logic

Financial calculations should be implemented as pure functions wherever possible.

Example:

```text
calculateEqualSplit()
calculateExactSplit()
calculatePercentageSplit()
calculateSharesSplit()
calculateBalances()
simplifyDebts()
```

Pure financial functions should not depend on:

* React
* Next.js
* Prisma
* Database state
* Browser APIs

This makes them deterministic and easy to test.

---

## 4.4 Transactional Financial Writes

Financially material database writes must be atomic.

For example:

```text
Create Expense
 ├── Expense
 ├── ExpensePayment[]
 ├── ExpenseShare[]
 └── ActivityEvent
```

All records must be committed together.

If one fails, everything must roll back.

---

# 5. Application Layers

Splitly uses the following logical layers.

```text
Presentation
     ↓
Application
     ↓
Domain
     ↓
Persistence
```

## Presentation

Responsible for:

* Pages
* Components
* Forms
* User interaction
* Responsive layouts

---

## Application

Responsible for:

* Server Actions
* Route Handlers
* Authentication context
* Authorization checks
* Calling domain services
* Coordinating transactions

---

## Domain

Responsible for:

* Financial calculations
* Business invariants
* Split logic
* Balance logic
* Debt simplification
* Settlement rules

---

## Persistence

Responsible for:

* Prisma Client
* Database queries
* Transactions
* Prisma schema
* Migrations

---

# 6. Recommended Project Structure

The exact structure may evolve, but the intended separation is:

```text
src/
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   ├── groups/
│   ├── expenses/
│   ├── activity/
│   └── settings/
│
├── components/
│   ├── ui/
│   ├── forms/
│   └── layout/
│
├── features/
│   ├── auth/
│   ├── groups/
│   ├── expenses/
│   ├── balances/
│   ├── settlements/
│   └── activity/
│
├── lib/
│   ├── auth/
│   ├── validation/
│   ├── utils/
│   └── config/
│
└── server/
    ├── services/
    ├── repositories/
    └── domain/
```

Do not create folders merely to satisfy this diagram.

Use the repository's existing conventions where they are already established.

---

# 7. Routing Architecture

## Dashboard

```text
/
```

Purpose:

* Personal financial overview
* Groups
* Recent activity
* Amount owed
* Amount owed to user

---

## Groups

```text
/groups
```

Purpose:

* List groups
* Search groups
* Create group

---

## Group Dashboard

```text
/groups/[groupId]
```

Purpose:

* Group summary
* Members
* Recent expenses
* Balance summary
* Add expense
* Settle up

---

## Group Expenses

```text
/groups/[groupId]/expenses
```

Purpose:

* Expense history
* Search
* Filters
* Expense navigation

---

## Group Balances

```text
/groups/[groupId]/balances
```

Purpose:

* Member balances
* Suggested transfers
* Settlement history

---

## Expense Detail

```text
/expenses/[expenseId]
```

Purpose:

* Expense information
* Participants
* Payers
* Split details
* Edit/delete where authorized

---

## Activity

```text
/activity
```

Purpose:

* User activity
* Group activity
* Financial events

---

## Settings

```text
/settings
```

Purpose:

* Profile
* Currency
* Timezone
* Notification preferences

---

# 8. Authentication Architecture

Supabase Authentication is the authentication provider.

Authentication determines the current user.

Application authorization determines what the user can access.

```text
Request
   ↓
Supabase Auth session
   ↓
Current user
   ↓
Application authorization
   ↓
Resource access
```

Do not use client-side session state as the authorization mechanism.

Every protected server operation must verify the authenticated user.

---

# 9. Authorization Architecture

Authorization should be enforced close to the server-side operation.

Example:

```text
Server Action
     ↓
getCurrentUser()
     ↓
requireGroupMembership()
     ↓
requireGroupRole()
     ↓
Business operation
```

Never do:

```text
Client says:
"I am an owner."
```

Instead:

```text
Server:
Fetch current user
Fetch group membership
Verify role
Perform operation
```

---

# 10. Group Authorization

Group membership is represented by `GroupMember`.

A protected group operation must verify that:

```text
GroupMember.userId === currentUser.id
```

and:

```text
GroupMember.leftAt IS NULL
```

where applicable.

Role-based operations must additionally verify the member role.

---

# 11. Database Architecture

Supabase provides managed PostgreSQL.

Prisma provides application-level database access.

```text
Next.js
   ↓
Prisma Client
   ↓
DATABASE_URL
   ↓
Supabase PostgreSQL
```

Prisma is the authoritative ORM.

---

# 12. Database Connections

Two PostgreSQL connections are required.

## Runtime

```env
DATABASE_URL=
```

Used by:

* Prisma Client
* Application server
* Runtime queries
* Runtime mutations

This should normally use the Supabase pooled connection.

---

## Migration

```env
DIRECT_URL=
```

Used by:

* Prisma migrations
* Prisma database administration
* Schema operations

This should use the Supabase direct connection.

Both variables are server-only.

Never expose either as:

```text
NEXT_PUBLIC_*
```

---

# 13. Prisma Architecture

Prisma owns:

```text
prisma/
├── schema.prisma
└── migrations/
```

Prisma Client should be initialized using the project's standard singleton/server pattern.

Avoid creating a new Prisma Client instance for every request in development.

Application code should access the database through server-side modules.

---

# 14. Prisma Migrations

Database changes follow:

```text
Modify schema.prisma
        ↓
Generate migration
        ↓
Review migration
        ↓
Apply migration
        ↓
Test
```

Never manually modify production schema without representing the change in Prisma.

Do not modify previously-applied production migrations.

---

# 15. Row Level Security

Supabase has RLS enabled.

RLS provides an additional database security boundary.

However, Prisma server operations must still enforce application-level authorization.

The application should not depend on RLS alone for authorization.

If browser-side Supabase access is introduced later:

```text
Browser
   ↓
Supabase client
   ↓
RLS
   ↓
PostgreSQL
```

Every exposed table must have explicit RLS policies.

Those policies must be tested.

Do not disable RLS to solve an authorization/query problem.

---

# 16. Core Data Model

The initial domain consists of:

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

# 17. User

Conceptual model:

```text
User
├── id
├── name
├── email
├── avatarUrl
├── defaultCurrency
├── timezone
├── createdAt
└── updatedAt
```

Supabase Authentication owns authentication identity.

Do not store authentication passwords in the application User model when Supabase Authentication handles identity.

---

# 18. Group

Conceptual model:

```text
Group
├── id
├── name
├── imageUrl
├── defaultCurrency
├── archivedAt
├── createdAt
└── updatedAt
```

Relationships:

```text
Group
├── GroupMember[]
├── Invite[]
├── Expense[]
├── Settlement[]
└── ActivityEvent[]
```

---

# 19. GroupMember

Conceptual model:

```text
GroupMember
├── id
├── groupId
├── userId
├── role
├── joinedAt
├── leftAt
├── createdAt
└── updatedAt
```

Roles initially:

```text
OWNER
MEMBER
```

An active user must not have multiple active memberships in the same group.

---

# 20. Invite

Conceptual model:

```text
Invite
├── id
├── groupId
├── email
├── token
├── role
├── expiresAt
├── acceptedAt
└── createdAt
```

Invitation requirements:

* Secure token generation
* Expiration
* Single-use acceptance
* Email association
* Authorization
* Safe handling of already-registered users

Do not expose raw invitation secrets unnecessarily.

---

# 21. Expense

Conceptual model:

```text
Expense
├── id
├── groupId
├── description
├── totalMinor
├── currency
├── date
├── category
├── notes
├── createdBy
├── deletedAt
├── createdAt
└── updatedAt
```

The total is stored as an integer minor unit.

---

# 22. ExpensePayment

Represents who paid.

```text
ExpensePayment
├── id
├── expenseId
├── payerId
├── amountMinor
└── createdAt
```

An expense may have multiple payers.

Invariant:

```text
SUM(ExpensePayment.amountMinor)
=
Expense.totalMinor
```

---

# 23. ExpenseShare

Represents who owes the expense.

```text
ExpenseShare
├── id
├── expenseId
├── participantId
├── owedMinor
├── splitMethod
└── createdAt
```

`ExpenseShare` is the canonical participant obligation.

Invariant:

```text
SUM(ExpenseShare.owedMinor)
=
Expense.totalMinor
```

---

# 24. Settlement

Conceptual model:

```text
Settlement
├── id
├── groupId
├── payerId
├── payeeId
├── amountMinor
├── currency
├── date
├── note
├── status
├── confirmedAt
├── createdBy
├── createdAt
└── updatedAt
```

Rules:

```text
payer !== payee
 payer === authenticated creator
amountMinor > 0
payer ∈ active group members
payee ∈ active group members
pending settlements do not affect balances
only the payee may confirm a pending settlement
```

A settlement does not modify historical expenses.

---

# 25. ActivityEvent

Conceptual model:

```text
ActivityEvent
├── id
├── groupId
├── actorId
├── type
├── entityType
├── entityId
├── metadata
└── createdAt
```

Examples:

```text
EXPENSE_CREATED
EXPENSE_UPDATED
EXPENSE_DELETED
SETTLEMENT_CREATED
MEMBER_JOINED
MEMBER_REMOVED
GROUP_CREATED
```

Use structured metadata.

The UI should generate display text from structured event data.

---

# 26. Attachment

Receipt storage is a later-stage capability.

Conceptual model:

```text
Attachment
├── id
├── expenseId
├── storageKey
├── mimeType
├── byteSize
├── uploadedBy
└── createdAt
```

Storage objects must be private.

Access should use authorization plus signed retrieval URLs.

---

# 27. Monetary Representation

All monetary values are stored as integer minor units.

Example:

```text
₹1,250.50
```

is represented as:

```text
125050
```

assuming paise.

Never store:

```text
1250.50
```

as the authoritative financial value.

Never perform final financial calculations using JavaScript floating-point arithmetic.

---

# 28. Currency

Every monetary operation must have a currency context.

Currency values use ISO currency codes.

Example:

```text
INR
USD
EUR
GBP
```

Do not silently convert currencies.

Currency conversion is outside the initial MVP.

Balances should not combine unrelated currencies.

---

# 29. Split Engine

The split engine is a pure domain module.

Input:

```text
totalMinor
participants
splitMethod
splitConfiguration
```

Output:

```text
participantId → owedMinor
```

Supported methods:

```text
EQUAL
EXACT
PERCENTAGE
SHARES
```

---

# 30. Equal Split

Example:

```text
₹1,000
3 participants
```

The engine must produce integer allocations whose total is exactly:

```text
₹1,000
```

If rounding produces a remainder, allocate it deterministically.

Never discard minor units.

---

# 31. Exact Split

The user specifies each participant's amount.

Validation:

```text
SUM(participant amounts)
=
totalMinor
```

Otherwise reject the operation.

---

# 32. Percentage Split

The user specifies percentages.

Validation:

```text
SUM(percentages)
=
100%
```

The final minor-unit allocations must reconcile exactly to the total.

Rounding must be deterministic.

---

# 33. Shares Split

The user specifies weights.

Example:

```text
Alex = 1
Sam  = 2
Priya = 1
```

Total shares:

```text
4
```

The engine distributes the expense according to the weights.

Final allocations must reconcile exactly.

---

# 34. Rounding Strategy

Rounding must be deterministic.

Recommended conceptual approach:

```text
Calculate exact proportional values
        ↓
Take floor/minor-unit base values
        ↓
Calculate remaining minor units
        ↓
Distribute remainder deterministically
        ↓
Verify total
```

The exact algorithm should be implemented and covered by Jest tests.

---

# 35. Expense Creation Flow

```text
User opens Add Expense
        ↓
React Hook Form
        ↓
User enters amount/payers/participants
        ↓
Client Zod validation
        ↓
Preview split
        ↓
Submit
        ↓
Server Action
        ↓
Authenticate user
        ↓
Validate request with Zod
        ↓
Verify group membership
        ↓
Verify payer/participant membership
        ↓
Calculate shares on server
        ↓
Verify financial invariants
        ↓
Prisma transaction
        ├── Expense
        ├── ExpensePayment[]
        ├── ExpenseShare[]
        └── ActivityEvent
        ↓
Return success
        ↓
Refresh/revalidate relevant UI
```

The server recalculates financial values.

Never trust the client's calculated shares.

---

# 36. Expense Edit Flow

```text
Request
 ↓
Authenticate
 ↓
Load expense
 ↓
Verify group membership
 ↓
Verify edit permission
 ↓
Validate input
 ↓
Recalculate payments/shares
 ↓
Transaction
 ├── Update expense
 ├── Replace/update payments
 ├── Replace/update shares
 └── ActivityEvent
 ↓
Success
```

Historical activity must remain auditable.

---

# 37. Expense Delete Flow

Deletion must respect authorization.

Where historical preservation is required, prefer soft deletion.

Conceptually:

```text
deletedAt = timestamp
```

rather than physically removing the record.

The exact behavior should follow the product rules in the build plan.

---

# 38. Balance Calculation

For each member:

```text
net =
totalPaid
-
totalOwed
+
settlementAdjustments
```

Interpretation:

```text
net > 0
→ Member is owed money

net < 0
→ Member owes money

net = 0
→ Settled
```

For each group/currency:

```text
SUM(all member net balances) === 0
```

This invariant must be tested.

---

# 39. Balance Data Flow

```text
Expenses
   ↓
ExpensePayment
ExpenseShare
   ↓
Raw balances
   ↓
Settlements
   ↓
Adjusted balances
   ↓
Debt simplification
   ↓
Suggested transfers
```

Never derive financial truth from UI state.

---

# 40. Debt Simplification

Debt simplification is a presentation/optimization layer over raw balances.

It must never rewrite:

* Expenses
* Expense payments
* Expense shares
* Historical settlements

Algorithm:

```text
Raw balances
      ↓
Separate positive and negative balances
      ↓
Sort deterministically
      ↓
Match debtor with creditor
      ↓
Transfer min(debt, credit)
      ↓
Reduce outstanding amounts
      ↓
Continue
```

Output:

```text
payer
payee
amountMinor
currency
```

The output must be deterministic.

---

# 41. Settlement Flow

```text
Authenticated payer selects suggested debt
        ↓
Settlement form
        ↓
React Hook Form
        ↓
Client Zod validation
        ↓
Server request
        ↓
Authenticate
        ↓
Verify membership
        ↓
Use authenticated user as payer
Verify payee
        ↓
Server-side validation
        ↓
Prisma transaction
        ├── Pending Settlement
        └── ActivityEvent
        ↓
Recipient confirms settlement
        ↓
Prisma transaction
        ├── Confirm Settlement
        └── ActivityEvent
        ↓
Recalculate balance from confirmed settlements
        ↓
Update UI
```

A confirmed settlement is an additional ledger event. A pending settlement is
an auditable request but is excluded from balance calculations.

It does not modify expenses.

---

# 42. Activity Flow

Financially relevant mutations should produce activity events.

Example:

```text
Create expense
        ↓
Expense created
        ↓
ActivityEvent(EXPENSE_CREATED)
```

Example:

```text
Create settlement
        ↓
Settlement created
        ↓
ActivityEvent(SETTLEMENT_CREATED)
```

Activity is informational/auditable.

It is not the source of financial truth.

---

# 43. Forms Architecture

Interactive forms use:

```text
React Hook Form
+
Zod
```

Example:

```text
Form UI
 ↓
useForm()
 ↓
Zod resolver
 ↓
Server Action
 ↓
Server-side Zod parse
 ↓
Authorization
 ↓
Domain logic
 ↓
Prisma
```

The same business constraints must be enforced server-side even if the client validates them.

---

# 44. Validation Layers

There are three conceptual validation levels.

## UI validation

Purpose:

* Fast feedback
* Better UX

Technology:

```text
React Hook Form + Zod
```

---

## Server validation

Purpose:

* Security
* Correctness

Technology:

```text
Zod
```

---

## Database constraints

Purpose:

* Final data integrity

Examples:

* Foreign keys
* Unique constraints
* Not-null constraints
* Check constraints where practical

No single validation layer is sufficient by itself.

---

# 45. UI Architecture

The UI uses reusable design-system components.

Typical components:

```text
Button
Input
Textarea
Select
Checkbox
RadioGroup
FormField
Card
Dialog
Dropdown
Badge
Toast
Skeleton
EmptyState
ErrorState
```

Feature components compose these primitives.

Do not create a new button/input style for every screen.

---

# 46. Design System

The existing Splitly UI is authoritative.

Preserve:

* Existing font family
* Typography scale
* Color tokens
* Green accent
* Spacing
* Border radius
* Shadows
* Button styles
* Form styles
* Card styles
* Navigation
* Responsive behavior

When a new UI element is required:

```text
Existing component?
      ↓
Yes → reuse it
      ↓
No
      ↓
Extend design-system component
```

Avoid isolated CSS implementations.

---

# 47. Financial UI

Money displays should have consistent formatting.

Examples:

```text
₹2,400
₹800
₹0
```

Use dedicated reusable money/balance display components where appropriate.

Financial state should be understandable without color.

Example:

```text
You owe ₹800
Alex owes you ₹1,200
Settled
```

not merely:

```text
[red]
[green]
[gray]
```

---

# 48. Responsive Architecture

The application is mobile-first.

Desktop layouts should enhance the mobile experience rather than being a separate application.

Critical workflows must work on:

```text
Mobile
Tablet
Desktop
```

Particular attention should be given to:

* Add Expense
* Split selection
* Member selection
* Balance display
* Settle Up
* Expense details

---

# 49. Loading and Error Architecture

Data-driven screens should explicitly support:

```text
Loading
Empty
Error
Unauthorized
Success
```

Use Next.js loading/error conventions where appropriate.

Do not expose internal database errors to users.

---

# 50. Testing Architecture

## Jest

Use Jest for deterministic logic.

Primary targets:

```text
Split calculations
Balance calculations
Debt simplification
Validation
Authorization
Service logic
Financial invariants
```

---

## Playwright

Use Playwright for essential user journeys.

Primary flows:

```text
Authentication
Group creation
Member invitation
Expense creation
Expense viewing
Balance viewing
Settlement
Authorization failures
```

Include mobile viewport coverage for important workflows.

---

# 51. Financial Test Strategy

Every financial algorithm should have:

### Normal cases

```text
Equal split
Exact split
Percentage split
Shares split
```

### Edge cases

```text
1 participant
2 participants
Many participants
Odd amounts
Small amounts
Rounding
Zero
Invalid negative values
Invalid totals
```

### Invariants

```text
sum(shares) === total
sum(payments) === total
sum(balances) === 0
```

### Regression cases

Every discovered financial bug should become a permanent automated test.

---

# 52. Integration Test Strategy

Integration tests should verify:

```text
Authentication
Authorization
Database operations
Prisma transactions
Validation
Financial persistence
Activity events
```

Especially test transaction failure.

Example:

```text
Expense creation
 ↓
Expense created
 ↓
Share creation fails
 ↓
Entire transaction rolls back
```

There must not be an orphaned expense.

---

# 53. End-to-End Critical Path

The primary E2E flow is:

```text
Sign up
   ↓
Create group
   ↓
Invite member
   ↓
Member accepts
   ↓
Add expense
   ↓
View balances
   ↓
Settle up
   ↓
Verify balances
   ↓
Review activity
```

This is the minimum business-critical workflow.

---

# 54. Security Architecture

Never trust:

```text
Client user ID
Client group role
Client group membership
Client total
Client currency
Client split calculation
Client authorization
```

Server must independently verify all security-sensitive information.

---

# 55. Secret Management

Secrets must exist only in environment configuration.

Examples:

```text
DATABASE_URL
DIRECT_URL
Supabase server credentials
OAuth credentials
Other private API keys
```

Never expose them through:

```text
NEXT_PUBLIC_*
```

Never commit:

```text
.env
.env.local
production credentials
```

`.env.example` contains placeholders only.

---

# 56. Vercel Architecture

Vercel hosts the Next.js application.

```text
GitHub
   ↓
Vercel
   ↓
Next.js
   ↓
Prisma
   ↓
Supabase PostgreSQL
```

Vercel environments:

```text
Development
Preview
Production
```

Production secrets must be configured in Vercel.

---

# 57. CI/CD Architecture

GitHub Actions handles CI.

Vercel handles deployment.

CI pipeline:

```text
Push / Pull Request
        ↓
Install dependencies
        ↓
Lint
        ↓
Typecheck
        ↓
Jest
        ↓
Build
        ↓
Optional Playwright
```

Deployment should not bypass CI quality checks.

---

# 58. Database Deployment

Database migrations must be handled separately from ordinary application runtime requests.

Conceptually:

```text
Code change
   ↓
Prisma schema change
   ↓
Prisma migration
   ↓
Migration deployment
   ↓
Application deployment
```

Use `DIRECT_URL` for migration operations.

Use `DATABASE_URL` for runtime application access.

Do not run schema mutations from application request handlers.

---

# 59. Observability

The system should eventually include:

* Application error monitoring
* Health endpoint
* Database health monitoring
* Deployment monitoring

Logs must not contain:

* Passwords
* Tokens
* Database credentials
* Service-role keys
* Sensitive personal information unnecessarily

---

# 60. Health Check

Provide a lightweight health endpoint.

Purpose:

* Verify application availability
* Verify required runtime dependencies
* Support deployment checks

Do not expose sensitive database information.

A health response should not contain:

```text
DATABASE_URL
Database credentials
Connection strings
Secrets
```

---

# 61. Performance Principles

Optimize only after correctness.

Priorities:

1. Avoid unnecessary database queries.
2. Avoid unnecessary client-side JavaScript.
3. Use Server Components where appropriate.
4. Keep client components focused.
5. Paginate large expense/activity lists.
6. Avoid loading unrelated group data.
7. Use appropriate database indexes.

Do not introduce caching that can make financial information stale unless the consistency model is explicitly understood.

---

# 62. Database Indexing

Index fields frequently used for:

* Group lookup
* Membership lookup
* Expense lookup
* Expense date sorting
* Activity lookup
* Settlement lookup
* Invitation lookup

Likely index candidates include:

```text
GroupMember(groupId)
GroupMember(userId)
Expense(groupId, date)
ExpensePayment(expenseId)
ExpenseShare(expenseId)
Settlement(groupId, date)
ActivityEvent(groupId, createdAt)
Invite(groupId)
Invite(email)
```

Exact indexes should follow observed query patterns and Prisma schema requirements.

Do not add indexes blindly.

---

# 63. Data Integrity

Use database constraints wherever practical.

Examples:

```text
Foreign keys
Unique constraints
Not-null constraints
```

Business invariants that span multiple rows should additionally be enforced in application transactions.

---

# 64. Deletion and Historical Data

Financial history should be treated as durable.

Avoid destructive deletion when it would make historical balances or activity impossible to explain.

Prefer:

```text
Archive
Soft delete
Audit event
```

where appropriate.

The exact behavior depends on the entity.

---

# 65. Receipt Storage

Receipt support is a later stage.

Architecture:

```text
Browser
   ↓
Authenticated server operation
   ↓
Validate MIME
   ↓
Validate file size
   ↓
Private Supabase Storage
   ↓
Attachment metadata in PostgreSQL
   ↓
Signed URL
```

Do not expose receipt objects publicly.

---

# 66. Notification Architecture

Reminders are a later-stage feature.

The initial implementation should remain simple.

Conceptual flow:

```text
Scheduled job
   ↓
Find eligible users
   ↓
Check outstanding balances
   ↓
Check notification preferences
   ↓
Send notification
   ↓
Record delivery
```

Do not build a full notification platform for the MVP.

---

# 67. CSV Export

CSV export is generated from authorized server-side data.

Flow:

```text
User request
 ↓
Authenticate
 ↓
Authorize group access
 ↓
Apply filters
 ↓
Fetch data
 ↓
Generate CSV
 ↓
Return file
```

Never allow arbitrary database queries from export parameters.

---

# 68. Error Boundaries

Errors should be categorized as:

```text
Validation error
Authorization error
Not found
Conflict
Business-rule violation
Unexpected server error
```

Expected errors should be converted into safe user-facing messages.

Unexpected errors should be logged appropriately without exposing internal details.

---

# 69. Concurrency

Financial writes must account for concurrent operations.

Examples:

```text
Two users editing the same expense
Two settlements created simultaneously
Member removed while expense is being created
```

Use appropriate database transactions and constraints.

Do not assume requests execute sequentially.

---

# 70. Idempotency

Where repeated requests could create duplicate financial records, consider idempotency.

Particularly important for:

* Settlement creation
* Invitation acceptance
* External notification delivery
* Future payment integrations

Do not implement unnecessary idempotency infrastructure for simple read operations.

---

# 71. No Payment Processing in MVP

Splitly does not move real money.

Settlement represents:

```text
User A says they paid User B
```

It does not mean:

```text
Splitly transferred money
```

Actual payment integrations are future work.

---

# 72. Multi-Currency Boundary

The MVP supports storing a currency per financial context.

It does not automatically convert:

```text
INR → USD
USD → EUR
```

Do not calculate combined balances across currencies without an explicit conversion model.

Currency conversion is a separate future feature.

---

# 73. Architecture Decision Summary

| Decision                 | Choice                         |
| ------------------------ | ------------------------------ |
| Frontend                 | Next.js App Router             |
| Language                 | TypeScript                     |
| Styling                  | Tailwind CSS                   |
| UI system                | Existing Splitly design system |
| Forms                    | React Hook Form                |
| Validation               | Zod                            |
| Authentication           | Supabase Authentication       |
| Database                 | Supabase PostgreSQL            |
| ORM                      | Prisma                         |
| Runtime DB connection    | `DATABASE_URL`                 |
| Migration DB connection  | `DIRECT_URL`                   |
| Unit/integration testing | Jest                           |
| E2E testing              | Playwright                     |
| CI                       | GitHub Actions                 |
| Deployment               | Vercel                         |
| Money representation     | Integer minor units            |
| Expense source of truth  | `ExpenseShare`                 |
| Financial writes         | Prisma transactions            |
| Real payment transfers   | Not in MVP                     |
| Receipt storage          | Later stage                    |
| Currency conversion      | Not in MVP                     |

---

# 74. Architecture Rules for Future Changes

When introducing a new feature, determine:

1. Does it introduce new domain data?
2. Does it require a Prisma schema change?
3. Does it require a migration?
4. Does it require authorization?
5. Does it change a financial invariant?
6. Does it require a transaction?
7. Does it require activity/audit data?
8. Does it require new validation?
9. Does it require Jest tests?
10. Does it require Playwright coverage?
11. Does it fit the current build-plan stage?
12. Does it preserve the existing Splitly design system?

If the answer to any of these is yes, implement the corresponding architecture rather than bypassing it.

---

# 75. Change Process

For a typical feature:

```text
Read BUILD_PLAN
      ↓
Read relevant system-design section
      ↓
Inspect existing implementation
      ↓
Design data changes
      ↓
Update Prisma schema
      ↓
Create migration
      ↓
Implement domain logic
      ↓
Add tests
      ↓
Implement server operation
      ↓
Implement UI using existing design system
      ↓
Add E2E coverage where required
      ↓
Run verification
      ↓
Update BUILD_PLAN
```

---

# 76. Definition of Architectural Correctness

A feature is architecturally correct when:

* Business rules are enforced server-side.
* Financial calculations are deterministic.
* Financial writes are transactional.
* Prisma represents database changes.
* Authorization is enforced.
* Validation exists at the server boundary.
* Relevant activity is recorded.
* Tests cover important business rules.
* Existing UI components/design tokens are reused.
* No secrets are exposed.
* The implementation fits the current build stage.

---

# 77. Current Architecture State

```text
Next.js
    │
    ├── App Router
    ├── Server Components
    ├── Client Components
    └── Server Actions / Route Handlers
              │
              ▼
       Application Services
              │
              ▼
          Domain Logic
              │
              ▼
           Prisma ORM
              │
       ┌──────┴──────┐
       ▼             ▼
DATABASE_URL    DIRECT_URL
       │             │
       ▼             ▼
 Supabase PG    Supabase PG
  Runtime       Migrations
```

---

# 78. Current Implementation Priority

The architecture currently supports:

```text
Foundation
    ↓
Authentication
    ↓
Groups
    ↓
Group membership
```

The next major domain capability is:

```text
Expense Ledger
```

which introduces:

```text
Expense
ExpensePayment
ExpenseShare
ActivityEvent
Split Engine
```

After that:

```text
Balances
    ↓
Debt Simplification
    ↓
Settlements
```

Then:

```text
Activity
Receipts
Reminders
Exports
Polish
Release Hardening
```

The exact implementation order is controlled by:

```text
docs/BUILD_PLAN.md
```

---

# 79. Final Principle

Splitly should remain a simple system with strong financial correctness.

Prefer:

```text
Simple architecture
+
Strong domain rules
+
Transactional writes
+
Explicit authorization
+
Reusable UI
+
Automated tests
```

over:

```text
Complex infrastructure
+
Premature abstractions
+
Duplicated logic
+
Client-side financial calculations
+
Unnecessary services
```

The system should be easy for another developer or coding agent to understand, modify, test, and deploy safely.

# UI/UX and Mobile-First Design Addendum

## Purpose

This section defines the architectural boundaries and design principles for the current **UI/UX improvement phase** of Splitly.

The objective of this phase is to improve the application's visual design, usability, responsiveness, accessibility, and mobile experience **without changing existing application functionality**.

The existing backend architecture, data model, business rules, financial calculations, authentication, authorization, APIs, and workflows remain the source of truth.

---

## 1. UI/UX-Only Phase Boundary

During this phase, the following are considered **frozen**:

* Database schema and migrations
* Prisma models
* Database relationships
* Server actions
* API contracts
* Business logic
* Expense calculations
* Split calculations
* Balance calculations
* Settlement calculations
* Financial data behavior
* Authentication behavior
* Authorization rules
* User roles and permissions
* Existing validation rules
* Existing application workflows
* Existing product capabilities

UI/UX implementation must not introduce changes to these areas.

### Allowed Changes

Changes are allowed when they improve:

* Layout
* Responsive behavior
* Mobile usability
* Visual hierarchy
* Typography
* Spacing
* Component styling
* Navigation presentation
* Form presentation
* Modal and dialog presentation
* Toast presentation
* Loading states
* Empty states
* Error states
* Accessibility
* Touch interaction
* Component consistency
* Responsive desktop/tablet presentation

### Functional Preservation Rule

Every UI change must preserve the existing behavior of the feature.

A useful rule is:

> **Change how the feature looks or feels, not what the feature does.**

If a proposed UI improvement requires changing business logic or existing functionality, it is outside the scope of this phase.

---

## 2. Presentation and Business Logic Separation

The UI layer should remain responsible for:

* Rendering data
* Collecting user input
* Presenting validation errors
* Presenting loading states
* Presenting success and failure feedback
* Managing visual state
* Managing responsive layouts
* Managing UI-only interaction state
* Providing accessible interaction

The UI layer must not duplicate or redefine business rules.

Business decisions such as:

* Who can perform an action
* How an expense is split
* How balances are calculated
* How settlements affect balances
* What financial values are stored
* What data is persisted

must continue to be handled by the existing application/business layer.

UI code may conditionally display existing states or actions based on existing authorization and application responses, but must not establish a new authorization model.

---

## 3. Mobile-First Responsive Architecture

Splitly's UI should use a **mobile-first responsive approach**.

The base layout should be designed for small screens first and progressively enhanced for larger viewports.

The responsive progression is:

```text
Mobile
  ↓
Large Mobile
  ↓
Tablet
  ↓
Desktop
  ↓
Large Desktop
```

Desktop layouts must not be treated as the primary layout that is simply compressed to fit mobile screens.

Instead:

> **Mobile is the foundation; larger screens progressively enhance the experience.**

---

## 4. Responsive Layout Principles

Responsive layouts should prioritize:

* Single-column layouts on narrow screens where appropriate
* Clear content hierarchy
* Comfortable spacing
* Readable typography
* Touch-friendly controls
* Appropriate content density
* Minimal unnecessary horizontal scrolling
* Accessible interactive elements
* Clear primary actions

Larger screens may progressively introduce:

* Multi-column layouts
* Additional navigation space
* Wider content containers
* Side-by-side panels
* More efficient use of horizontal space
* Greater information density

Responsive behavior must not remove access to existing functionality.

---

## 5. Mobile Navigation

Navigation should be designed around the most important existing Splitly workflows.

Mobile navigation should:

* Be easy to reach
* Use sufficiently large touch targets
* Clearly communicate the current location
* Avoid unnecessary navigation complexity
* Preserve access to all existing destinations
* Avoid squeezing desktop navigation into a mobile viewport

Desktop navigation may use the additional available space but must preserve the same underlying destinations and workflows.

Navigation changes in this phase are presentation changes only.

---

## 6. Mobile Forms

Existing forms should be optimized for mobile interaction.

Form layouts should prioritize:

* Clear labels
* Logical field order
* Adequate input size
* Comfortable spacing
* Easy touch interaction
* Readable validation messages
* Clear primary actions
* Appropriate loading/disabled states
* Keyboard-friendly interaction

Form presentation may be changed substantially when necessary for usability.

However, the following must remain unchanged:

* Submitted data
* Validation rules
* Server actions
* API contracts
* Business rules
* Persistence behavior

---

## 7. Modal and Dialog Architecture

Existing modals and dialogs should adapt to viewport size.

On mobile, dialogs may use:

* Near-full-width layouts
* Bottom sheets
* Full-screen presentation where appropriate
* Larger touch targets
* Better vertical scrolling behavior

On larger screens, dialogs may use conventional centered modal layouts where appropriate.

### Form Submission Rule

When an existing form is displayed inside a modal or dialog:

1. The modal remains open while the request is pending.
2. If the request fails, the modal remains open.
3. Existing user-entered values should be preserved after a failed request.
4. The existing error should be presented clearly.
5. After a successful response, the existing success behavior should be presented.
6. Only after successful completion should the UI reset or close according to the existing workflow.

This is a UI interaction rule and must not require changes to the underlying business logic.

---

## 8. Toasts and User Feedback

Existing success and error feedback should use a consistent visual presentation.

Toasts should be:

* Short
* Clear
* Accessible
* Mobile-friendly
* Easy to notice without being disruptive
* Consistent across the application

The UI should not invent business outcomes.

A toast should represent an outcome that actually occurred in the existing application flow.

---

## 9. Loading, Empty, Error, and Unauthorized States

The UI should explicitly and consistently represent existing application states.

### Loading

Use appropriate visual indicators such as:

* Skeletons
* Spinners
* Disabled controls
* Progress indicators

### Empty

Empty states should communicate:

* What is currently empty
* Why the user may be seeing the state when useful
* What existing action the user can take next

### Error

Error states should:

* Clearly communicate failure
* Avoid technical language where possible
* Preserve user input when appropriate
* Provide an appropriate existing recovery action

### Unauthorized

Unauthorized states should clearly communicate that the user cannot perform the requested existing action.

Authorization rules themselves must not be changed.

---

## 10. Dense Data on Mobile

Expense lists, activity, members, balances, and other information-dense views should not simply shrink desktop tables onto small screens.

Where appropriate, the UI may use:

* Stacked rows
* Cards
* Compact list items
* Responsive columns
* Expandable presentation
* Alternative mobile layouts

The underlying information must remain available.

Responsive design must not silently remove important existing information or functionality.

---

## 11. Touch Interaction

Interactive controls should be designed for touch-first use.

Prioritize:

* Comfortable tap targets
* Adequate spacing between controls
* Clear pressed/active states
* Avoidance of accidental destructive actions
* Accessible focus states
* Easy one-handed interaction where practical

Small icons should not be the only way to perform an important action when a larger accessible interaction is appropriate.

---

## 12. Accessibility

UI/UX improvements should strengthen accessibility without changing application behavior.

The presentation layer should consider:

* Semantic HTML
* Keyboard navigation
* Visible focus states
* Proper form labels
* Accessible validation messages
* Dialog focus management
* Screen-reader-friendly state changes
* Color contrast
* Touch target sizing
* Reduced-motion preferences where animations exist

Accessibility improvements must remain compatible with the existing workflows.

---

## 13. Shared UI Components

Shared UI components should be preferred over repeated page-specific implementations.

Where shared components already exist, improve the shared component rather than creating multiple competing versions.

Common reusable UI patterns include:

* Buttons
* Inputs
* Selects
* Cards
* Dialogs
* Toasts
* Form fields
* Navigation
* Loading indicators
* Empty states
* Error states
* Confirmation UI

Visual consistency should be maintained across the application.

---

## 14. Design-System Consistency

The UI should maintain consistent:

* Typography
* Spacing
* Border radius
* Component sizing
* Icons
* Buttons
* Form controls
* Colors
* Shadows
* States
* Breakpoints
* Responsive behavior

Existing design tokens and shared styles should be reused where possible.

New visual values should not be introduced unnecessarily when an existing design token already represents the intended value.

---

## 15. Progressive Desktop Enhancement

Desktop improvements should enhance the mobile foundation rather than create an unrelated desktop experience.

Examples include:

* Expanding content containers
* Introducing multi-column layouts
* Using additional horizontal space
* Providing richer navigation presentation
* Increasing information density where appropriate
* Displaying related content side by side

The underlying workflow must remain the same across viewport sizes.

---

## 16. UI State Management

UI-only state may be introduced when necessary for presentation and interaction.

Examples include:

* Modal open/closed state
* Mobile navigation open/closed state
* Expanded/collapsed sections
* Loading presentation state
* Toast visibility
* Responsive presentation state

UI state must not replace or duplicate authoritative application state.

Server responses and existing business logic remain authoritative for application outcomes.

---

## 17. Performance Considerations

UI improvements should not unnecessarily degrade application performance.

Prefer:

* Existing shared components
* Lightweight UI patterns
* Efficient rendering
* Appropriate responsive images
* Minimal unnecessary client-side state
* Minimal unnecessary JavaScript
* Existing framework capabilities

Do not introduce large dependencies solely for visual effects when the existing stack can provide the required UI.

Animations should be purposeful and restrained.

---

## 18. Existing Functionality Verification

After UI/UX implementation, verify that existing functionality remains unchanged.

At minimum, review:

* Authentication
* Navigation
* Group workflows
* Expense creation
* Expense editing
* Expense deletion
* Split configuration
* Balance presentation
* Settlement workflows
* Existing permissions
* Existing validation
* Existing success/error behavior

The purpose of this verification is **regression detection**, not functional redesign.

If a UI change causes existing functionality to fail, fix the UI implementation rather than changing the underlying business behavior.

---

## 19. Testing and Review Boundary

Testing and review for this UI/UX phase should occur **after implementation**.

The implementation phase should focus on UI/UX changes.

The review phase should verify:

1. UI correctness
2. Responsive behavior
3. Mobile usability
4. Accessibility
5. Existing workflow preservation
6. Existing functionality preservation
7. Existing tests/build health

Existing automated tests should remain valid.

Tests should not be weakened or removed simply because the UI has changed.

---

## 20. Architecture Principle for This Phase

The current phase follows this architectural principle:

```text
Existing Business Logic
        ↓
Existing Server/API/Data Layer
        ↓
Existing Application State
        ↓
Improved UI Presentation
        ↓
Improved User Experience
```

The UI/UX work should primarily affect the final two layers.

The existing business and data layers remain stable.

---

## 21. Definition of Done

The UI/UX architecture is considered successfully implemented when:

* Mobile is the primary responsive foundation.
* Major screens work comfortably on small screens.
* Tablet layouts are appropriately enhanced.
* Desktop layouts are polished.
* Navigation is clear and responsive.
* Forms are easier to use.
* Modals and dialogs behave correctly across viewport sizes.
* Toasts and feedback are visually consistent.
* Loading, empty, error, and unauthorized states are clear.
* Touch interaction is comfortable.
* Accessibility is improved.
* Shared UI components are consistent.
* Existing workflows remain intact.
* Existing business logic remains unchanged.
* Existing calculations remain unchanged.
* Existing permissions remain unchanged.
* Existing data behavior remains unchanged.
* Existing functionality remains unchanged.

---

## 22. Final Constraint

**This section does not authorize functional changes.**

If a proposed improvement affects:

* What data is stored
* How data is calculated
* Who can perform an action
* How permissions work
* How authentication works
* How balances are calculated
* How expenses are split
* How settlements work
* How the backend behaves
* What an existing feature does

then it is **outside the scope of the current UI/UX phase**.

The correct approach is:

> **Preserve the existing system. Improve the interface. Improve the experience. Verify that functionality remains unchanged.**
