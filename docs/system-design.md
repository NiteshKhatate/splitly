# Splitly — Phase 1 System Design

## 1. Overview

Splitly is a shared-expense management application inspired by the core concept of expense-sharing platforms such as Splitwise.

The application allows users to create groups, record shared expenses, split expenses among group members, calculate balances, and record settlements.

Phase 1 focuses on the core expense-sharing functionality while keeping the architecture simple and scalable.

---

## 2. Goals

### Primary goals

* Allow users to create accounts and authenticate securely.
* Allow users to create expense-sharing groups.
* Allow users to add members to groups.
* Allow users to record expenses.
* Support equal expense splitting.
* Support unequal/fixed-amount expense splitting.
* Track who paid for an expense.
* Calculate how much each member owes or is owed.
* Allow users to record settlements.
* Display expense history.
* Enforce authorization using Supabase Row Level Security (RLS).
* Deploy the application using Vercel.

### Non-goals for Phase 1

The following features are intentionally excluded from Phase 1:

* UPI/payment integration
* Direct money transfers
* WhatsApp integration
* SMS notifications
* Push notifications
* Recurring expenses
* Receipt OCR
* Advanced analytics
* Multi-currency conversion
* Mobile native applications
* Separate backend microservice
* Advanced notification infrastructure

These may be considered in future phases.

---

# 3. Technology Stack

## Frontend

* Next.js
* TypeScript
* Tailwind CSS
* React
* Next.js App Router

## Backend / Data

* Supabase
* Supabase Authentication
* PostgreSQL
* Supabase Row Level Security (RLS)

## Deployment

* Vercel

## Package Manager

* pnpm

---

# 4. Architecture

Phase 1 uses a single Next.js application.

```text
                    ┌──────────────────┐
                    │      User        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │     Vercel       │
                    │    Next.js App   │
                    └────────┬─────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
      ┌────────────────┐          ┌──────────────────┐
      │ Supabase Auth  │          │ Supabase         │
      │                │          │ PostgreSQL + RLS │
      └────────────────┘          └──────────────────┘
```

There is no separate Express.js or NestJS backend in Phase 1.

Next.js server-side functionality and Supabase provide the required backend capabilities.

---

# 5. Architectural Principles

## 5.1 Keep Phase 1 simple

Do not introduce microservices, message queues, Redis, or other infrastructure unless a concrete requirement exists.

## 5.2 Security belongs on the server

The frontend must never be trusted to enforce authorization.

Supabase RLS must enforce access to groups, members, expenses, splits, and settlements.

## 5.3 Never expose privileged credentials

The Supabase service-role key must never be exposed to browser/client-side code.

Only the public/publishable Supabase key may be used by client-side code.

## 5.4 Prefer Server Components

Use Next.js Server Components by default.

Use Client Components only when browser-side interactivity or client state requires them.

## 5.5 Separate UI from business logic

Complex expense and balance calculations should not be embedded directly inside React presentation components.

---

# 6. Database

Supabase PostgreSQL is the primary database.

The following application tables exist:

1. `profiles`
2. `groups`
3. `group_members`
4. `expenses`
5. `expense_splits`
6. `settlements`

Supabase's `auth.users` table is managed by Supabase Authentication and is not an application-created table.

All Phase 1 tables have RLS enabled.

---

# 7. Database Relationships

```text
auth.users
    │
    ▼
profiles
    │
    ├───────────────┐
    │               │
    ▼               ▼
groups       group_members
    │               │
    │               │
    ▼               │
expenses            │
    │               │
    ▼               │
expense_splits ◄────┘


groups
   │
   ▼
settlements
```

## Relationship details

### Profiles → Groups

A user can create multiple groups.

`groups.created_by` references `profiles.id`.

### Profiles ↔ Groups

Users can belong to multiple groups.

`group_members` provides the many-to-many relationship.

### Groups → Expenses

A group can contain multiple expenses.

### Expenses → Expense Splits

Each expense can have multiple split records.

### Groups → Settlements

Settlements belong to a group and represent money paid between members.

---

# 8. Data Model

## profiles

Stores application-level information about authenticated users.

```text
id
full_name
email
avatar_url
created_at
updated_at
```

`id` references `auth.users.id`.

---

## groups

Represents an expense-sharing group.

```text
id
name
description
created_by
currency
created_at
updated_at
```

The default currency is INR.

---

## group_members

Represents membership in a group.

```text
id
group_id
user_id
role
joined_at
```

Roles:

```text
admin
member
```

A user must not appear more than once in the same group.

---

## expenses

Represents an individual expense.

```text
id
group_id
description
amount
paid_by
expense_date
notes
created_by
created_at
updated_at
```

`amount` must be greater than zero.

---

## expense_splits

Represents how an expense is divided.

```text
id
expense_id
user_id
amount
created_at
```

The `amount` represents the exact amount owed by that member for the expense.

Example:

```text
Expense: ₹2400

Rahul    ₹800
Amit     ₹800
Nitesh   ₹800
```

This model supports both equal and unequal splits.

---

## settlements

Represents a payment between two group members.

