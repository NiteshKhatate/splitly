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

The repository contains separate documents for different aspects of the project.

### Architecture and technical decisions

```text
docs/system-design.md
```

This is the source of truth for:

* System architecture
* Technology choices
* Database design
* Data relationships
* Authentication architecture
* Authorization
* RLS
* Data flows
* Balance calculations
* Settlement logic
* Deployment architecture
* Phase 1 scope

### UI and design

```text
docs/design-system.md
```

This is the source of truth for:

* Colors
* Typography
* Font sizes
* Spacing
* Buttons
* Inputs
* Forms
* Cards
* Modals
* Tables
* Badges
* Component variants
* Component states
* Responsive behavior
* Accessibility expectations

### Actual reusable UI implementation

```text
src/components/ui/
```

This directory contains reusable UI components implementing the design system.

---

# 3. How to Use Project Documentation

Do not repeatedly ask the user to provide information that already exists in the repository.

Before making changes, inspect the relevant project documentation and existing implementation.

### For UI work

Use:

```text
docs/design-system.md
```

and inspect:

```text
src/components/ui/
```

### For architecture/backend/database work

Use:

```text
docs/system-design.md
```

### For general project conventions

Follow this `AGENTS.md`.

Do not require the user to explicitly tell you to read these documents in every prompt.

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

---

# 5. Technology Stack

The project uses:

* Next.js
* React
* TypeScript
* Tailwind CSS
* Supabase
* PostgreSQL
* Supabase Authentication
* Supabase Row Level Security (RLS)
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
Next.js
 │
 ├── Supabase Auth
 │
 └── Supabase PostgreSQL + RLS
```

Do not create a separate:

* Express backend
* NestJS backend
* Node.js API server
* Microservice
* API gateway

unless the user explicitly approves an architectural change.

Next.js server-side functionality and Supabase provide the backend capabilities required for Phase 1.

---

# 7. Next.js Development

Use the Next.js App Router.

Prefer Server Components by default.

Use Client Components only when required for:

* Browser interaction
* Client-side state
* Event handlers
* Interactive forms
* Other functionality that requires `"use client"`

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

* Explicit types
* Type inference where appropriate
* Shared domain types
* Type-safe Supabase queries

Do not duplicate types unnecessarily.

---

# 9. Supabase

Supabase is the primary backend/data platform.

Use the existing Supabase configuration and utilities.

Do not create a second database access layer unless required.

Never expose the Supabase service-role key to browser/client-side code.

Only use privileged Supabase credentials in secure server-side environments.

---

# 10. Database

The Phase 1 application tables are:

```text
profiles
groups
group_members
expenses
expense_splits
settlements
```

Supabase's:

```text
auth.users
```

is managed by Supabase Authentication.

Do not recreate `auth.users`.

Do not modify the existing database schema unless explicitly requested or required to fix a confirmed issue.

Before proposing a schema change, check:

```text
docs/system-design.md
```

---

# 11. Row Level Security

RLS is a fundamental part of Splitly's security model.

Never bypass RLS simply to make an operation work.

Application behavior must respect the existing authorization model.

Users must only be able to access data they are authorized to access.

Pay particular attention to:

* Group membership
* Expenses
* Expense splits
* Settlements
* User profiles

Do not disable RLS.

Do not weaken RLS policies without explicit approval.

---

# 12. Authentication

Use Supabase Authentication.

The authentication flow must support:

* Signup
* Email confirmation where enabled
* Login
* Logout
* Session handling
* Protected routes
* Authenticated user identification

Do not implement a second authentication system.

Do not store passwords in the application database.

---

# 13. UI Development

Splitly uses a centralized design system.

Before creating or modifying UI:

1. Check `docs/design-system.md`.
2. Inspect `src/components/ui/`.
3. Reuse an existing component whenever possible.
4. If a required component does not exist, create a reusable component.
5. Follow the design-system specification.

Do not create one-off UI implementations when an existing reusable component is appropriate.

---

# 14. Reusable Components

Common reusable UI components should live under:

```text
src/components/ui/
```

Examples include:

```text
Button
Input
Textarea
Select
Checkbox
Radio
Switch
FormField
Card
Modal
Dialog
Badge
Avatar
Toast
Alert
Spinner
Skeleton
```

Use component variants rather than duplicating CSS.

For example:

```tsx
<Button variant="primary">
  Submit
</Button>
```

rather than creating a new custom button style for every page.

---

# 15. Semantic Component Usage

Use components according to their intended purpose.

Examples:

```text
Submit Button
→ Form submission

Cancel Button
→ Cancel/back out of an operation

Danger Button
→ Destructive action

Primary Button
→ Main action

Secondary Button
→ Supporting action

