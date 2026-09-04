# Splitly — System Design

## 1. Overview

Splitly is a shared-expense management application.

The core purpose is to allow users to:

* Create accounts
* Create groups
* Add people to groups
* Record shared expenses
* Split expenses
* Track balances
* Record settlements
* View expense history

The application is designed to provide a simple and transparent way for groups of people to manage shared expenses.

---

# 2. Phase 1 Scope

Phase 1 focuses on establishing the core application foundation.

Phase 1 includes:

```text
Authentication
    ↓
Dashboard
    ↓
Groups
    ↓
Group members
    ↓
Expenses
    ↓
Expense splits
    ↓
Balances
    ↓
Settlements
```

The implementation should remain intentionally simple.

Do not introduce infrastructure or features that are not required for the current phase.

---

# 3. Architecture

Splitly uses a single Next.js application.

```text
                        ┌──────────────┐
                        │     User     │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Vercel    │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │    Next.js   │
                        │ Application  │
                        └──────┬───────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        ┌──────────────┐              ┌──────────────┐
        │ Supabase Auth│              │  Supabase DB │
        └──────────────┘              │ PostgreSQL   │
                                      │ + RLS         │
                                      └──────────────┘
```

There is no separate backend microservice in Phase 1.

---

# 4. Deployment

The application is deployed on:

```text
Vercel
```

The application runtime is Next.js.

Supabase provides:

* Authentication
* PostgreSQL database
* Row Level Security
* Database APIs

Deployment architecture should remain simple unless scale or requirements justify additional infrastructure.

---

# 5. Technology Stack

Core technologies:

```text
Frontend
    Next.js
    React
    TypeScript
    Tailwind CSS

Backend / Data
    Supabase
    PostgreSQL
    Supabase Auth
    PostgreSQL RLS

Forms
    React Hook Form
    Zod
    @hookform/resolvers

Testing
    Jest

Deployment
    Vercel

Package manager
    pnpm
```

---

# 6. Application Layers

The application should conceptually follow:

```text
UI
 │
 ▼
Application / Server Logic
 │
 ▼
Data Access
 │
 ▼
Supabase
 │
 ▼
PostgreSQL + RLS
```

The exact implementation may vary between Server Components, Server Actions, Route Handlers, and client components.

The important principle is that database access and business rules should not be tightly coupled to presentation.

---

# 7. Next.js

Use the Next.js App Router.

Prefer Server Components by default.

Use Client Components only when necessary for:

* Interactive UI
* Form state
* Browser APIs
* Client-side state
* Event handlers

Avoid making entire pages Client Components unnecessarily.

---

# 8. Authentication

Supabase Authentication is the authentication provider.

The application relies on Supabase Auth for:

* Signup
* Login
* Email confirmation
* Logout
* Session management
* Authenticated identity

Supabase provides the authenticated user identity through:

```sql
auth.uid()
```

The application must not implement its own password authentication system.

---

# 9. Protected Routes

Authenticated pages must verify that the user has a valid session.

Examples include:

```text
/dashboard
/groups
/groups/[groupId]
```

Unauthenticated users must not gain access to protected application data.

Route protection should be implemented using the existing Next.js/Supabase authentication architecture.

---

# 10. Database

The Phase 1 database consists of the following primary application tables:

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

The application should not recreate authentication users in PostgreSQL.

---

# 11. Entity Relationships

The high-level relationship is:

```text
auth.users
     │
     │ 1:1
     ▼
profiles
     │
     │
     ├───────────────┐
     │               │
     ▼               ▼
 groups        group_members
     │               │
     │               │
     └───────┬───────┘
             │
             ▼
          expenses
             │
             ▼
       expense_splits
             │
             ▼
        settlements
```

A user can belong to multiple groups.

A group can contain multiple users.

A group can contain multiple expenses.

An expense can be split among multiple group members.

Settlements reduce outstanding balances.

---

# 12. Profiles

`profiles` represents application-level user information associated with Supabase Auth.

Conceptually:

```text
auth.users
     │
     ▼
profiles
```

The application should use the authenticated user's ID as the identity reference.

Only necessary profile information should be exposed to other users.

Sensitive authentication data remains managed by Supabase Auth.

---

# 13. Groups

A group represents a collection of users sharing expenses.

Examples:

```text
Goa Trip
Flatmates
Weekend Trip
Office Lunch
```

A group has:

* Identity
* Name
* Creator/owner relationship according to the implemented schema
* Members
* Expenses
* Derived balances

