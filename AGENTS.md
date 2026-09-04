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

Source of truth for:

* System architecture
* Technology choices
* Database design
* Data relationships
* Authentication
* Authorization
* RLS
* Data flows
* Balance calculations
* Settlement logic
* Deployment architecture
* Phase 1 scope

### UI and design

```text
docs/system-design.md
```

Source of truth for:

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
* Accessibility

### Reusable UI implementation

```text
src/components/ui/
```

This directory contains reusable UI components implementing the design system.

---

# 3. Documentation Rules

Do not require the user to repeatedly tell you to read project documentation.

Before making changes:

* Follow this `AGENTS.md`.
* Consult `docs/system-design.md` for architecture/backend/database work.
* Consult `docs/system-design.md` for UI/form/component work.
* Inspect existing implementation before creating new components or utilities.

These documents are the project's source of truth.

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
* React Hook Form
* Zod
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

* Explicit types
* Type inference where appropriate
* Shared domain types
* Type-safe Supabase queries
* Zod-inferred form types

---

# 9. Forms and Validation

**React Hook Form and Zod are the standard form-management and validation solution for Splitly.**

Use:

* `react-hook-form` for form state, submission state, touched/dirty state, and field management.
* `zod` for schema definitions and validation.
* `@hookform/resolvers/zod` to connect Zod schemas to React Hook Form.

Do not introduce another form-management or validation library without explicit approval.

### Standard pattern

Forms should generally follow:

```text
Zod Schema
    ↓
zodResolver
    ↓
React Hook Form
    ↓
Reusable Form UI Components
    ↓
Server/API action
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

Use the inferred Zod type rather than manually duplicating the form type.

---

# 10. Form Validation Rules

Validation must happen at multiple layers where appropriate.

### Client-side

Use Zod + React Hook Form for immediate user feedback.

### Server-side

Validate submitted data again before performing privileged or persistent operations.

Do not trust client-side validation as a security boundary.

### Database

Use database constraints and RLS to enforce data integrity and authorization.

The layers serve different purposes:

```text
React Hook Form
    ↓
User interaction/form state

Zod
    ↓
Input validation

Server-side validation
    ↓
Security/data boundary

Supabase/PostgreSQL
    ↓
Data integrity + authorization
```

---

# 11. Form Schema Location

Keep reusable validation schemas outside UI components where appropriate.

Prefer a structure such as:

```text
src/lib/validations/
├── auth.ts
├── groups.ts
├── expenses.ts
└── settlements.ts
```

Adapt to the existing project structure.

Do not create duplicate schemas for the same domain object.

For simple page-specific forms, a local schema is acceptable when it is genuinely not reusable.

---

# 12. React Hook Form Rules

Use React Hook Form for interactive forms.

Prefer:

```tsx
const form = useForm<FormValues>({
  resolver: zodResolver(schema),
});
```

Use:

```tsx
form.handleSubmit(...)
```

for submission.

Do not manually manage every field using separate `useState` calls when React Hook Form already provides the required functionality.

Avoid unnecessary controlled components.

Use React Hook Form's standard registration mechanisms where possible.

Use `Controller` only when required by a third-party or fully controlled component.

---

# 13. Form Components

Forms must use reusable UI components where available.

Prefer a structure such as:

```text
Form
 ├── FormField
 │    ├── Label
 │    ├── Input
 │    ├── Description
 │    └── ErrorMessage
 │
 └── Button
```

Use components from:

```text
src/components/ui/
```

Do not create one-off form styling.

---

# 14. Validation Error Handling

Zod validation errors should be displayed through the standardized form error UI.

Errors should:

* Appear close to the relevant field.
* Be understandable to users.
* Not expose implementation details.
* Be accessible to assistive technologies.
* Follow `docs/system-design.md`.

Do not manually format Zod errors differently on every page.

---

# 15. Submit State

All asynchronous forms must correctly handle submission state.

During submission:

* Prevent duplicate submissions.
* Disable the submit action where appropriate.
* Show the standard loading state.
* Preserve entered values.
* Do not reset the form prematurely.

After successful submission:

* Reset the form only when appropriate.
* Display the appropriate success state/message.
* Update the relevant UI/data.

After failure:

* Preserve user input.
* Display a user-friendly error.
* Allow the user to retry.

---

# 16. Server and Database Validation

Never rely exclusively on React Hook Form or Zod running in the browser.

For important operations:

```text
Client
  ↓
Zod validation
  ↓
Server boundary
  ↓
Zod/domain validation
  ↓
Supabase
  ↓