```text
id
group_id
paid_by
paid_to
amount
settlement_date
notes
created_at
```

Example:

```text
Nitesh → Rahul
₹1000
```

A user cannot settle with themselves.

---

# 9. Expense Model

An expense has:

```text
Total amount
        │
        ├── Person who paid
        │
        └── Expense splits
```

Example:

```text
Dinner
Total: ₹3000

Paid by: Rahul

Splits:
Rahul   ₹1000
Amit    ₹1000
Nitesh  ₹1000
```

The following invariant must hold:

```text
SUM(expense_splits.amount) = expenses.amount
```

The application must validate this before an expense is considered valid.

---

# 10. Expense Creation Flow

```text
User selects group
        │
        ▼
Enter expense description
        │
        ▼
Enter total amount
        │
        ▼
Select payer
        │
        ▼
Select participants
        │
        ▼
Select split method
        │
        ├── Equal
        │
        └── Unequal
        │
        ▼
Calculate split amounts
        │
        ▼
Validate split total
        │
        ▼
Create expense
        │
        ▼
Create expense splits
```

The payer and every participant must be members of the group.

---

# 11. Equal Split

For an expense of ₹3000 shared by three users:

```text
₹3000 / 3 = ₹1000
```

Each participant owes:

```text
₹1000
```

For amounts that cannot divide evenly, rounding must be handled deterministically.

Example:

```text
₹100 / 3

User A: ₹33.33
User B: ₹33.33
User C: ₹33.34
```

The sum must always equal the original expense amount.

---

# 12. Unequal Split

Users may specify exact amounts.

Example:

```text
Total: ₹3000

Rahul:  ₹1500
Amit:   ₹1000
Nitesh: ₹500
```

The application must reject the expense if:

```text
1500 + 1000 + 500 != 3000
```

---

# 13. Balance Calculation

A balance is derived from expenses and settlements.

A separate persistent `balances` table is not required in Phase 1.

For each user:

```text
Balance =
Amount paid
- Amount owed
+ Settlements received
- Settlements paid
```

Positive balance:

```text
User is owed money.
```

Negative balance:

```text
User owes money.
```

Zero:

```text
User is settled.
```

---

# 14. Example Balance Calculation

Three users:

```text
Rahul
Amit
Nitesh
```

Expense:

```text
₹3000

Paid by Rahul

Rahul owes ₹1000
Amit owes ₹1000
Nitesh owes ₹1000
```

Raw balances:

```text
Rahul:  +₹2000
Amit:   -₹1000
Nitesh: -₹1000
```

Therefore:

```text
Amit   → Rahul   ₹1000
Nitesh → Rahul   ₹1000
```

---

# 15. Settlements

A settlement represents an actual payment between users.

Example:

```text
Nitesh pays Rahul ₹1000
```

A settlement does not modify the original expense.

Instead, it reduces the outstanding balance.

This preserves the historical record of both:

```text
Original expense
+
Actual settlement
```

---

# 16. Debt Simplification

Phase 1 should support calculating simplified payment recommendations.

Example raw balances:

```text
Rahul    +₹2000
Amit     -₹500
Nitesh   -₹1500
```

Simplified result:

```text
Amit   → Rahul   ₹500
Nitesh → Rahul   ₹1500
```

The simplification logic should operate on calculated balances rather than modifying stored expenses.

---

# 17. Authorization Model

RLS is the primary authorization mechanism.

## Profiles

A user can:

* Read their own profile.
* Update their own profile.

Users should not arbitrarily modify another user's profile.

## Groups

A group member can read groups they belong to.

Group creation is allowed for authenticated users.

Group administration actions are restricted to group administrators where applicable.

## Group Members

A group member can read the membership of groups they belong to.

Adding/removing members must be authorized.

## Expenses

A user can access expenses only when they belong to the associated group.

Creating an expense requires the user to be a member of the group.

The payer must belong to the group.

All expense participants must belong to the group.

## Expense Splits

Expense splits inherit authorization from the associated expense/group.

A user must not be able to access splits belonging to another group's expenses.

## Settlements

A settlement can only exist between members of the same group.

Users can only access settlements belonging to groups they are members of.

---

# 18. Application Structure

The initial Next.js structure should remain simple.

```text
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   │
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── groups/
│   │   └── expenses/
│   │
│   ├── layout.tsx
│   └── page.tsx
│
├── components/
│   ├── ui/
│   ├── groups/
│   ├── expenses/
│   └── dashboard/
│
├── lib/
│   ├── supabase/
│   ├── expenses/
│   ├── balances/
│   └── validations/
│
└── types/
```

The exact structure may evolve as implementation progresses.

---

# 19. Supabase Client Architecture

Use separate Supabase client utilities appropriate for the execution environment.

```text
lib/supabase/
├── client.ts
├── server.ts
└── middleware.ts
```

### Client

Used for browser-side operations requiring a client component.

### Server

Used by Server Components and server-side operations.

### Middleware

Used for maintaining authentication/session behavior where required by the Next.js application.

---

# 20. Validation

Validation must occur at multiple levels.

## Client validation

Used for:

* Better user experience
* Immediate form feedback
* Preventing obvious invalid input

