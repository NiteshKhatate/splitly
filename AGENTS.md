# AGENTS.md — Splitly Engineering Instructions

## 1. Purpose

This file defines how Codex/agents should work on the Splitly repository.

Splitly is an expense-sharing application with financial ledger behavior. Correctness, authorization, data integrity, auditability, and operational safety take priority over feature velocity.

---

## 2. Required Context Before Changes

Before making repository changes:

1. Read this `AGENTS.md`.
2. Read the relevant sections of `docs/BUILD_PLAN.md`.
3. Read the relevant sections of `docs/system-design.md`.
4. Read `docs/RELEASE_CHECKLIST.md` when working on release or production-readiness concerns.
5. Read `docs/OPERATIONS.md` when working on deployment, recovery, monitoring, migrations, or incident procedures.
6. Inspect the existing implementation before introducing new abstractions.

When the build plan is complete, do not assume the application is production-ready. Use the current production-readiness audit and release checklist as the source for hardening work.

---

## 3. Current Development Mode

The MVP build plan has been completed.

The project is now in:

> **Production Hardening / Stabilization**

During production hardening:

- Freeze unrelated feature work.
- Work from the documented remediation backlog.
- Do not add unrelated product capabilities.
- Prefer small, verifiable remediation batches.
- Re-run the relevant tests and audit after meaningful batches.
- Do not declare an operational requirement complete without evidence.

The current remediation priority is defined in the **2026-09-09 Splitly Production-Readiness Audit** and the corresponding production-hardening plan.

---

## 4. Priority Order

When tradeoffs are required, use this order:

1. Financial correctness
2. Security and authorization
3. Database/data integrity
4. Auditability and recoverability
5. Reliability and concurrency safety
6. UX correctness
7. Accessibility
8. Responsiveness
9. Performance
10. Visual polish
11. Developer convenience

Never sacrifice a higher-priority concern to improve a lower-priority one.

---

## 5. Architecture

Use the established architecture:

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase-hosted PostgreSQL
- Prisma ORM
- Auth.js
- React Hook Form
- Zod
- Jest
- Playwright
- GitHub Actions
- Vercel

Preferred application flow:

> Presentation → Application/Server Actions/Route Handlers → Domain Logic → Prisma → PostgreSQL

Keep pages thin.

Business rules belong in reusable server/domain services rather than duplicated inside page components.

Do not introduce a separate backend service or microservice unless explicitly authorized.

---

## 6. Authentication and Authorization

Authentication and authorization are separate concerns.

- Auth.js establishes identity.
- Server-side authorization establishes whether that identity may perform an operation.
- Never trust client-provided user IDs, group IDs, roles, totals, currencies, shares, or permissions.
- Sensitive Prisma queries should independently enforce the current user's authorization where practical.
- Do not assume that a caller has already performed authorization merely because a group ID was passed to a helper.
- Cross-group access must fail safely.
- Authorization must remain enforced even if a route/helper is called directly.

### Redirect security

Authentication redirects must be validated against the application's canonical origin.

Accept only safe internal redirects.

Reject:

- External origins
- `//host`
- Backslash authority forms
- Encoded slash/backslash authority forms
- Control characters
- Other URL-normalization tricks

Do not rely on simple string-prefix checks.

---

## 7. Database and Prisma

Prisma owns:

- Application schema
- Prisma migrations
- Application database access
- Transaction boundaries

Use:

- `DATABASE_URL` for runtime application access.
- `DIRECT_URL` for Prisma migration/direct-database operations, using the provider's documented direct endpoint.

Do not put secrets in `NEXT_PUBLIC_*` variables.

Do not disable RLS as a workaround.

### Migration ownership

There must be one authoritative migration strategy.

If Prisma owns schema migrations, Supabase-specific RLS, functions, triggers, grants, and related database objects must be incorporated into a deterministic migration process rather than maintained as a conflicting second history.

A blank database must be reproducible.

Before changing migration strategy:

1. Inspect both migration histories.
2. Determine the authoritative chain.
3. Preserve required database security objects.
4. Test a clean database bootstrap.
5. Verify migration status.

---

## 8. Database Transactions

Financially significant writes must be atomic.

Use database transactions for operations such as:

- Expense creation
- Expense modification
- Expense deletion
- Settlement creation/confirmation
- Group creation when creating dependent owner membership/activity records

A multi-record operation must not leave partially committed state.

### Group creation

Group creation must atomically create:

1. Group
2. Owner membership
3. Initial activity event

If any component fails, all changes must roll back.

Do not consider mock-only `$transaction` tests sufficient evidence of real database atomicity.

