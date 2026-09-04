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
