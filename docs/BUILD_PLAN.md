# Splitly — Build Plan

## Purpose

This document defines the recommended implementation sequence for Splitly.

Features must be built incrementally.

Do not skip ahead to advanced functionality before the financial foundation is correct.

Each phase has explicit exit criteria.

---

# Milestone Overview

```text
M0  Foundation
M1  Authentication
M2  Application Shell
M3  Friends
M4  Groups
M5  Basic Expenses
M6  Balance Engine
M7  Advanced Splits
M8  Multiple Payers
M9  Direct Expenses
M10 Settlements
M11 Activity
M12 Comments
M13 Categories
M14 Debt Simplification
M15 Recurring Expenses
M16 Multiple Currencies
M17 Notifications
M18 Search
M19 Reports
M20 Attachments
M21 Itemization
M22 Production Hardening
```

---

# Milestone 0 — Foundation

## Goal

Create a stable development foundation before product work.

## Tasks

### 0.1 Repository structure

Establish:

```text
src/
├── app/
├── components/
├── features/
├── lib/
├── hooks/
├── types/
└── utils/
```

### 0.2 Documentation

Create:

```text
AGENTS.md

docs/
├── product-requirements.md
├── build-plan.md
├── system-design.md
├── database.md
├── business-rules.md
├── permissions.md
├── design-system.md
└── testing.md
```

### 0.3 Environment configuration

Configure:

- Supabase URL
- public anon key
- server secrets
- environment validation

Never expose privileged keys.

### 0.4 Supabase clients

Create appropriate:

- browser client
- server client
- server-only privileged client if ever required

### 0.5 Design tokens

Define:

- typography
- spacing
- colors
- radius
- shadows
- breakpoints
- semantic statuses

### 0.6 Base UI components

Implement:

```text
Button
Input
Textarea
Select
Checkbox
Avatar
Card
Dialog
Drawer
BottomSheet
Badge
Spinner
Skeleton
EmptyState
ErrorState
```

### 0.7 Mobile layout foundations

Verify:

```text
320
375
390
430
768
1024
1440
```

## Exit Criteria

- project builds
- lint succeeds
- TypeScript succeeds
- reusable UI components exist
- no major layout overflow
- repository documentation exists

---

# Milestone 1 — Authentication

## Goal

Users can securely access Splitly.

## Tasks

### 1.1 Profiles database

Create profile model linked to Supabase Auth.

Fields may include:

```text
id
display_name
avatar_url
default_currency
locale
timezone
created_at
updated_at
```

### 1.2 Signup

Build signup workflow.

### 1.3 Login

Build login workflow.

### 1.4 Logout

Build logout.

### 1.5 Forgot password

Build password reset request.

### 1.6 Password recovery

Handle reset callback/update.

### 1.7 Session protection

Protect authenticated routes.

### 1.8 Profile settings

Basic profile editing.

## Exit Criteria

Two separate users can create accounts and sign in independently.

Unauthorized users cannot access protected application routes.

---

# Milestone 2 — Application Shell

## Goal

Create the mobile-first authenticated application layout.

## Mobile

Primary navigation:

```text
Home
Activity
Add
Groups
Account
```

Use:

- compact top bar
- bottom navigation
- central Add action

## Desktop

Use:

- persistent sidebar
- main content region
- optional contextual secondary panel

## Tasks

### 2.1 App layout

### 2.2 Mobile header

### 2.3 Bottom navigation

### 2.4 Desktop sidebar

### 2.5 Page container

### 2.6 Loading layout

### 2.7 Error boundary

### 2.8 Empty-state patterns

## Exit Criteria

Navigation works on:

- mobile
- tablet
- desktop

No full-width desktop sidebar appears on phone layouts.

---

# Milestone 3 — Friends

## Goal

Create direct relationships between users.

## Tasks

### 3.1 Friendship schema

Support:

```text
pending
accepted
declined
blocked/archive if later required
```

### 3.2 RLS policies

### 3.3 User search

### 3.4 Send invitation

### 3.5 Accept invitation

### 3.6 Decline invitation

### 3.7 Friends list

### 3.8 Friend profile/detail

No financial balance required yet.

## Exit Criteria

Two users can become friends and see the relationship securely.

---

# Milestone 4 — Groups

## Goal

Users can create and manage expense groups.

## Tasks

### 4.1 Group schema

Suggested fields:

```text
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

### 4.2 Group-members schema

Track:

```text
group_id
user_id
role
joined_at
```

### 4.3 Group RLS

### 4.4 Create group

### 4.5 Group list

### 4.6 Group detail

### 4.7 Add member

### 4.8 Invite member

### 4.9 Remove member

Only when financial constraints permit it.

### 4.10 Edit group

### 4.11 Archive group

## Exit Criteria

A user can:

```text
create group
add users
view membership
edit group
```

and unauthorized users cannot view it.

---

# Milestone 5 — Basic Expense Engine

## Goal

Build the first correct financial workflow.

Only support:

```text
single payer
equal split
one expense currency
```

initially.

## Database

Create:

```text
expenses
expense_payers
expense_participants
```

## Tasks

### 5.1 Expense schema

### 5.2 Payer schema

### 5.3 Participant schema

### 5.4 Money utilities

### 5.5 Equal split function

### 5.6 Equal split tests

### 5.7 Create-expense validation

### 5.8 Create-expense server action

### 5.9 Add-expense UI

### 5.10 Expense list

### 5.11 Expense detail

### 5.12 Edit expense

### 5.13 Delete expense

## Mobile Add Expense

The experience should be optimized for one-handed use.

Suggested sequence:

```text
Description
Amount
Paid by
Split between
Date
Category
Notes
Save
```

Advanced options should not overwhelm the first view.

## Exit Criteria

Three members can create an equal-split expense and the participant totals reconcile exactly with the total.

---

# Milestone 6 — Balance Engine

## Goal

Calculate accurate financial positions.

## Tasks

### 6.1 User expense position

Implement:

```text
paid - owed
```

### 6.2 Pairwise balances

### 6.3 Group balance

### 6.4 Global balance

### 6.5 Dashboard totals

### 6.6 Currency grouping

Even before multi-currency UX is complete, do not build assumptions that merge currencies.

### 6.7 Unit tests

Include:

```text
one payer
three participants
rounding
multiple expenses
edited expense
deleted expense
```

## Exit Criteria

Balances are reproducible from financial records.

No manually editable balance field is required.

---

# Milestone 7 — Advanced Split Types

Implement one mode at a time.

## 7.1 Exact Amount

Example:

```text
₹1000

A ₹500
B ₹300
C ₹200
```

Validation:

```text
sum = expense total
```

---

## 7.2 Percentage

Example:

```text
A 50%
B 30%
C 20%
```

Validation:

```text
sum = 100%
```

---

## 7.3 Shares

Example:

```text
A = 2
B = 1
C = 1
```

Calculate proportional values.

---

## 7.4 Adjustment

Add only after previous methods are stable.

## Exit Criteria

Every split method produces deterministic, fully reconciled totals.

---

# Milestone 8 — Multiple Payers

## Goal

Support expenses funded by multiple people.

Example:

```text
Expense ₹2,000