---

## 9. Financial Data Rules

Money is always represented in integer minor units.

Never use JavaScript floating-point values as the persisted financial representation.

Core invariants include:

- Sum of payments equals expense total.
- Sum of shares equals expense total.
- Group/currency balances reconcile to zero.
- Only confirmed settlements affect balances.

### Currency

For the current MVP, prefer a single authoritative currency per group unless multi-currency accounting has been explicitly designed and tested.

Never combine different currencies in:

- Balance calculations
- Dashboard summaries
- Group cards
- Group detail summaries
- Settlement calculations
- Debt simplification

Server-side currency validation is mandatory.

If supported currencies use different minor-unit exponents, either:

- Restrict Phase 1 to a known set with the same exponent, or
- Implement authoritative currency-exponent metadata throughout parsing, storage, calculation, and formatting.

Never assume every three-letter currency has two decimal places without an explicit product constraint.

---

## 10. Group Membership Invariants

Expense payers, expense participants, share participants, and settlement participants must belong to the relevant group according to the application's membership rules.

Do not rely solely on a pre-insert application query where concurrent membership changes can invalidate the assumption.

Where feasible, enforce membership integrity through:

- Database constraints/triggers, or
- Appropriate transaction isolation and locking/revalidation.

Add real integration tests for membership race conditions when changing this boundary.

---

## 11. Concurrency and Idempotency

Financial writes must account for retries and concurrent operations.

For editable financial records:

- Prefer optimistic concurrency/version checks.
- Revalidate deletion state inside the mutation.
- Reject stale updates rather than silently applying last-write-wins behavior.

For submissions that can be retried:

- Use an idempotency key or stable submission token where duplicate financial records would be harmful.
- Back idempotency with a database uniqueness constraint when appropriate.

Button disabling alone is not sufficient protection against network retries.

---

## 12. Split Methods

Supported split methods must preserve their semantics:

- Equal
- Exact
- Percentage
- Shares/Weights

Deterministic rounding is required.

When editing an expense without changing the financial allocation method:

- Preserve the original split method.
- Preserve or reconstruct the inputs needed for that method.
- Do not silently convert Equal, Percentage, or Shares/Weights into Exact.

A description-only edit must not rewrite financial metadata.

---

## 13. Validation

Use React Hook Form for client form state.

Use Zod for:

- Client-side validation where appropriate.
- Server-side validation.
- Financial payload validation.
- Currency validation.
- Participant limits.
- Receipt metadata validation.

Never rely only on client-side validation.

Validation limits should reflect documented product constraints.

---

## 14. UI and Design System

The existing Splitly UI and design system are authoritative.

Reuse existing:

- Buttons
- Inputs
- Form controls
- Cards
- Modals
- Navigation
- Typography
- Spacing
- Radius
- Shadows
- Status patterns

Do not require the user to restate CSS or design requirements for every UI change.

When fixing UI consistency issues:

- Preserve the existing visual direction.
- Reconcile implementation with `docs/system-design.md`.
- Do not perform an unrelated visual redesign.
- Ensure desktop and mobile behavior remain coherent.
- Preserve accessibility.

Every meaningful workflow should account for:

- Loading
- Empty
- Error
- Unauthorized
- Success
- Destructive confirmation states where applicable

---

## 15. Data Access and Performance

Avoid unnecessary repeated ledger queries.

For dashboard and balance views:

- Reuse authorized data-loading boundaries.
- Aggregate in SQL when appropriate.
- Paginate historical data.
- Avoid silently truncating financial history.

If a query uses a hard limit such as `take: 100`, provide pagination or an explicit indication that more records exist.

For performance-sensitive indexes:

1. Inspect actual query patterns.
2. Use representative data volumes.
3. Validate with `EXPLAIN ANALYZE`.
4. Add indexes based on evidence rather than speculation.

---

## 16. Receipt and File Handling

Receipt uploads must not rely solely on browser-provided MIME metadata.

Where practical:

- Validate file signatures.
- Enforce size limits.
- Restrict allowed file types.
- Normalize images before serving when appropriate.
- Keep receipt authorization tied to the relevant expense/group.

Storage deletion and database metadata deletion must be designed for recoverability and retry.

If a storage operation and database operation cannot be truly atomic, use a state/reconciliation strategy rather than assuming both operations always succeed.

Receipt backups must be included in production recovery planning.

---

## 17. Request Limits and Abuse Protection

Application request-size limits must not depend solely on `Content-Length`.

Account for:

- Missing `Content-Length`
- Chunked requests
- Multipart uploads
- Platform-level limits