The exact schema must follow the existing database implementation.

---

# 14. Group Membership

`group_members` represents the many-to-many relationship between users and groups.

Conceptually:

```text
users
  │
  ├───────────────┐
  ▼               ▼
group_members ← groups
```

A user can belong to multiple groups.

A group can contain multiple users.

Membership should be unique.

The database should prevent duplicate membership records.

---

# 15. Group Creation

The intended group-creation flow is:

```text
Authenticated User
       │
       ▼
Create Group
       │
       ▼
Create Initial Membership
       │
       ▼
User becomes group owner/member
```

The exact ownership model depends on the current schema.

Authorization must not rely solely on client-side checks.

RLS must enforce the database boundary.

---

# 16. Adding Group Members

The initial member-management flow allows an authorized group user to add an existing Splitly user.

Conceptually:

```text
Group
  │
  ▼
Add people
  │
  ▼
Find existing profile
  │
  ▼
Verify authorization
  │
  ▼
Create group_members row
```

The application should:

1. Authenticate the current user.
2. Verify that the user has permission to add members.
3. Find the intended existing user.
4. Verify that the user is not already a member.
5. Add the membership.
6. Refresh the group member list.

Do not automatically create accounts during this process.

Email invitations can be implemented separately in a later phase.

---

# 17. Expenses

An expense represents money spent for a group.

Examples:

```text
Dinner
Hotel
Groceries
Taxi
Movie tickets
```

An expense should belong to a group and identify the payer.

The expense total is distributed through `expense_splits`.

---

# 18. Expense Splits

`expense_splits` represents how an expense is divided among participants.

Conceptually:

```text
Expense
   │
   ├── Participant A → ₹500
   ├── Participant B → ₹300
   └── Participant C → ₹200
```

The split amounts should follow the application's supported split rules.

The total of the splits must reconcile with the expense total after applying documented rounding rules.

---

# 19. Settlements

A settlement represents money paid to reduce or clear an outstanding balance.

Conceptually:

```text
User A
  │
  │ ₹500
  ▼
User B
```

Settlements affect derived balances.

They should not modify historical expense amounts.

---

# 20. Balance Model

Balances are derived data.

Do not create a persistent `balances` table solely to cache dashboard balances unless a future architectural decision explicitly requires it.

Conceptually:

```text
Expenses
    +
Expense Splits
    -
Settlements
    =
Current Balances
```

For an individual user:

```text
Net Balance
=
Money owed to user
-
Money user owes
```

A positive balance means money is owed to the user.

A negative balance means the user owes money.

Zero means the user is settled.

---

# 21. Financial Precision

Financial calculations must be deterministic.

Avoid unsafe floating-point arithmetic for money.

Where appropriate, represent currency using integer minor units.

For example:

```text
₹125.50
```

may be represented as:

```text
12550 paise
```

The exact representation should follow the implemented database/application model.

Rounding rules must be explicit.

Financial totals must reconcile.

---

# 22. Row Level Security

RLS is a core security mechanism.

RLS must remain enabled on application tables containing user/group financial data.

Policies must enforce:

* User identity
* Group membership
* Group ownership/admin privileges where applicable
* Appropriate member-management permissions
* Data isolation between unrelated users/groups

Never disable RLS to solve application errors.

---

# 23. RLS Policy Principles

Policies should follow least privilege.

Conceptually:

```text
User
 │
 ├── Can access own profile
 │
 ├── Can access groups they belong to
 │
 ├── Can access members of authorized groups
 │
 ├── Can access expenses belonging to authorized groups
 │
 └── Can perform mutations only when authorized
```

Authorization must ultimately be enforced by the database security model.

---

# 24. `auth.uid()`

RLS policies should use the authenticated user's identity where appropriate.

For example:

```sql
(auth.uid() = user_id)
```

or a membership/ownership check derived from the appropriate relationship.

Never trust a user ID supplied by the browser without verifying it against the authenticated session.

---

# 25. RLS and Group Membership

Access to group-level information should generally depend on group membership.

Conceptually:

```text
Current User
     │
     ▼
group_members
     │
     ▼
group_id
     │
     ▼
groups / expenses / members
```

The exact SQL must follow the current schema.

Avoid RLS policies that accidentally expose all groups or all users.

---

# 26. RLS and Member Management

Adding members is a privileged operation according to the application's group authorization model.

The database must enforce who can add members.

Do not rely solely on:

```text
if (isOwner) {
   ...
}
```

in client-side React code.

Client checks are UX.

RLS/database authorization is security.

---

# 27. Profile Privacy

User lookup must expose only the information necessary for the requested operation.

For example, an add-member flow may need:

```text
display name
email
user ID
```

but should not expose unrelated profile data.

Do not create a public user directory simply to implement email-based group membership.

---

# 28. Data Access

Keep Supabase access behind application boundaries where practical.

Conceptually:

```text
UI
 ↓
Server Action / Route / Application Logic
 ↓
Data Access
 ↓
Supabase
```

This allows:

* Better testing
* Cleaner separation
* Easier error handling
* Consistent authorization handling

---

# 29. Forms

All important application forms use:

```text
React Hook Form
        +
Zod
```

Examples:

```text
Signup
Login
Create Group
Add Person
Add Expense
Settlement
```

Standard flow:

```text
User Input
    ↓
React Hook Form
    ↓
Zod Validation
    ↓
Server Boundary
    ↓
Server Validation
    ↓
Supabase
    ↓
PostgreSQL + RLS
```

Client-side validation does not replace server/database validation.

---

# 30. Validation

Zod schemas should define application input rules.

Important schemas should be reusable.

Examples:

```text
src/lib/validations/auth.ts
src/lib/validations/groups.ts
src/lib/validations/expenses.ts
src/lib/validations/settlements.ts
```

The same domain rule should not be duplicated across multiple UI components.

---

# 31. Testing Architecture

Splitly uses Jest.

Testing is layered:

```text
                 Tests
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
       Unit    Component   Integration
        │          │          │
        ▼          ▼          ▼
     Business     User      Supabase /
      Logic     Behavior    Database
```

The objective is meaningful confidence, not maximum test count.

---

# 32. Unit Testing

Unit tests should cover isolated business logic.

Priority areas:

```text
Balances
Expense splitting
Settlements
Financial calculations
Validation
Utility functions
```

Tests should be deterministic and independent.

---

# 33. Component Testing

Component tests should focus on user-visible behavior.

Examples:

```text
User opens Add Person
        ↓
Dialog appears

User enters invalid email
        ↓
Validation error appears

User submits valid email
        ↓
Member-add operation is triggered
```

Avoid testing implementation details.

---

# 34. Form Testing

Important forms should test:

* Valid input
* Invalid input
* Validation errors
* Submission behavior
* Loading state
* Server errors
* Success state
* Duplicate submission prevention where applicable

Do not test React Hook Form itself.

Do not test Zod itself.

Test Splitly's implementation using those libraries.

---

# 35. RLS Testing Strategy

Jest cannot prove PostgreSQL RLS correctness when Supabase is mocked.

Therefore:

### Jest

Tests:

* Application authorization behavior
* Data-access behavior
* Error handling
* UI behavior for unauthorized responses

### Integration/database tests

Where a suitable test environment exists, verify:

* Group isolation
* Membership access
* Unauthorized group access
* Member-management permissions
* Expense access
* Cross-user data isolation

Never weaken production RLS to make tests easier.

---

# 36. Regression Testing

Important bugs should produce regression tests.

Preferred process:

```text
Bug
 ↓
Reproduce
 ↓
Failing test
 ↓
Fix
 ↓
Passing test
 ↓
Regression suite
```

---

# 37. Test Coverage

Coverage should prioritize:

```text
Financial logic
Validation
Authorization
Critical user flows
Error handling
```

100% coverage is not a requirement.

Tests should provide meaningful confidence rather than inflate coverage metrics.

---

# 38. Dashboard

The dashboard provides a high-level view of the authenticated user's activity.

Primary sections include:

```text
Welcome
Balance Summary
Recent Expenses
Your Groups
Who Owes Whom
Add Expense
```

Dashboard data should be derived from existing application data.

Do not create dashboard-specific database tables.

---

# 39. Groups Dashboard Section

The dashboard's Groups section is a summary.

Each group can display:

* Group name
* Member count
* User's group balance
* Balance state
* Navigation to the group

The dashboard should not contain full group-management functionality.

The full Groups experience belongs under:

```text
/groups
/groups/[groupId]
```

---

# 40. Group Details

The group details page provides:

* Group information
* Members
* Add people
* Balance summary
* Expenses
* Relevant group actions

Example:

```text
/groups/[groupId]
```

Only authorized group users should be able to access the group's information.

---

