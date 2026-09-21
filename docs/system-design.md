# Splitly — System Design

## 1. Purpose

This document defines the high-level technical architecture for Splitly.

Splitly is a mobile-first shared-expense application built around a financial transaction ledger.

The system must prioritize:

1. financial correctness
2. authorization
3. auditability
4. mobile usability
5. maintainability
6. reasonable performance

The initial architecture should remain intentionally simple.

---

# 2. Architectural Style

Splitly is a modular monolith.

```text
┌───────────────────────────────────────┐
│               Client                  │
│                                       │
│ React                                 │
│ Next.js                               │
│ Tailwind                              │
│ Mobile / Tablet / Desktop             │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│           Next.js Application         │
│                                       │
│ Server Components                     │
│ Server Actions                        │
│ Route Handlers                        │
│ Domain Services                       │
│ Validation                            │
│ Authorization                         │
└───────────────────┬───────────────────┘
                    │
                    ▼
┌───────────────────────────────────────┐
│               Supabase                │
│                                       │
│ PostgreSQL                            │
│ Authentication                        │
│ Row Level Security                    │
│ Storage                               │
│ Realtime where useful                 │
└───────────────────────────────────────┘
```

Deployment:

```text
Next.js → Vercel
Database/Auth/Storage → Supabase
```

No microservices are required initially.

---

# 3. Main Architectural Principles

## 3.1 Ledger-based financial model

Expenses and settlements are the source of truth.

Balances are derived.

Do not treat a mutable balance record as the accounting source.

---

## 3.2 Separate payer and participant concepts

For an expense:

```text
payer = person who funded money

participant = person responsible for a share
```

They may overlap but are not equivalent.

---

## 3.3 Authorization belongs close to the data

Supabase RLS protects data independently of UI behavior.

Frontend visibility is not sufficient authorization.

---

## 3.4 Mobile-first UI

The smallest supported screens determine the default component layout.

Desktop layouts progressively enhance the mobile experience.

---

## 3.5 Server-controlled mutations

Sensitive financial mutations should be validated through trusted application logic.

Clients should not directly perform unrestricted complex mutations.

---

# 4. Major Domains

Splitly consists of the following bounded feature domains:

```text
Authentication
Profiles
Friends
Groups
Expenses
Balances
Settlements
Activities
Comments
Categories
Recurring Expenses
Notifications
Reporting
Storage
```

Each domain should expose clear operations rather than allowing arbitrary cross-feature database access everywhere.

---

# 5. Suggested Source Structure

```text
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   │
│   ├── (app)/
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── activity/
│   │   ├── friends/
│   │   ├── groups/
│   │   ├── expenses/
│   │   └── settings/
│   │
│   └── api/
│
├── components/
│   ├── ui/
│   └── layout/
│
├── features/
│   ├── auth/
│   ├── profiles/
│   ├── friends/
│   ├── groups/
│   ├── expenses/
│   ├── balances/
│   ├── settlements/
│   ├── activity/
│   ├── comments/
│   ├── recurring/
│   └── notifications/
│
├── lib/
│   ├── supabase/
│   ├── validation/
│   ├── money/
│   └── permissions/
│
├── types/
└── utils/
```

---

# 6. Database Overview

Core entities:

```text
profiles
friendships

groups
group_members
group_invitations

expenses
expense_payers
expense_participants

settlements

expense_categories
expense_comments
activity_events

recurring_expenses

notifications

expense_attachments
```

---

# 7. Relationship Overview

```text
auth.users
    │
    ▼
profiles
    │
    ├──────── friendships
    │
    ├──────── group_members ─────── groups
    │                                  │
    │                                  ▼
    │                              expenses
    │                                  │
    │                       ┌──────────┴──────────┐
    │                       ▼                     ▼
    │                expense_payers       expense_participants
    │
    ├──────── settlements
    │
    ├──────── expense_comments
    │
    ├──────── activity_events
    │
    └──────── notifications
```

---

# 8. Profiles

Authentication identity comes from:

```text
auth.users
```

Application profile information lives separately.

Suggested model:

```text
profiles
--------
id UUID PK
display_name
avatar_url
default_currency
locale
timezone
created_at
updated_at
```

`profiles.id` should reference `auth.users.id`.

Do not store passwords in `profiles`.

---

# 9. Friendships

Conceptual model:

```text
friendships
-----------
id
requester_id
addressee_id
status
created_at
updated_at
```

Possible states:

```text
pending
accepted
declined
```

Prevent duplicate relationships.

Normalize relationship checks so:

```text
A-B
```