Enforce participant-count limits on financial payloads at validation/business boundaries.

Rate-limit data should have an explicit retention/cleanup strategy.

---

## 18. Security Headers and Monitoring

Production security headers must be deliberate.

Review:

- Content Security Policy
- Strict-Transport-Security
- Frame protection
- MIME sniffing protection
- Referrer policy
- Other established security headers

Avoid unnecessary CSP weakening such as broad `unsafe-inline` script allowances where a nonce/hash-compatible approach is practical.

Unexpected server errors must reach the configured monitoring boundary.

Monitoring requests must have short timeouts and must not block user-facing error handling indefinitely.

Never log:

- Passwords
- Session secrets
- Access tokens
- Database credentials
- Sensitive financial payloads beyond what is required for safe diagnostics

---

## 19. Testing Strategy

### Jest

Use Jest for:

- Domain logic
- Split calculations
- Validation
- Authorization logic
- Service behavior
- Unit/integration logic that does not require a real external database

### Real database integration tests

Mocks are not sufficient for proving:

- PostgreSQL transactions
- Constraints
- Triggers
- Grants
- RLS
- Cross-user isolation
- Concurrency behavior

Use a disposable real PostgreSQL/Supabase-compatible environment for these cases.

### Playwright

Use Playwright for critical end-to-end workflows.

Authenticated critical flows must run in CI and must not silently skip because credentials are missing.

Critical workflows include, as applicable:

- Authentication
- Group creation
- Membership
- Expense creation
- Expense editing
- Expense deletion
- Settlement confirmation
- Membership isolation
- Receipt workflows

Run critical authenticated flows on appropriate desktop and mobile projects.

---

## 20. CI/CD

GitHub Actions is responsible for CI.

At minimum, CI should verify:

- Install
- Lint
- Typecheck
- Prisma validation
- Unit/integration tests
- Production build
- Relevant E2E tests
- Database migration/bootstrap checks where configured

Vercel is responsible for application deployment.

Do not create a duplicate GitHub deployment system if Vercel Git integration already owns deployments.

### Release ordering

Production deployment must have an explicit migration strategy.

The intended release sequence should be documented and tested:

1. Preflight
2. Backup/snapshot where applicable
3. Database migration
4. Migration verification
5. Application deployment
6. Smoke tests
7. Rollback/incident ownership

Never claim that manual instructions alone guarantee migration-before-code ordering.

---

## 21. Production Recovery

Production readiness requires demonstrable recoverability.

Documentation alone is insufficient.

A completed recovery requirement must include:

- Backup strategy
- Retention policy
- Access controls
- Restore procedure
- Disposable restoration drill
- Financial reconciliation
- Receipt-object verification
- Recorded evidence
- Owner/reviewer

Do not mark recovery complete until a real restoration drill succeeds.

---

## 22. Documentation Integrity

Documentation must describe the actual implementation.

Never mark a capability complete when:

- The schema is absent.
- The workflow is absent.
- Authorization is absent.
- Tests are absent where required.
- Operational evidence is missing.

If the implementation and build plan disagree:

1. Inspect the implementation.
2. Determine intended scope.
3. Either implement the requirement in an explicitly authorized remediation phase or defer it.
4. Update the documentation to match reality.
5. Do not silently inflate completion status.

---

## 23. Production Hardening Workflow

When working from the production-readiness audit:

1. Read the audit and identify the highest-priority unresolved finding.
2. Inspect relevant code, schema, tests, and documentation.
3. Reproduce the issue where practical.
4. Design the smallest safe remediation.
5. Implement the remediation.
6. Add regression tests.
7. Add real integration/E2E coverage where mocks are insufficient.
8. Run the relevant validation suite.
9. Run the broader validation suite when the change affects shared infrastructure.
10. Update operational/release documentation only when evidence supports the change.
11. Report unresolved items explicitly.

Do not fix a lower-priority issue by introducing a higher-priority security or financial risk.

---

## 24. Current Production-Hardening Priority

The first remediation batch is:

### Critical

1. **Mixed-currency balance isolation**
2. **Backup/PITR and verified restoration**

### High

3. **Atomic group creation**
4. **Authentication redirect hardening**
5. **Real PostgreSQL/Supabase transaction and RLS integration testing**

After Batch 1, proceed through the remaining audit findings in their documented priority order.

---

## 25. Definition of Done

A change is done only when applicable:

- [ ] Implementation complete
- [ ] Server validation complete
- [ ] Authorization verified
- [ ] Database integrity verified
- [ ] Required migration created
- [ ] Regression tests added
- [ ] Integration tests added where required
- [ ] E2E tests added where required
- [ ] UI states handled
- [ ] Accessibility preserved
- [ ] Mobile and desktop behavior verified
- [ ] Lint passes
- [ ] Typecheck passes
- [ ] Jest passes
- [ ] Production build passes
- [ ] Relevant Playwright tests pass
- [ ] Documentation matches implementation
- [ ] Operational evidence exists for operational requirements

---

## 26. Important Prohibitions

Do not:

- Disable RLS to make an operation work.
- Trust client-provided identity or authorization.
- Store money as floating-point database values.
- Combine different currencies.
- Use client-only validation for financial operations.
- Treat mocked transactions as proof of database atomicity.
- Silently skip critical authenticated tests in CI.
- Claim backups/recovery are complete without a restoration drill.
- Deploy schema-dependent code without an explicit migration strategy.
- Rewrite financial metadata during unrelated expense edits.
- Add unrelated product features during production hardening.
- Perform a UI redesign when a consistency fix is required.
- Commit secrets.
- Expose secrets through `NEXT_PUBLIC_*` variables.
- Invent evidence or claim a test passed when it was not run.

---

## 27. Final Principle

For Splitly:

> **Simple architecture + strong domain rules + transactional writes + explicit authorization + recoverable data + real database testing + reusable UI + automated verification**

A passing build is necessary, but it is not sufficient for production readiness.


---

## 28. Mobile-First Design Mode

The current UI work may include a **Mobile-First UX / Responsive Hardening** phase.

When this phase is active, mobile is the baseline experience. Do not treat mobile as a smaller version of the desktop UI.

The goal is:

> **Design the simplest useful mobile experience first, then progressively enhance it for tablet and desktop.**

Follow the mobile-first requirements documented in `docs/BUILD_PLAN.md`.

Do not perform a broad visual redesign merely because the project is entering mobile-first work. Preserve the established Splitly visual direction, design tokens, components, and product information architecture unless the build plan explicitly requires a change.

---

## 29. Mobile-First Responsive Layout

Use mobile-first responsive implementation patterns.

Rules:

- Base Tailwind classes should represent the small-screen layout.
- Use `sm:`, `md:`, `lg:`, and larger breakpoints to progressively enhance the layout.
- Do not build a desktop layout first and then attempt to squeeze it into mobile.
- Avoid unnecessary horizontal scrolling.
- Content must remain readable and usable at narrow widths.
- Do not solve responsive problems by making text, controls, or important information unreasonably small.
- Use flexible widths, wrapping, stacking, and appropriate responsive grids.
- Preserve the same underlying product information while adapting its presentation to the available space.

Responsive behavior must be intentional at each major breakpoint.

---

## 30. Mobile-First Information Hierarchy

Small screens require prioritization.

For each screen:

- Identify the primary user goal.
- Make the most important information visible first.
- Make the primary action obvious and easy to reach.
- Move secondary information/actions into appropriate progressive disclosure.
- Do not simply hide important functionality on mobile.
- Do not overload the first viewport with desktop-level information density.

For Splitly, prioritize core financial workflows such as:

- viewing balances,
- viewing groups,
- adding expenses,
- reviewing splits,
- settling debts,
- viewing recent activity.

---

## 31. Mobile Navigation

Mobile navigation must be designed as a mobile interaction pattern rather than a collapsed desktop sidebar.

Where appropriate:

- Use compact navigation.
- Keep primary destinations easy to reach.
- Provide an obvious path to the primary expense-creation action.
- Ensure navigation controls have comfortable touch targets.
- Preserve access to account/profile and important secondary destinations.
- Avoid requiring users to navigate through multiple menus for frequent actions.

Follow the navigation structure defined in `docs/BUILD_PLAN.md` and the existing application information architecture.

---

## 32. Mobile Forms

Forms are first-class mobile workflows.

For mobile form layouts:

- Prefer a single-column flow by default.
- Use clear vertical progression between related fields.
- Keep labels and inputs readable.
- Use appropriate input types for mobile keyboards.
- Keep primary submit actions easy to reach.
- Avoid cramped multi-column forms.
- Avoid placing unrelated controls side-by-side solely to save vertical space.
- Preserve validation, error, loading, and success states.

Complex Splitly expense/split forms should progressively reveal configuration rather than presenting every possible option simultaneously.

Do not remove functionality solely to simplify the mobile layout.

---

## 33. Mobile Expense and Split Workflows

The expense workflow is a primary mobile use case.

Design the mobile flow around a clear progression such as:

1. Amount
2. Description
3. Paid by
4. Split method
5. Participants
6. Split configuration
7. Receipt
8. Review/submit