Ghost Button
→ Low-emphasis action
```

Do not change the visual meaning of a component merely to make a page look different.

If a new semantic component is required, add it to the design system instead of creating a one-off implementation.

---

# 16. Forms

Forms should use the standardized form components.

Follow:

```text
docs/design-system.md
```

for:

* Labels
* Inputs
* Helper text
* Validation messages
* Error states
* Disabled states
* Loading states
* Focus states

Validate important data both client-side and server-side.

Client validation exists for user experience.

Server/database validation exists for security and data integrity.

---

# 17. Financial Data

Splitly handles financial information.

Treat monetary calculations carefully.

Never use floating-point arithmetic for financial calculations where precision could be lost.

Use the database/application representation defined by the system design.

Important invariant:

```text
SUM(expense_splits.amount) = expenses.amount
```

Always preserve the original expense total.

Balance calculations must account for:

* Expenses
* Expense splits
* Settlements

Do not silently round away money.

Any rounding must be deterministic and must preserve the original total.

---

# 18. Expense Rules

An expense must:

* Have a positive amount.
* Belong to a valid group.
* Have a payer who is a group member.
* Have valid participants who are group members.
* Have splits whose total equals the expense total.

Do not allow users to create expenses involving users outside the group.

---

# 19. Settlement Rules

A settlement must:

* Belong to a valid group.
* Have a positive amount.
* Have a payer who belongs to the group.
* Have a recipient who belongs to the group.
* Have different payer and recipient users.

Settlements must not modify historical expense records.

---

# 20. Business Logic

Keep business logic separate from presentation components where practical.

For example, balance calculations should not be embedded directly inside a large React component.

Prefer dedicated modules such as:

```text
src/lib/balances/
src/lib/expenses/
src/lib/validations/
```

Keep components focused on presentation and interaction.

---

# 21. Error Handling

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

User-facing messages should be clear and understandable.

Do not expose:

* Database internals
* Stack traces
* Secrets
* Service-role credentials
* Sensitive implementation details

---

# 22. Accessibility

All UI should be accessible by default.

Follow appropriate practices for:

* Semantic HTML
* Form labels
* Keyboard navigation
* Focus states
* Button semantics
* Input errors
* Dialog accessibility
* Screen-reader-friendly messaging

Do not rely solely on color to communicate important information.

---

# 23. Responsive Design

All user-facing pages must work across:

* Mobile
* Tablet
* Desktop

Follow responsive rules in:

```text
docs/design-system.md
```

Do not design desktop-only interfaces unless explicitly requested.

---

# 24. Dependencies

Before adding a new dependency:

1. Check whether the functionality can be implemented using existing dependencies.
2. Check whether an existing project utility already provides the functionality.
3. Add a dependency only when there is a meaningful benefit.

Do not add libraries merely for convenience.

---

# 25. File Organization

Follow the existing project structure.

Expected structure:

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
│   ├── expenses/
│   ├── balances/
│   └── validations/
└── types/
```

Do not reorganize the project unnecessarily.

---

# 26. Scope Control

When asked to implement a feature:

* Implement the requested feature.
* Make only necessary supporting changes.
* Do not redesign unrelated pages.
* Do not refactor unrelated code.
* Do not introduce future-phase functionality.
* Do not change the architecture unless necessary.

If a requested feature conflicts with the existing architecture or design system, identify the conflict before making a significant change.

---

# 27. Documentation Updates

When an implementation changes an important architectural or design decision, update the appropriate documentation.

Use:

```text
docs/system-design.md
```

for architectural changes.

Use:

```text
docs/design-system.md
```

for design-system changes.

Do not duplicate the same specification across multiple files unnecessarily.

---

# 28. Testing and Verification

After making changes, run the relevant checks available in the project.

At minimum, when applicable:

```text
pnpm lint
pnpm typecheck
pnpm build
```

If a command does not exist in the project, inspect `package.json` and use the project's configured equivalent.

Fix errors introduced by your changes.

For business-critical functionality, test relevant edge cases.

---

# 29. Git and Changes

Keep changes focused.

Do not:

* Delete unrelated files.
* Rewrite unrelated components.
* Change configuration without a reason.
* Commit secrets.
* Add `.env` files containing credentials.

Never expose environment secrets in source code.

---

# 30. When Requirements Are Ambiguous

Use the existing documentation and codebase to infer the intended implementation when the decision is low-risk.

Ask the user before making a significant decision involving:

* Architecture
* Database schema
* Authentication model
* Security/RLS
* Major UX changes
* New infrastructure
* New external services
* Breaking changes

Do not silently make major architectural decisions.

---

# 31. Definition of Done

A task is considered complete when:

* The requested functionality is implemented.
* Existing functionality continues to work.
* The implementation follows `AGENTS.md`.
* Relevant system-design rules are followed.
* Relevant design-system rules are followed.
* Existing reusable components are reused where appropriate.
* TypeScript checks pass.
* Lint passes.
* Build passes when applicable.
* No secrets are exposed.
* No unnecessary dependencies or infrastructure were introduced.

---

# 32. Core Principle

When implementing Splitly, optimize for:

```text
Consistency
Security
Simplicity
Type safety
Maintainability
User experience
```

Do not optimize for architectural complexity.

Build the simplest solution that correctly satisfies the current Phase 1 requirements.