and:

```text
B-A
```

do not create duplicate friendships.

---

# 10. Groups

Suggested model:

```text
groups
------
id
name
type
image_url
default_currency
simplify_debts
created_by
created_at
updated_at
archived_at
```

Membership:

```text
group_members
-------------
group_id
user_id
role
joined_at
```

Possible roles:

```text
owner
member
```

Additional roles can be added later only if needed.

---

# 11. Expenses

Expenses represent shared financial events.

Suggested:

```text
expenses
--------
id
group_id nullable
description
amount_minor
currency
category_id nullable
expense_date
notes nullable
created_by
created_at
updated_at
deleted_at nullable
```

Using a soft-delete strategy may make audit/history easier.

If hard deletion is used, activity history should still preserve useful metadata.

---

# 12. Expense Payers

```text
expense_payers
--------------
id
expense_id
user_id
amount_paid_minor
created_at
```

Constraint:

```text
SUM(amount_paid_minor)
=
expenses.amount_minor
```

This may require application-level transactional validation because PostgreSQL CHECK constraints cannot directly aggregate child records.

---

# 13. Expense Participants

```text
expense_participants
--------------------
id
expense_id
user_id
amount_owed_minor
split_method
split_metadata JSONB
created_at
```

Examples of `split_metadata`:

Equal:

```json
{
  "method": "equal"
}
```

Percentage:

```json
{
  "method": "percentage",
  "percentage": "25"
}
```

Shares:

```json
{
  "method": "shares",
  "shares": "2"
}
```

Do not make UI behavior depend entirely on arbitrary JSON.

Core calculated values must remain explicit fields.

---

# 14. Money Representation

Preferred application representation:

```text
integer minor units
```

Example:

```text
₹100.50
→
10050
```

Advantages:

- deterministic arithmetic
- avoids floating-point errors
- straightforward equality checks

Currency metadata determines decimal precision.

For most initial currencies:

```text
2 decimal places
```

Currency helpers should centralize formatting.

---

# 15. Expense Creation Transaction

Creating an expense should be atomic.

Logical sequence:

```text
BEGIN

insert expense

insert expense payer records

insert expense participant records

insert activity event

COMMIT
```

If any step fails:

```text
ROLLBACK
```

Do not leave partially created expenses.

---

# 16. Expense Update Transaction

Updating an expense should similarly be atomic.

Conceptually:

```text
BEGIN

validate authorization

update expense

replace or update payer records

replace or update participant records

write activity event

COMMIT
```

Financial totals must reconcile before commit.

---

# 17. Equal Split Algorithm

Inputs:

```text
amount
participants[]
```

Example:

```text
amount = 10000 minor units
participants = 3
```

Base:

```text
floor(10000 / 3)
=
3333
```

Remainder:

```text
1
```

Result:

```text
3334
3333
3333
```

Participant ordering for remainder distribution must be deterministic.

---

# 18. Balance Calculation

For user `U`:

```text
expense_position(U)
=
SUM(amount U paid)
-
SUM(amount U owes)
```

Then incorporate settlement flows.

For a settlement:

```text
A pays B ₹500
```

Financial effect:

```text
A position += ₹500
B position -= ₹500
```

relative to debt obligations.

Alternatively model settlement signs consistently inside the balance query/service.

The implementation must be tested carefully because sign confusion is a common accounting bug.

---

# 19. Pairwise Balances

Net user position is enough to understand overall group standing.

However, "who owes whom" may require:

- original debt graph
- simplified debt graph

These should not be conflated.

Splitly may display:

```text
you owe Rahul ₹500
```

while group-level simplified debt may produce different settlement paths.

---

# 20. Debt Simplification

Input:

```text
user → net balance
```

Partition users into:

```text
creditors: positive
debtors: negative
```

Example:

```text
A = -1000
B = +400
C = +600
```

Generate:

```text
A → B 400
A → C 600
```

Algorithm:

```text
while debtors exist and creditors exist:

    choose debtor
    choose creditor

    transfer =
        min(abs(debtor.balance), creditor.balance)

    record transfer

    update debtor balance
    update creditor balance
```

The resulting transfer count should be reasonably minimized.

Perfect optimization is not required if a simple deterministic algorithm produces correct results.

Correctness is more important than absolute theoretical minimum transfer count.

---

# 21. Settlements

Suggested schema:

```text
settlements
-----------
id
group_id nullable
payer_user_id
recipient_user_id
amount_minor
currency
payment_method
settlement_date
note
created_by
created_at
```

Settlement records are immutable financial events where practical.

