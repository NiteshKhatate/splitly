# Splitly — AGENTS.md Mobile-First UI Update

## Current Development Mode

The current development phase is **Mobile-First UI / UX**.

The purpose of this phase is to improve the existing Splitly interface so that it is intentionally designed for mobile first and progressively enhanced for tablet and desktop.

The existing product functionality and workflows are already established.

> **Keep how Splitly works the same; improve how Splitly looks, feels, and is used.**

---

## 1. Functionality and Workflow Freeze

Existing functionality and workflows are frozen during this phase.

Do not change:

- Business logic
- Financial calculations
- Expense calculations
- Split calculations
- Balance calculations
- Settlement calculations
- Authentication behavior
- Authorization rules
- Permissions
- Validation rules
- Database schema
- Prisma models
- Database migrations
- API contracts
- Server actions
- Existing routes
- Existing product capabilities
- Existing workflow order
- Existing data behavior

Do not add new product features as part of mobile-first UI work.

Do not redesign an existing workflow.

The existing workflow is the source of truth. The UI should adapt to the workflow, not redefine it.

---

## 2. UI/UX Scope

Allowed changes include:

- Mobile-first responsive layouts
- Tablet and desktop responsive layouts
- Typography
- Spacing
- Visual hierarchy
- Component styling
- Navigation presentation
- Form presentation
- Modal/dialog presentation
- Toast presentation
- Loading states
- Empty states
- Error states
- Touch interaction
- Accessibility
- Responsive lists/tables
- Reusable UI components
- Visual consistency

A change is in scope when it improves presentation or interaction without changing underlying product behavior.

---

## 3. Mobile-First Rules

Mobile is the base layout.

Use mobile-first Tailwind patterns:

- Base classes represent the small-screen experience.
- Use `sm:`, `md:`, `lg:`, and larger breakpoints for progressive enhancement.
- Do not build desktop first and squeeze it into mobile.
- Avoid unnecessary horizontal scrolling.
- Do not make important content or controls unreasonably small.
- Prefer stacking and wrapping over cramped layouts.
- Keep existing primary actions easy to reach.
- Preserve access to all existing functionality.

Design progression:

```text
Mobile baseline
      ↓
Tablet enhancement
      ↓
Desktop enhancement
```

---

## 4. Information Hierarchy

For each existing screen:

1. Identify the most important information already present.
2. Present it first on mobile.
3. Make the existing primary action obvious.
4. Reduce unnecessary visual density.
5. Use progressive disclosure for secondary information where appropriate.
6. Never remove existing functionality simply to simplify the mobile layout.

Do not invent a new workflow.

---

## 5. Mobile Navigation

Adapt the existing navigation for mobile.

Navigation should:

- Be easy to reach.
- Have comfortable touch targets.
- Clearly indicate the current location.
- Preserve all existing destinations.
- Keep frequent existing actions easy to access.
- Avoid squeezing desktop navigation into a narrow viewport.

A compact bottom navigation may be used where appropriate if it maps to existing destinations and behavior.

---

## 6. Mobile Forms

Optimize existing forms for mobile.

Prefer:

- Single-column layouts.
- Clear vertical progression.
- Readable labels.
- Comfortable input sizes.
- Appropriate spacing.
- Mobile-friendly input types.
- Clear validation messages.
- Easy-to-reach primary actions.
- Visible loading states.

Do not change:

- Submitted fields
- Validation rules
- Server actions
- API contracts
- Business logic
- Persistence behavior

For forms inside modals:

- Keep the modal open while submission is pending.
- Keep it open after a failed submission.
- Preserve entered values after failure.
- Show the existing error clearly.
- Only reset/close after confirmed success, according to the existing workflow.

---

## 7. Expense and Split UI

Improve the presentation of existing expense and split workflows without changing them.

Existing information such as amount, description, date, payer, split method, participants, split configuration, receipt, and submit/review controls should remain accessible.