# 41. UI Architecture

Shared UI components belong under:

```text
src/components/ui/
```

Domain components belong under areas such as:

```text
src/components/dashboard/
src/components/groups/
src/components/expenses/
```

Components should remain reusable and composable.

---

# 42. Design System

The project has a separate UI/design specification.

That document is the source of truth for:

* Colors
* Typography
* Font sizes
* Spacing
* Buttons
* Inputs
* Forms
* Cards
* Dialogs
* Responsive behavior
* Accessibility

System architecture should not duplicate detailed visual specifications.

---

# 43. Error Handling

Application errors should be categorized.

Common categories:

```text
Validation
Authentication
Authorization
Not Found
Database
Unexpected
```

User-facing errors should be understandable.

Never expose:

* SQL
* Stack traces
* Secrets
* Service-role credentials
* Internal Supabase details

---

# 44. Loading and Empty States

Important application sections should define:

* Loading state
* Empty state
* Error state

Examples:

```text
No groups yet
No expenses yet
You're all settled up
No matching user found
```

These states should use the project's UI/design standards.

---

# 45. Responsive Design

All pages must support:

```text
Mobile
Tablet
Desktop
```

Responsive behavior should be designed rather than simply shrinking desktop layouts.

---

# 46. Accessibility

User-facing functionality should support:

* Keyboard navigation
* Screen readers
* Visible focus
* Semantic HTML
* Accessible form labels
* Accessible validation messages
* Accessible dialogs

Accessibility should be considered during implementation, not added as an afterthought.

---

# 47. Security Principles

Splitly follows:

```text
Least privilege
Defense in depth
Server-side validation
Database-level authorization
RLS
Minimal data exposure
No secrets in client code
```

Never rely on UI hiding to enforce authorization.

---

# 48. Environment Variables

Secrets and environment-specific configuration must be provided through environment variables.

Never commit:

```text
.env
.env.local
```

when they contain secrets.

Never hard-code:

* Supabase service-role keys
* API secrets
* Database credentials
* Authentication secrets

Only variables explicitly intended for browser exposure may be used client-side.

---

# 49. Deployment

Production deployment uses Vercel.

The application should be deployable without a separate backend service.

Supabase remains the external backend/data platform.

---

# 50. Database Migrations

Database changes must be reproducible.

When schema or RLS changes are required:

1. Create a migration.
2. Apply the migration in the development environment.
3. Verify the resulting schema/policies.
4. Test relevant behavior.
5. Keep the migration in version control.

Do not rely on undocumented manual dashboard changes for production-critical schema.

---

# 51. Architecture Decision Rule

Before introducing a new service, ask:

```text
Can the requirement be implemented safely within
the existing Next.js + Supabase architecture?
```

If yes, prefer the existing architecture.

A separate microservice requires explicit justification.

---

# 52. Performance

Prefer:

* Server-side data fetching where appropriate
* Efficient Supabase queries
* Minimal client-side JavaScript
* Reusable components
* Avoiding unnecessary requests
* Avoiding unnecessary re-renders

Do not prematurely optimize.

Correctness and maintainability come first.

---

# 53. Observability

Errors should be diagnosable without exposing sensitive information to users.

Avoid logging:

* Passwords
* Authentication tokens
* Service-role keys
* Sensitive personal information
* Financial information unnecessarily

Use appropriate error logging for production diagnostics as the application evolves.

---

# 54. Future Architecture

The system may evolve as Splitly grows.

Potential future additions include:

* Email invitations
* Notifications
* Advanced expense splitting
* Recurring expenses
* Settlement workflows
* Analytics
* Background jobs
* Caching
* Dedicated services

These should not be introduced prematurely.

The current architecture should remain simple until actual requirements justify additional infrastructure.

---

# 55. Definition of Done

A feature is architecturally complete when:

* It follows the existing Next.js architecture.
* It uses Supabase appropriately.
* Authentication is respected.
* RLS is respected.
* Validation is implemented.
* Important business logic is tested.
* Important user behavior is tested.
* Financial logic has appropriate coverage.
* Database changes are reproducible.
* No unnecessary infrastructure is introduced.
* Existing functionality remains intact.

---

# 56. Core Architecture Principle

Splitly should follow:

```text
Simple architecture
        +
Strong database security
        +
Reusable UI
        +
Type-safe validation
        +
Meaningful automated tests
        =
Maintainable application
```

Prefer the simplest architecture that safely satisfies the current product requirements.