Corrections should preferably create explicit history rather than silently rewriting prior financial actions.

---

# 22. Activities

Suggested:

```text
activity_events
---------------
id
actor_user_id
group_id nullable
entity_type
entity_id
action
metadata JSONB
created_at
```

Examples:

```text
expense_created
expense_updated
expense_deleted
settlement_created
member_added
```

Metadata can preserve user-facing descriptions while avoiding schema explosion.

---

# 23. Categories

Categories may initially be system-defined.

Suggested:

```text
expense_categories
------------------
id
name
parent_id nullable
icon
sort_order
is_active
```

Allow hierarchy:

```text
Food
  ├── Groceries
  ├── Dining
  └── Drinks
```

---

# 24. Recurring Expenses

Separate template from generated expense.

Example:

```text
recurring_expenses
------------------
id
creator_id
group_id
template_data
frequency
next_run_at
status
created_at
updated_at
```

The scheduler generates a normal expense.

Generated expenses remain independent historical records.

---

# 25. Recurring Scheduler

Possible implementation paths:

- Vercel Cron
- Supabase scheduled functions
- Supabase cron/pg_cron if appropriate

One solution should be selected and documented before implementation.

Jobs must be idempotent.

Running the scheduler twice must not create duplicate expenses.

---

# 26. Notifications

Suggested:

```text
notifications
-------------
id
user_id
type
actor_user_id nullable
entity_type nullable
entity_id nullable
metadata
read_at
created_at
```

Do not hard-code every notification message permanently into the database.

Store structured data when practical so wording can evolve.

---

# 27. Attachments

Store metadata in PostgreSQL:

```text
expense_attachments
-------------------
id
expense_id
uploaded_by
storage_path
mime_type
file_size
created_at
```

Actual file:

```text
Supabase Storage
```

Storage policies must match expense visibility.

A valid storage URL must not bypass application permissions.

---

# 28. Authentication Architecture

Use Supabase Auth.

Flow:

```text
Browser
   │
   ▼
Supabase Auth
   │
   ▼
authenticated session
   │
   ▼
Next.js server
   │
   ▼
database queries under user identity
```

Protected page logic should validate session server-side.

Do not depend only on client redirects.

---

# 29. Authorization Architecture

Three levels:

```text
UI permissions
server authorization
database RLS
```

All three serve different purposes.

## UI

Avoid showing invalid actions.

## Server

Validate mutation permission.

## RLS

Prevent unauthorized data access even if application code is bypassed.

---

# 30. Example Group Expense RLS

For a user to select a group expense:

```text
user is a member of expense.group_id
```

For a direct expense:

```text
user is involved as payer or participant
```

Policies must avoid recursive queries that cause RLS performance or recursion issues.

Use helper functions only when carefully designed.

---

# 31. Query Strategy

Prefer server-side data fetching for initial page rendering where appropriate.

Use client fetching for:

- dynamic interaction
- incremental updates
- interactive filters
- optimistic UI where justified

Avoid fetching the entire user's financial history for every page.

---

# 32. Dashboard Architecture

Dashboard aggregates:

```text
overall positions by currency
friends with balances
groups with balances
recent activity
```

Do not run dozens of independent client queries if one server-side aggregate query/service can efficiently prepare the page model.

---

# 33. Expense List Architecture

Support pagination from the beginning.

Recommended:

```text
cursor-based pagination
```

or a clean offset approach for initial scale.

Filters may include:

```text
group
person
category
currency
date range
```

Indexes should match real filters.

---

# 34. Recommended Indexes

Likely indexes:

```text
group_members(user_id)
group_members(group_id)

expenses(group_id)
expenses(created_by)
expenses(expense_date)
expenses(category_id)

expense_payers(expense_id)
expense_payers(user_id)

expense_participants(expense_id)
expense_participants(user_id)

settlements(group_id)
settlements(payer_user_id)
settlements(recipient_user_id)
settlements(settlement_date)

activity_events(group_id, created_at)
notifications(user_id, read_at, created_at)
```

Final indexes should follow actual query plans.

---

# 35. Caching

Initial version should avoid complex caching.

Potential later candidates:

- group balance summaries
- dashboard aggregate views
- reporting summaries

Never cache financial data without a clear invalidation strategy.

---

# 36. Realtime

Supabase Realtime may later improve:

- group expense updates
- activity feed
- notifications

Do not make realtime mandatory for financial correctness.

The application must remain correct after refresh even if realtime delivery fails.

---

# 37. Mobile Application Architecture

## Mobile shell