All existing split methods must remain available.

Do not change:

- Split semantics
- Calculation behavior
- Participant behavior
- Financial values
- Validation rules

---

## 8. Dense Data

For existing expense history, activity, members, balances, and similar views:

- Do not simply shrink desktop tables.
- Use responsive lists, stacked rows, cards, or progressive disclosure where appropriate.
- Keep important existing information accessible.
- Do not change filtering, sorting, pagination, calculations, or data-loading behavior merely for visual reasons.

---

## 9. Modals and Dialogs

Existing dialogs should adapt to small screens.

Appropriate mobile presentations may include:

- Full-width dialogs
- Near-full-width dialogs
- Bottom sheets
- Full-screen presentation

Ensure:

- Primary actions remain visible.
- Close/cancel controls are easy to use.
- Content is not cramped.
- Scrolling remains usable.
- Focus management remains accessible.

Do not change what the dialog does.

---

## 10. Toasts and Feedback

Improve the presentation of existing success/error feedback.

Toasts should:

- Be readable on mobile.
- Stay within the viewport.
- Avoid covering critical controls.
- Use consistent positioning.
- Be accessible.
- Represent actual existing outcomes.

For forms:

> Success feedback is shown only after a successful response.

> Failure must not reset or close the form/modal.

---

## 11. Touch and Accessibility

Design controls for touch-first use.

Pay attention to:

- Buttons
- Links
- Icon buttons
- Menus
- Checkboxes
- Radio controls
- Selectors
- Date controls
- Participant selectors
- Dialog controls
- Destructive actions

Preserve or improve:

- Semantic HTML
- Keyboard navigation
- Focus states
- Screen-reader labels
- Form error associations
- Dialog focus management
- Toast accessibility
- Color contrast
- Touch target sizing

Do not trade accessibility for compactness.

---

## 12. Reusable Components

Before creating a UI component:

1. Inspect existing shared components.
2. Search for an existing equivalent.
3. Reuse it where possible.
4. Extend shared components when the pattern is genuinely reusable.
5. Avoid page-specific duplicate styling.

Use existing design tokens and visual patterns.

---

## 13. Progressive Desktop Enhancement

After the mobile baseline is correct, enhance larger viewports.

Tablet and desktop may use:

- Multiple columns
- Wider containers
- Side-by-side sections
- Expanded navigation
- More efficient information density

The underlying workflow must remain the same.

---

## 14. Implementation Discipline

For each screen:

1. Inspect the existing implementation.
2. Understand the existing workflow.
3. Do not modify the workflow.
4. Identify mobile UI problems.
5. Implement the mobile baseline.
6. Improve touch interaction.
7. Improve accessibility.
8. Add tablet enhancement.
9. Add desktop enhancement.
10. Check shared components for consistency.

Do not perform unrelated refactoring.

---

## 15. Verification Boundary

Testing/review should happen after the UI implementation.

The review should verify:

- Mobile layout
- Responsive behavior
- Touch usability
- Accessibility
- Visual consistency
- No accidental horizontal overflow
- Existing workflows still function as before

This is regression verification, not workflow redesign.

---

## 16. Mobile-First Definition of Done

A UI task is complete when applicable:

- [ ] Mobile is the intentional baseline.
- [ ] The screen works at narrow mobile widths.
- [ ] No accidental horizontal overflow exists.
- [ ] Primary existing actions are easy to reach.
- [ ] Touch targets are comfortable.
- [ ] Typography remains readable.
- [ ] Forms are comfortable on mobile.
- [ ] Modal/dialog presentation works on mobile.
- [ ] Loading/empty/error/success states are clear.
- [ ] Accessibility is preserved/improved.
- [ ] Tablet presentation is coherent.
- [ ] Desktop progressively enhances the mobile baseline.
- [ ] Existing components/tokens are reused.
- [ ] No unrelated feature was introduced.
- [ ] Existing workflow behavior is unchanged.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
