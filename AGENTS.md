# Splitly — AGENTS.md

## 1. Project Identity

Splitly is a mobile-first shared-expense management application inspired by the workflows of Splitwise.

The goal is to build a production-quality application for:

- friends
- couples
- roommates
- families
- travel groups
- recurring shared expenses

Splitly must have its own:

- branding
- visual design
- code
- copy
- assets
- component system
- implementation

Do not copy proprietary Splitwise source code, private APIs, branding, assets, or text.

The application should reproduce useful expense-sharing workflows rather than visually cloning proprietary assets.

---

# 2. Primary Product Goals

Splitly must allow users to:

1. create an account
2. add friends
3. create groups
4. add group members
5. add shared expenses
6. split expenses in multiple ways
7. support multiple payers
8. calculate balances accurately
9. edit expenses
10. delete expenses
11. record settlements
12. view activity history
13. manage multiple currencies
14. simplify debts
15. view spending history
16. use the application comfortably on mobile devices

Financial correctness, authorization, and mobile usability are higher priority than animations or visual polish.

---

# 3. Technology Stack

Use the existing project stack unless explicitly instructed otherwise.

## Application

- Next.js
- React
- TypeScript
- Next.js App Router

## Styling

- Tailwind CSS
- reusable design-system components

## Backend

- Next.js Server Components
- Server Actions where appropriate
- Route Handlers where appropriate

## Database

- Supabase PostgreSQL

## Authentication

- Supabase Auth

## Authorization

- PostgreSQL Row Level Security

## Storage

- Supabase Storage

## Hosting

- Vercel

## Package Manager

- pnpm

Do not introduce an additional backend framework such as:

- NestJS
- Express
- Fastify

unless explicitly requested.

Splitly should remain a modular monolith unless scale requirements later justify architectural changes.

---

# 4. Required Project Documentation

Before implementing significant features, inspect relevant files from:

```text
/docs
```

Expected documents:

```text
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

If one does not yet exist, do not invent conflicting architecture.

Use the currently available documentation and existing implementation.

---

# 5. Requirement Priority

When instructions conflict, use this priority:

1. latest explicit user instruction
2. AGENTS.md
3. business-rules.md
4. product-requirements.md
5. permissions.md
6. database.md
7. design-system.md
8. system-design.md
9. build-plan.md
10. existing implementation

The latest explicit user instruction overrides documentation when intentional.

---

# 6. Agent Workflow

Before changing code:

1. read AGENTS.md
2. identify the requested task
3. read relevant docs
4. inspect existing implementation
5. inspect reusable components
6. inspect applicable database tables
7. inspect applicable RLS policies
8. understand business rules
9. implement the smallest coherent solution
10. test it
11. stop

Do not automatically continue to unrelated phases.

---

# 7. Task Scope

Implement only the requested task.

Do not create unrelated features "for later."

Avoid:

- speculative architecture
- premature abstractions
- placeholder screens for future phases
- unrelated refactors
- large dependency additions

If the requested feature exposes an architectural flaw that must be fixed, fix only what is necessary and explain it afterward.

---

# 8. Mobile-First Requirement

Splitly is mobile-first.

Every feature must work correctly starting at approximately 320px width.

Base styles represent mobile.

Larger layouts are progressive enhancements.

Preferred Tailwind pattern:

```tsx
className="flex flex-col md:flex-row"
```

Avoid desktop-first patterns that must later be undone.

---

# 9. Required Responsive Widths

Verify important screens at approximately:

```text
320px
375px
390px
430px
768px
1024px
1440px
```

No core workflow may depend on a large desktop viewport.

---

# 10. Mobile UX Rules

## Navigation

Mobile must not display the full desktop sidebar.

Prefer:

- bottom navigation
- compact mobile header
- drawer for secondary actions

Desktop may use:

- persistent sidebar
- contextual secondary panel

## Touch targets

Interactive controls should be at least:

44 × 44px

Prefer approximately:

48px height

for:

- buttons
- inputs
- selects
- important actions

## Forms

Forms should be single-column by default.

Multi-column forms should only appear at larger breakpoints.

## Inputs

Use a minimum mobile text size of approximately 16px for form inputs to prevent mobile-browser zoom issues.

## Overflow

No important screen may introduce unintended horizontal page scrolling.

## Actions

Primary financial actions should remain easy to reach.

Examples:

- Add expense
- Settle up
- Save expense

## Modals

Desktop dialogs may be centered.

On mobile consider:

- bottom sheets
- full-width panels
- near-fullscreen dialogs

when the form is complex.

---

# 11. Mobile Application Navigation

Preferred mobile primary navigation:

```text
Home
Activity
Add
Groups
Account
```

The central Add action should open expense creation.

Friends can be accessible through:

- Home
- Groups
- Account/navigation
- dedicated secondary screen

depending on final IA.

Do not overload mobile bottom navigation with too many items.

---

# 12. Design System

All UI must follow:

```text
docs/design-system.md
```

Do not invent arbitrary:

- colors
- font sizes
- spacing values
- border radius values
- shadows
- button variants
- input styling

If a reusable visual pattern does not exist:

1. determine whether it should be reusable
2. add it to the design system
3. implement a component
4. use the component

---

# 13. Shared Components

Reusable UI belongs under a shared component layer.

Expected primitives may include:

```text
Button
IconButton
Input
Textarea
Select
Checkbox
Radio
Switch
Avatar
Badge
Card
Modal
Dialog
Drawer
BottomSheet
Dropdown
Tabs
Tooltip
Spinner
Skeleton
EmptyState
ErrorState
CurrencyAmount
UserAvatar
UserPicker
DatePicker
```

Feature components should compose primitives instead of duplicating styling.

---

# 14. Feature Organization

Prefer feature-oriented organization.

Example:

```text
src/
├── app/
├── components/
│   ├── ui/
│   └── layout/
├── features/
│   ├── auth/
│   ├── friends/
│   ├── groups/
│   ├── expenses/
│   ├── balances/
│   ├── settlements/
│   ├── activity/
│   ├── notifications/
│   └── settings/
├── lib/
├── hooks/
├── types/
└── utils/
```

Feature-specific components should live inside their feature directories.

---

# 15. Domain Layer

Financial logic must not live directly inside React components.

Use dedicated domain utilities/services for:

- expense splitting
- payer validation
- participant validation
- balance calculations
- settlement calculations
- debt simplification
- currency handling
- rounding

UI components should render results rather than implement accounting logic.

---

# 16. Money Rules

Financial correctness is critical.

Never use floating-point arithmetic for money.

Prefer either:

- integer minor units
- exact decimal database types

Example:

₹12.50 may be represented internally as:

```text
1250 paise
```

if using minor units.

All splits must satisfy:

```text
sum(payer contributions) = expense total
```

and:

```text
sum(participant owed amounts) = expense total
```

Rounding differences must never disappear silently.

---

# 17. Expense Domain Model

Do not assume:

```text
payer = participant
```

These are separate concepts.

An expense can have:

- one payer
- multiple payers
- one participant
- multiple participants

Conceptual model:

```text
Expense
├── Payers
└── Participants
```

Each payer contributes an amount.

Each participant owes an amount.

---

# 18. Supported Split Methods

Splitly should eventually support:

- equal
- exact
- percentage
- shares
- adjustment

Build incrementally.

Equal split should be implemented first.

Do not implement every split method simultaneously unless explicitly requested.

---

# 19. Equal Split Rounding

Example:

```text
₹100 / 3 users
```

cannot divide evenly.

The application must use deterministic rounding.

Example:

```text
User A: ₹33.34
User B: ₹33.33
User C: ₹33.33
```

Total:

```text
₹100.00
```

The same inputs must always produce the same result.

---

# 20. Balance Rules

For a user:

```text
net position
=
amount paid
-
amount owed
+
settlement effects
```

Positive position means:

```text
the user should receive money
```

Negative position means:

```text
the user owes money
```

Balances should be derived from underlying transactions.

Do not create manually editable balances.

---

# 21. Financial Source of Truth

Expenses and settlements are the financial source of truth.

Derived balances may be:

- calculated dynamically
- cached
- materialized

for performance.

However, cached balances must always be reconstructable from financial records.

Never use a mutable balance column as the sole accounting source.

---

# 22. Settlement Rules

A settlement records a repayment between users.

A settlement must not:

- delete expenses
- rewrite expenses
- destroy historical data

Example:

```text
Rahul owes Nitesh ₹500
```

Rahul records:

```text
₹500 payment to Nitesh
```

The settlement offsets the debt.

---

# 23. Debt Simplification

Debt simplification may change:

```text
who pays whom
```

but must never change:

```text
any user's net position
```

Example:

```text
A owes B ₹500
B owes C ₹500
```

may simplify to:

```text
A owes C ₹500
```

Net positions remain identical.

The debt simplification algorithm requires unit tests.

---

# 24. Currency Rules

Each expense has one currency.

Different currencies must remain separate.

Example:

```text
₹2,000 owed
$25 owed
```

must not automatically become a single balance.

Currency conversion is a separate feature.

Do not silently convert currencies.

---

# 25. Database Rules

Use PostgreSQL constraints whenever they can protect data integrity.

Prefer:

- UUID primary keys
- foreign keys
- unique constraints
- check constraints
- timestamps
- indexes

Application validation complements database constraints.

It does not replace them.

---

# 26. Row Level Security

RLS is mandatory for user financial data.

Frontend hiding is not authorization.

A malicious user must not gain data access by manually changing an ID in a request.

Evaluate RLS for every table containing:

- users
- friendships
- groups
- memberships
- expenses
- payers
- participants
- settlements
- comments
- activities
- notifications

---

# 27. Group Visibility

A group should normally be visible only to members or properly authorized invitees.

Users must not access arbitrary groups by guessing UUIDs.

---

# 28. Expense Visibility

A group expense should only be visible to authorized group members.

A non-group expense should only be visible to users who legitimately participate in or are otherwise authorized for that expense.

---

# 29. Service Role

Supabase service-role credentials must never be exposed to browser code.

Any service-role operation must run in trusted server-side code only.

---

# 30. Validation

Validate at:

1. form/user interaction level
2. server boundary
3. database constraint level where appropriate

Critical validations include:

```text
amount > 0