```text
┌───────────────────────────┐
│ Splitly             Avatar│
├───────────────────────────┤
│                           │
│        Main content       │
│                           │
│                           │
├───────────────────────────┤
│ Home Activity + Groups Me │
└───────────────────────────┘
```

Primary Add action opens expense creation.

---

# 38. Desktop Application Architecture

Suggested:

```text
┌────────────┬─────────────────────────┬──────────────┐
│ Sidebar    │ Main Content            │ Context      │
│            │                         │ Panel        │
│ Dashboard  │                         │ optional     │
│ Activity   │                         │              │
│ Friends    │                         │              │
│ Groups     │                         │              │
└────────────┴─────────────────────────┴──────────────┘
```

The third column is optional.

Do not force it onto medium widths where it hurts readability.

---

# 39. Add Expense Mobile Flow

Expense creation is the application's most important workflow.

Design for minimal friction.

Recommended first view:

```text
Description

Amount + Currency

Paid by

Split between

Date

Category

Notes

Save expense
```

Advanced split details should appear only after selecting:

```text
equally
exact
percentage
shares
```

Do not show all split configuration simultaneously.

---

# 40. Modal Strategy

Simple actions:

```text
centered dialog
```

Complex mobile forms:

```text
bottom sheet
```

or:

```text
full-screen mobile sheet
```

Examples that may benefit from larger mobile presentation:

- add expense
- split configuration
- multiple payer configuration
- settle up

---

# 41. Error Architecture

Use explicit typed errors for common situations:

```text
ValidationError
UnauthorizedError
ForbiddenError
NotFoundError
ConflictError
FinancialInvariantError
```

Server errors should map to useful user messages without leaking internal information.

---

# 42. Logging

Server-side logging should include useful operational context:

```text
operation
entity ID
authenticated user ID
error category
```

Do not log:

- passwords
- tokens
- secrets
- complete sensitive request bodies

---

# 43. Financial Invariants

Every financial write must preserve these invariants.

## Expense invariant

```text
sum(payer contributions)
=
expense total
```

## Participant invariant

```text
sum(participant obligations)
=
expense total
```

## Simplification invariant

```text
net user positions before
=
net user positions after
```

## Currency invariant

Financial values of different currencies remain separate unless explicitly converted.

---

# 44. Transaction Boundaries

Use database transactions for operations involving multiple financial rows.

Examples:

- create expense
- edit expense
- delete/void expense
- create settlement
- recurring expense generation

Never accept a state where the expense exists but payer/participant data failed to save.

---

# 45. Concurrency

Potential race conditions include:

- two expense edits
- duplicated recurring jobs
- repeated invite acceptance
- repeated settlement submission
- double-click form submission

Use:

- database constraints
- transaction boundaries
- idempotency where appropriate
- disabled submitting states

---

# 46. Idempotency

Especially important for:

```text
recurring expense generation
payment webhooks later
external integrations later
```

A retry must not create duplicate financial events.

---

# 47. Testing Architecture

## Unit tests

Financial calculations.

## Integration tests

Database/service workflows.

## End-to-end tests

Critical user journeys.

Priority E2E path:

```text
signup
→ create group
→ add users
→ add expense
→ verify balance
→ settle
→ verify balance
```

---

# 48. Security Review Checklist

Before production:

```text
RLS on every private table
service key server-only
input validation
file access validation
rate limiting where appropriate
authorization on mutations
safe redirects
session validation
no secrets shipped to browser
```

---

# 49. Performance Targets

For normal application usage:

- initial navigation should feel responsive
- financial mutations should provide immediate feedback
- expense lists must paginate
- activity lists must paginate
- avoid loading historical records unnecessarily

The initial architecture does not require distributed caching or microservices.

---

# 50. Future Scaling

If Splitly eventually reaches large scale, possible upgrades include:

```text
materialized balance summaries
background workers
queue infrastructure
read replicas
specialized reporting tables
edge caching
event-driven notification processing
```

These are intentionally excluded from the initial architecture.

Do not build them preemptively.

---

# 51. Architectural Non-Goals

Do not initially introduce:

```text
microservices
Kafka
Redis
GraphQL
CQRS
event sourcing
separate NestJS backend
distributed workflow engines
Kubernetes
```

unless real requirements justify them.

---

# 52. Core Architectural Principle

Splitly should be easy to reason about.

Given:

```text
expenses
+
expense payers
+
expense participants
+
settlements
```

the system must always be capable of reconstructing:

```text
who paid
who owed
who currently owes whom
how the balance was produced
```

If an architectural decision makes that difficult, reconsider the decision.