Nitesh paid ₹1,500
Rahul paid ₹500
```

## Tasks

### 8.1 Multiple payer UI

### 8.2 Contribution validation

### 8.3 Balance calculations

### 8.4 Edit payer contributions

### 8.5 Tests

Validation:

```text
sum(payer contributions)
=
expense total
```

## Exit Criteria

Expense balances remain mathematically correct for multiple payers.

---

# Milestone 9 — Direct / Non-Group Expenses

## Goal

Friends can share expenses without creating a group.

## Tasks

### 9.1 Direct expense model support

### 9.2 Friend expense screen

### 9.3 Add direct expense

### 9.4 Direct expense history

### 9.5 Direct balance

### 9.6 Permissions

## Exit Criteria

Two friends can share and settle expenses without belonging to a group.

---

# Milestone 10 — Settlements

## Goal

Users can record repayments.

## Schema

Suggested:

```text
settlements
```

Fields:

```text
id
group_id nullable
payer_user_id
recipient_user_id
amount
currency
payment_method
settlement_date
note
created_by
created_at
```

## Payment methods

Initially descriptive only:

```text
cash
upi
bank_transfer
other
```

Do not process payments yet.

## Tasks

### 10.1 Schema

### 10.2 RLS

### 10.3 Settlement calculation

### 10.4 Record-settlement UI

### 10.5 Settlement history

### 10.6 Balance integration

### 10.7 Tests

## Exit Criteria

Recording a valid settlement reduces balances exactly as expected.

---

# Milestone 11 — Activity History

## Goal

Provide an auditable history.

Events:

```text
expense_created
expense_updated
expense_deleted
settlement_created
group_created
group_updated
member_added
member_removed
comment_added
```

## Tasks

### 11.1 Activity schema

### 11.2 Event creation

### 11.3 Group activity

### 11.4 Global activity

### 11.5 Pagination

## Exit Criteria

Important financial and group changes appear chronologically.

---

# Milestone 12 — Comments

## Goal

Allow discussion on expenses.

## Tasks

### 12.1 Comment schema

### 12.2 RLS

### 12.3 Add comment

### 12.4 Delete own comment if allowed

### 12.5 Expense comment thread

## Exit Criteria

Only authorized expense viewers can read and create comments.

---

# Milestone 13 — Categories

## Goal

Provide structured expense classification.

Initial examples:

```text
General
Food
Groceries
Dining
Drinks
Transport
Taxi
Fuel
Parking
Housing
Rent
Utilities
Entertainment
Travel
Shopping
Healthcare
Other
```

## Tasks

### 13.1 Category model

### 13.2 Seed categories

### 13.3 Category selector

### 13.4 Filtering support

---

# Milestone 14 — Debt Simplification

## Goal

Reduce unnecessary transfer paths.

## Algorithm

1. calculate each member's net group balance
2. divide users into debtors and creditors
3. match debtors to creditors
4. generate simplified payment instructions
5. preserve every user's net balance

## Tasks

### 14.1 Algorithm

### 14.2 Unit tests

### 14.3 Group setting

### 14.4 Simplified-balance UI

## Mandatory Test

Before simplification:

```text
A → B ₹500
B → C ₹500
```

After:

```text
A → C ₹500
```

Net positions must match exactly.

---

# Milestone 15 — Recurring Expenses

## Goal

Generate new expenses from schedules.

Support:

```text
weekly
biweekly
monthly
yearly
```

## Architecture

Recurring configuration is a template.

Generated expenses become normal expenses.

Do not mutate historical expense instances when the recurring template changes.

## Tasks

### 15.1 Recurring template schema

### 15.2 Scheduler mechanism

### 15.3 Create recurring expense

### 15.4 Pause

### 15.5 Resume

### 15.6 End recurrence

### 15.7 Future-occurrence editing

---

# Milestone 16 — Multiple Currencies

## Goal

Allow users to track separate financial positions.

## Tasks

### 16.1 Currency metadata

### 16.2 User default currency

### 16.3 Group default currency

### 16.4 Currency selector

### 16.5 Currency-separated balances

### 16.6 Formatting utilities

Never automatically combine:

```text
₹500
$25
€10
```

into one number.

---

# Milestone 17 — Notifications

## Initial implementation

In-app notifications.

Events:

```text
friend request
group invitation
member added
new expense
expense changed
settlement
comment
recurring expense
```

## Tasks

### 17.1 Notification schema

### 17.2 Notification service

### 17.3 Notification dropdown/page

### 17.4 Read/unread

### 17.5 Notification preferences

Later:

```text
email
push
```

---

# Milestone 18 — Search and Filtering

## Expense Search

Search by:

```text
description
group
person
category
notes
```

Filters:

```text
date
amount
currency
category
group
person
```

## Tasks

### 18.1 Search query

### 18.2 Search screen

### 18.3 Filters

### 18.4 Pagination

### 18.5 Mobile filter drawer

---

# Milestone 19 — Reports and Insights

## Goal

Provide useful spending analytics.

Reports:

```text
total spending
monthly spending
category spending
group spending
spending over time
amount personally paid
```

Reports should read from existing financial records.

Do not create a second accounting system.

---

# Milestone 20 — Attachments

## Goal

Support receipts and files.

Use Supabase Storage.

## Tasks

### 20.1 Storage bucket

### 20.2 Storage permissions

### 20.3 Upload receipt

### 20.4 Preview attachment

### 20.5 Delete attachment

### 20.6 File validation

Later:

```text
OCR
receipt extraction
```

---

# Milestone 21 — Itemized Expenses

## Goal

Allow participants to split individual receipt items.

Example:

```text
Pizza     ₹800
Drinks    ₹400
Dessert   ₹300
Tax       ₹150
Tip       ₹150
```

Support:

- item participant assignment
- tax
- tip
- discounts
- proportional allocation

Final calculated total must reconcile exactly with the expense total.

---

# Milestone 22 — Production Hardening

## Security

Review:

- all RLS
- all server mutations
- file access
- invitation flows
- ID guessing
- privilege escalation

## Performance

Review:

- indexes
- large queries
- pagination
- N+1 queries
- expensive calculations

## UX

Review:

```text
320px
375px
390px
430px
768px
1024px
1440px
```

## Accessibility

Review:

- keyboard
- labels
- dialogs
- focus
- touch targets
- contrast

## Reliability

Add:

- error boundaries
- structured logging
- retry handling
- safe mutation feedback

---

# First Release Target

The first useful Splitly release should successfully support this scenario:

```text
Nitesh creates an account

Rahul creates an account

Amit creates an account

Nitesh creates "Goa Trip"

Nitesh adds Rahul and Amit

Nitesh adds Hotel
₹6,000
paid by Nitesh
split equally

Rahul adds Dinner
₹1,500
paid by Rahul
split equally

Splitly calculates accurate balances

Amit records a settlement

Balances update correctly

Users can review expense history
```

Do not prioritize advanced features until this workflow works reliably.

---

# Definition of Done for a Build Task

A feature is complete only when applicable requirements are satisfied:

```text
database
RLS
domain logic
server mutation/query
validation
UI
mobile layout
loading states
empty states
error states
tests
lint
TypeScript
```

The existence of a screen does not mean the feature is complete.

---

# Standard Agent Prompt

Use this pattern when assigning tasks:

```text
Read AGENTS.md and the relevant documents under /docs.

We are implementing Build Plan task [NUMBER + NAME].

Inspect the existing code before making changes.

Implement only this task.

Follow the existing architecture and design system.

Do not implement future build-plan items.

Add or update tests where required.

Verify TypeScript and lint.

At the end report:
- implemented
- files changed
- database changes
- tests executed
- responsive checks
- anything intentionally deferred

Stop after completing this task.
```