payer total = expense total

participant total = expense total

percentage total = 100%

shares > 0

users belong to valid relationships

group members are valid

currency is supported
```

---

# 31. Authentication

Supabase Auth should manage identity.

Application-specific profile information belongs in a profile table.

Do not duplicate authentication passwords or authentication secrets in application tables.

---

# 32. Error Handling

Every async workflow should consider:

- loading
- success
- validation failure
- unauthorized
- forbidden
- not found
- network failure
- server failure
- empty state

Do not implement only the success state.

---

# 33. Accessibility

Use semantic HTML.

Every form control needs a programmatic label.

Icon-only actions require accessible labels.

Dialog focus must be managed.

Keyboard navigation should work.

Financial status must not depend solely on color.

Example:

Do not communicate "you owe" only with red.

Also display text such as:

```text
You owe ₹1,250
```

---

# 34. Performance

Do not optimize prematurely.

However:

- avoid obvious N+1 queries
- paginate large activity feeds
- paginate expense history
- index commonly filtered fields
- avoid downloading unnecessary records
- use server rendering appropriately

---

# 35. Testing Priorities

Highest-priority unit tests:

```text
equal split
exact split
percentage split
share split
rounding
multiple payers
balance calculations
settlements
debt simplification
currency separation
```

Highest-priority workflow tests:

```text
signup
login
create group
add member
add expense
edit expense
delete expense
settle debt
```

---

# 36. Security Testing

Verify users cannot:

- view groups they do not belong to
- access private expenses
- alter another user's profile
- record settlement as another user
- change group membership without permission
- upload files to another user's expense
- bypass server validation

---

# 37. Build Philosophy

Prefer vertical slices.

Bad:

```text
build every page
then build every API
then add database
```

Preferred:

```text
Create Group

database
→ RLS
→ server action
→ form
→ validation
→ UI
→ tests
```

Then move to the next feature.

---

# 38. Refactoring

Do not perform broad refactors during feature tasks unless necessary.

If duplication becomes clear:

1. finish the feature safely
2. identify duplication
3. extract only the reusable abstraction
4. verify existing behavior

---

# 39. Dependencies

Before installing a new package:

1. check whether the project already provides the capability
2. determine whether the dependency is necessary
3. prefer established lightweight libraries
4. avoid duplicate libraries serving the same purpose

Do not introduce large dependencies for trivial functionality.

---

# 40. Coding Standards

Prefer:

- strict TypeScript
- explicit domain types
- small functions
- reusable utilities
- clear naming
- composition

Avoid:

- `any`
- giant components
- deeply nested conditions
- duplicated business logic
- hidden side effects
- magic numbers

---

# 41. Comments

Comments should explain:

```text
why
```

not merely:

```text
what the code already says
```

Financial rounding logic and complex authorization logic deserve explanatory comments.

---

# 42. Task Completion

Before declaring a task complete verify, where relevant:

- requirement implemented
- TypeScript passes
- lint passes
- relevant tests pass
- RLS reviewed
- financial logic tested
- mobile layout checked
- desktop layout checked
- loading state handled
- empty state handled
- errors handled
- no accidental horizontal scrolling
- design system followed

---

# 43. Completion Report

After implementation, report:

## Implemented

What changed.

## Files changed

Important files created or updated.

## Database changes

Tables, migrations, indexes and policies.

## Tests

Exactly what was executed.

## Verification

Responsive/security/manual checks performed.

## Remaining

Anything intentionally deferred.

Do not claim a test was run unless it was actually executed.

---

# 44. Important Agent Constraint

Do not automatically begin the next build-plan task.

Complete the requested task.

Run checks.

Summarize.

Stop.

Only continue when explicitly instructed.