PostgreSQL constraints + RLS
```

The server must not blindly trust values sent from the client.

---

# 17. Supabase

Supabase is the primary backend/data platform.

Use the existing Supabase configuration and utilities.

Never expose the Supabase service-role key to browser/client-side code.

Only use privileged Supabase credentials in secure server-side environments.

---

# 18. Row Level Security

RLS is a fundamental part of Splitly's security model.

Never bypass RLS simply to make an operation work.

Do not disable RLS.

Do not weaken RLS policies without explicit approval.

Do not use client-side validation as a substitute for RLS.

Authorization must ultimately be enforced by the server/database security model.

---

# 19. Database

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

---

# 20. Authentication

Use Supabase Authentication.

The authentication flow supports:

* Signup
* Email confirmation where enabled
* Login
* Logout
* Session handling
* Protected routes
* Authenticated user identification

Do not implement a second authentication system.

Do not store passwords in the application database.

Use Zod + React Hook Form for authentication forms.

---

# 21. UI Development

Splitly uses a centralized design system.

Before creating or modifying UI:

1. Check `docs/system-design.md`.
2. Inspect `src/components/ui/`.
3. Reuse an existing component whenever possible.
4. If a required component does not exist, create a reusable component.
5. Follow the design-system specification.

Do not create one-off UI implementations when an existing reusable component is appropriate.

---

# 22. Reusable Components

Common reusable UI components should live under:

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

---

# 23. Business Logic

Keep business logic separate from presentation components where practical.

For example:

```text
src/lib/
├── balances/
├── expenses/
├── validations/
└── ...
```

Components should primarily handle presentation and interaction.

Validation schemas should not be duplicated between components.

---

# 24. Financial Data

Splitly handles financial information.

Treat monetary calculations carefully.

Never use floating-point arithmetic for financial calculations where precision could be lost.

Balance calculations must account for:

* Expenses
* Expense splits
* Settlements

Do not silently round away money.

Any rounding must be deterministic and preserve the original total.

---

# 25. Error Handling

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

User-facing messages should be clear.

Do not expose:

* Database internals
* Stack traces
* Secrets
* Service-role credentials
* Sensitive implementation details

---

# 26. Accessibility

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

Validation messages must be associated with their fields.

---

# 27. Responsive Design

All user-facing pages must work across:

* Mobile
* Tablet
* Desktop

Follow responsive rules in:

```text
docs/system-design.md
```

---

# 28. Dependencies

Before adding a dependency:

1. Check whether existing dependencies already solve the problem.
2. Check existing project utilities.
3. Add a dependency only when there is a meaningful benefit.

Current standard form dependencies are:

```text
react-hook-form
zod
@hookform/resolvers
```

Do not replace them with another form/validation solution without explicit approval.

---

# 29. File Organization

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

---

# 30. Scope Control

When asked to implement a feature:

* Implement the requested feature.
* Make only necessary supporting changes.
* Do not redesign unrelated pages.
* Do not refactor unrelated code.
* Do not introduce future-phase functionality.
* Do not change architecture unless necessary.

---

# 31. Documentation Updates

When implementation changes an important architectural or design decision, update the appropriate documentation.

Architecture:

```text
docs/system-design.md
```

UI/design:

```text
docs/system-design.md
```

Do not duplicate the same specification across multiple files unnecessarily.

---

# 32. Testing and Verification

After making changes, run the relevant project checks.

At minimum, when available:

```text
pnpm lint
pnpm typecheck
pnpm build
```

For forms, verify:

* Valid submission
* Required fields
* Invalid values
* Field-level error messages
* Server errors
* Loading state
* Duplicate submission prevention
* Successful submission
* Form reset behavior where appropriate
* Keyboard accessibility

---

# 33. Git and Changes

Keep changes focused.

Do not:

* Delete unrelated files.
* Rewrite unrelated components.
* Change configuration without a reason.
* Commit secrets.
* Add `.env` files containing credentials.

Never expose environment secrets in source code.

---

# 34. When Requirements Are Ambiguous

Use the existing documentation and codebase to infer low-risk decisions.

Ask the user before making significant decisions involving:

* Architecture
* Database schema
* Authentication
* Security/RLS
* Major UX changes
* New infrastructure
* External services
* Breaking changes

Do not silently make major architectural decisions.

---

# 35. Definition of Done

A task is complete when:

* Requested functionality is implemented.
* Existing functionality continues to work.
* `AGENTS.md` is followed.
* Relevant system-design rules are followed.
* Relevant design-system rules are followed.
* Existing reusable components are reused.
* Forms use React Hook Form + Zod where applicable.
* Client and server validation are appropriately separated.
* RLS is respected.
* TypeScript checks pass.
* Lint passes.
* Build passes when applicable.
* No secrets are exposed.
* No unnecessary dependencies or infrastructure are introduced.

---

# 36. Core Principle

When implementing Splitly, optimize for:

```text
Consistency
Security
Simplicity
Type safety
Maintainability
User experience
```

Build the simplest solution that correctly satisfies the current Phase 1 requirements.