## Server/database validation

Used for:

* Security
* Data integrity
* Authorization
* Business rules

The client must never be considered the authoritative validation layer.

---

# 21. Error Handling

Errors should be handled consistently.

Categories include:

```text
Authentication error
Authorization error
Validation error
Database error
Not found
Unexpected application error
```

User-facing errors should be understandable.

Internal database details, credentials, stack traces, and sensitive information must not be exposed to users.

---

# 22. UI Design System

Splitly should use a clean, modern financial-product visual language.

## Font

Primary font:

```text
Inter
```

Fallback:

```text
ui-sans-serif, system-ui, sans-serif
```

## Typography

```text
Page heading:   32px / 700
Section:        24px / 600
Card heading:   18px / 600
Body:           16px / 400
Label:          14px / 500
Secondary:      14px / 400
Caption:        12px / 400
Amount:         20px / 600
Large amount:   28px / 700
```

## Colors

### Primary

```text
#2563EB
```

Hover:

```text
#1D4ED8
```

Light:

```text
#DBEAFE
```

### Success

```text
#16A34A
```

Light:

```text
#DCFCE7
```

Used for money owed to the current user and positive balances.

### Danger

```text
#DC2626
```

Light:

```text
#FEE2E2
```

Used for money owed by the current user and destructive actions.

### Warning

```text
#D97706
```

Light:

```text
#FEF3C7
```

### Neutral

```text
Text Primary:   #111827
Text Secondary: #6B7280
Text Muted:     #9CA3AF
Border:         #E5E7EB
Background:     #F9FAFB
Surface:        #FFFFFF
```

## Semantic color rule

Color should communicate financial meaning consistently.

```text
Blue   = primary action
Green  = money coming to the user
Red    = money owed by the user
Amber  = warning/pending
Gray   = neutral information
```

---

# 23. Deployment

Vercel is the deployment platform.

Production architecture:

```text
Git Repository
      │
      ▼
    Vercel
      │
      ▼
Next.js Application
      │
      ▼
   Supabase
```

Environment variables must be configured separately for local development and Vercel.

Required public variables:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Server-side Supabase utilities may also read `NEXT_SUPABASE_URL` and
`NEXT_SUPABASE_PUBLISHABLE_KEY` for compatibility, but browser code must use
the `NEXT_PUBLIC_` names.

Privileged Supabase credentials, if ever required for server-only operations, must be stored only as server-side environment variables and never exposed to client code.

---

# 24. Development Workflow

Development should proceed incrementally.

## Step 1

Initialize Next.js project.

## Step 2

Configure Supabase clients.

## Step 3

Implement authentication.

## Step 4

Implement protected application routes.

## Step 5

Implement profiles.

## Step 6

Implement group creation and management.

## Step 7

Implement group membership.

## Step 8

Implement expense creation.

## Step 9

Implement equal and unequal splits.

## Step 10

Implement balance calculation.

## Step 11

Implement settlements.

## Step 12

Build and polish the dashboard.

## Step 13

Test RLS and business rules.

## Step 14

Deploy to Vercel.

---

# 25. Testing Priorities

Testing should focus particularly on financial correctness and authorization.

Important cases:

* User cannot access another group's data.
* Non-members cannot add expenses to a group.
* Payer must belong to the group.
* Expense participants must belong to the group.
* Expense split totals must equal expense total.
* Negative/zero expense amounts are rejected.
* Negative/zero split amounts are rejected.
* Settlement amount must be positive.
* Settlement participants must belong to the group.
* User cannot settle with themselves.
* Equal split rounding always preserves the original total.
* Balance calculations correctly account for settlements.
* Deleting an expense correctly removes its splits.

---

# 26. Future Architecture

If Splitly grows significantly, a dedicated backend can be introduced later.

Potential future architecture:

```text
                    Next.js
                       │
                       ▼
                  API / Backend
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
       Groups       Expenses    Settlements
          │            │            │
          └────────────┼────────────┘
                       ▼
                   Supabase
```

Possible reasons to introduce a backend service:

* Complex business logic
* Multiple clients requiring the same API
* Background processing
* Notifications
* External payment integrations
* Higher traffic
* Independent scaling
* Third-party integrations
* Dedicated service ownership

This decision should be made based on actual requirements rather than anticipated scale.

---

# 27. Phase 1 Success Criteria

Phase 1 is complete when an authenticated user can:

1. Create an account.
2. Log in.
3. Create a group.
4. Add members.
5. View group members.
6. Add an expense.
7. Select who paid.
8. Split an expense equally.
9. Split an expense unequally.
10. View group expenses.
11. View their current balance.
12. See who owes whom.
13. Record a settlement.
14. See balances updated after settlement.
15. Access only data permitted by RLS.
16. Use the application successfully in production on Vercel.

---

# 28. Engineering Rule

Do not introduce complexity unless Phase 1 requirements justify it.

The preferred implementation is:

```text
Simple
Secure
Type-safe
Maintainable
Scalable when necessary
```

The goal of Phase 1 is to establish a strong foundation for Splitly without prematurely introducing microservices or infrastructure that the product does not yet need.