The exact component structure may differ, but the user should be able to understand where they are in the process.

For split methods:

- Equal
- Exact
- Percentage
- Weighted

show only the configuration needed for the selected method where practical.

Never change the underlying financial semantics merely to simplify the UI.

---

## 34. Mobile Tables and Dense Data

Do not force desktop tables onto narrow screens when they become difficult to use.

For dense financial data:

- Prefer cards, list rows, stacked metadata, or responsive table transformations where appropriate.
- Preserve all important financial information.
- Keep amount, payer, participant/share information, and status understandable.
- Provide access to secondary actions without creating tiny adjacent controls.
- Avoid requiring horizontal scrolling for primary financial workflows.

If horizontal scrolling is genuinely the most appropriate representation for a specific dataset, make it deliberate and usable rather than accidental.

---

## 35. Mobile Modals and Dialogs

Dialogs must be appropriate for small screens.

For mobile:

- Avoid cramped fixed-size desktop dialogs.
- Use full-width or full-screen/sheet-like presentation where appropriate.
- Ensure content remains accessible without awkward nested scrolling.
- Keep primary actions visible and usable.
- Preserve keyboard/focus accessibility.
- Maintain the existing confirmed-response form lifecycle.

For forms inside modals:

- Keep the modal open while submission is pending.
- Close only after confirmed success.
- Reset the form only after confirmed success.
- On failure, keep the modal open and preserve entered values where practical.

---

## 36. Touch Interaction

Interactive controls must be comfortable to use on touch devices.

Review:

- buttons,
- links,
- icon buttons,
- menus,
- checkboxes,
- radio controls,
- dropdowns,
- date controls,
- participant selectors,
- modal controls.

Rules:

- Avoid tiny tap targets.
- Avoid tightly packed adjacent destructive actions.
- Provide sufficient spacing between interactive controls.
- Do not depend on hover to reveal essential functionality.
- Ensure important actions remain usable without a mouse.

---

## 37. Mobile States

Every meaningful mobile workflow must account for:

- loading,
- empty,
- error,
- unauthorized,
- success,
- pending submission,
- destructive confirmation where applicable.

States must remain understandable at small widths.

Do not allow loading/error/empty states to collapse into broken or ambiguous layouts.

---

## 38. Mobile Accessibility

Mobile-first work must preserve or improve accessibility.

Verify:

- readable text,
- sufficient contrast,
- semantic controls,
- visible focus where applicable,
- keyboard accessibility,
- screen-reader labels,
- modal focus management,
- form error association,
- accessible toast behavior,
- usable touch targets.

Do not trade accessibility for visual compactness.

---

## 39. Progressive Desktop Enhancement

Desktop layouts should enhance the mobile baseline.

As viewport width increases, use additional space for:

- columns,
- richer contextual information,
- side-by-side sections,
- larger navigation,
- denser but still readable data presentation,
- additional secondary actions.

Do not create a fundamentally different product workflow on desktop unless there is a strong usability reason.

The same core task should remain recognizable across mobile, tablet, and desktop.

---

## 40. Mobile-First Review Discipline

When implementing a mobile-first change:

1. Inspect the existing component and its surrounding workflow.
2. Identify the primary mobile user goal.
3. Design the small-screen structure first.
4. Implement the base mobile layout.
5. Add responsive enhancements for larger screens.
6. Check loading, empty, error, unauthorized, and success states.
7. Check touch interaction and accessibility.
8. Check that existing desktop behavior remains coherent.
9. Search for similar components and workflows to avoid inconsistent patterns.

Do not perform a repository-wide visual rewrite unless explicitly requested.

---

## 41. Mobile-First Definition of Done

A mobile-first UI task is complete only when applicable:

- [ ] Mobile layout is the intentional baseline.
- [ ] Core workflow is usable at small viewport widths.
- [ ] No accidental horizontal overflow exists.
- [ ] Primary actions are easy to reach.
- [ ] Touch targets are usable.
- [ ] Forms are comfortable on mobile.
- [ ] Modal forms behave correctly on mobile.
- [ ] Dense financial data remains understandable.
- [ ] Loading/empty/error/success states work at mobile widths.
- [ ] Accessibility is preserved.
- [ ] Tablet layout remains coherent.
- [ ] Desktop layout progressively enhances the mobile baseline.
- [ ] Existing design tokens/components are reused.
- [ ] No unrelated visual redesign was introduced.
- [ ] Documentation reflects the actual implementation.

The final testing/review phase remains separate from implementation unless the current build-plan stage explicitly schedules it.