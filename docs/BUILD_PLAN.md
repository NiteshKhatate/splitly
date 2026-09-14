# Splitly — Mobile-First UI Build Plan

**Status:** Ready to execute  
**Phase:** Mobile-First UI / UX  
**Scope:** Existing UI transformation to mobile-first responsive design  
**Functionality:** Frozen  
**Workflow:** Frozen

---

## 1. Objective

Transform the existing Splitly interface into a polished **mobile-first UI** while preserving the application's existing functionality and workflows.

The workflows are already established.

This phase is about:

> **Improving the interface through which users perform the existing workflows.**

Target progression:

**Mobile → Tablet → Desktop**

Mobile is the baseline.

---

## 2. Scope

### In scope

- Mobile-first responsive layouts
- Tablet and desktop responsive layouts
- UI component improvements
- Spacing
- Typography
- Visual hierarchy
- Responsive navigation
- Mobile-friendly forms
- Mobile-friendly dialogs
- Touch interaction
- Responsive lists/tables
- Loading states
- Empty states
- Error states
- Success feedback
- Toast presentation
- Accessibility
- UI consistency

### Out of scope

Do not change:

- Business logic
- Database schema
- Prisma models
- Database migrations
- API contracts
- Server actions
- Authentication
- Authorization
- Permissions
- Validation rules
- Expense calculations
- Split calculations
- Balance calculations
- Settlement calculations
- Existing routes
- Existing workflows
- Existing product capabilities

Do not add product features.

---

## 3. Workflow Freeze

Existing workflows have already been implemented.

Do not redesign them.

The following remain unchanged:

- Authentication
- Dashboard
- Groups
- Expenses
- Splits
- Balances
- Settlements
- Activity
- Settings

The same workflow should remain:

**existing user intent → existing action → existing processing → existing result**

Only the UI through which the workflow is performed should change.

---

# 4. Mobile-First Design Principles

## 4.1 Mobile is the baseline

Start with the smallest supported viewport.

Do not design desktop first and compress it.

Use:

- Flexible widths
- Stacking
- Wrapping
- Responsive grids
- Appropriate spacing
- Touch-friendly controls

Then progressively enhance larger screens.

## 4.2 Content priority

For each existing screen:

1. Show the most important existing information first.
2. Make the existing primary action obvious.
3. Reduce unnecessary visual density.
4. Use progressive disclosure for secondary information where appropriate.
5. Do not hide important existing functionality.

## 4.3 No accidental horizontal overflow

Primary screens should not require unnecessary horizontal scrolling.

Pay particular attention to:

- Dashboard
- Groups
- Group details
- Expense lists
- Balances
- Forms
- Dialogs
- Navigation

---

# 5. Phase 1 — UI Foundation

Review and improve shared UI primitives.

Focus on:

- Page containers
- Spacing
- Typography
- Buttons
- Inputs
- Selects
- Form fields
- Cards
- Badges
- Dialogs
- Toasts
- Navigation
- Loading indicators
- Empty states
- Error states

### Acceptance criteria

- Existing shared components are reused.
- Mobile spacing is consistent.
- Controls are touch-friendly.
- Typography is readable.
- No unnecessary UI dependency is introduced.

---

# 6. Phase 2 — Mobile Navigation

Adapt the existing navigation for mobile.

Preserve existing destinations.

Prioritize existing destinations such as:

- Dashboard
- Groups
- Activity
- Profile/Settings

Keep the existing primary expense action easy to access.

A compact bottom navigation may be used where appropriate.

### Acceptance criteria

- Existing destinations remain accessible.
- Navigation is comfortable on a phone.
- Current location is clear.
- Touch targets are appropriate.
- Desktop navigation remains coherent.

---

# 7. Phase 3 — Dashboard

Transform the existing dashboard into a mobile-first layout.

Prioritize existing information:

1. Current financial position
2. Important balances
3. Groups
4. Recent activity
5. Existing primary actions

Use a stacked layout by default.

Avoid excessive card density.

### Acceptance criteria

- Important information appears early.
- Numbers remain readable.
- Cards do not overflow.
- Primary existing actions are easy to find.
- Desktop uses additional space without changing functionality.

---

# 8. Phase 4 — Groups

Improve the existing groups experience.

## Groups list

Make each group easy to scan on mobile.

Prioritize existing:

- Group name
- Financial status
- Relevant activity
- Navigation affordance

## Group detail

Prioritize existing:

- Group identity
- User balance
- Add Expense
- Settle Up
- Recent expenses/activity

Secondary actions remain available without dominating the screen.

### Acceptance criteria

- Group information is readable.
- Important actions are easy to reach.
- No horizontal overflow occurs.
- Existing group functionality remains unchanged.

---

# 9. Phase 5 — Expense Creation UI

Improve the existing expense form for mobile.

Use a clear vertical structure around the existing fields, such as:

1. Amount
2. Description
3. Date
4. Paid by
5. Split method
6. Participants
7. Split configuration
8. Receipt
9. Existing submit/review controls

Do not add, remove, or reorder functionality merely for UI convenience.

### Acceptance criteria

- Amount entry is prominent.
- Inputs are comfortable on mobile.
- Participant selection is touch-friendly.
- Validation messages are clear.
- No unnecessary horizontal scrolling occurs.
- Existing submission behavior is unchanged.

---

# 10. Phase 6 — Expense Editing UI

Apply the same mobile-first principles to the existing expense edit experience.

Focus on:

- Clear field grouping
- Readable values
- Easy editing
- Touch-friendly controls
- Existing actions
- Appropriate destructive-action presentation

Do not change existing permissions or behavior.

---

# 11. Phase 7 — Split Configuration UI

Make the existing split interface comfortable on mobile.

Preserve all existing methods.

Use progressive disclosure where appropriate.

Example:

```text
Split method
[ Existing method ▼ ]
```

Only show configuration already associated with the selected method.

### Acceptance criteria

- All existing split methods remain accessible.
- Selected method is obvious.
- Inputs are touch-friendly.
- Financial values remain readable.
- Existing calculations remain unchanged.

---

# 12. Phase 8 — Expense History and Dense Data

Adapt existing expense history for small screens.

Where desktop tables become difficult to read, use:

- Stacked rows
- Cards
- Compact list items
- Responsive layouts
- Progressive disclosure

Keep existing important information accessible.

Do not change:

- Filtering
- Sorting
- Pagination
- Data behavior
- Financial calculations

merely for visual reasons.

---

# 13. Phase 9 — Balances

Make existing balances immediately understandable on mobile.

Prioritize:

- User's own position
- Who owes whom
- Amount
- Existing settlement action

Avoid dense desktop-style tables on small screens.

Do not change balance calculations.

---

# 14. Phase 10 — Settlements

Improve the presentation of the existing settlement workflow.

Focus on:

- Clear amount
- Clear payer/payee information
- Simple vertical layout
- Comfortable inputs
- Existing confirmation action
- Mobile-friendly feedback

Do not change settlement behavior or calculations.

---

# 15. Phase 11 — Activity and Settings

Adapt the existing:

- Activity/history
- Profile
- Settings

for mobile.

Use clear sections and progressive disclosure where useful.

Do not add new capabilities.

---

# 16. Phase 12 — Modals and Dialogs

Review existing dialogs.

On mobile, use an appropriate presentation such as:

- Full-width
- Near-full-width
- Bottom sheet
- Full-screen

### Existing form inside a modal

While pending:

- Keep the modal open.
- Preserve form state.
- Prevent duplicate submission through the existing UI behavior.

On failure:

- Keep the modal open.
- Preserve entered values where practical.
- Show the existing error.

On success:

- Show existing success feedback.
- Reset the form.
- Close the modal according to the existing workflow.

Do not change the underlying submission logic.

---

# 17. Phase 13 — Toasts and Feedback

Improve existing toast presentation.

Requirements:

- Readable on mobile
- Within viewport
- Does not cover critical controls
- Consistent placement
- Accessible
- Success only after successful response
- Errors clearly presented

Do not create new business outcomes.

---

# 18. Phase 14 — Loading, Empty, Error, and Unauthorized States

Improve the presentation of existing states:

- Loading
- Empty
- Error
- Unauthorized
- Success
- Pending submission

Each state should work cleanly at mobile widths.

Do not change state logic.

---

# 19. Phase 15 — Touch and Accessibility

Review all important interactive controls.

Ensure:

- Comfortable touch targets
- Clear focus
- Good contrast
- Semantic controls
- Accessible labels
- Accessible errors
- Accessible dialogs
- Accessible toast messages

Do not trade accessibility for compactness.

---

# 20. Phase 16 — Tablet Enhancement

After mobile is correct, enhance tablet layouts.

Possible improvements:

- Multi-column layouts
- Wider containers
- Better spacing
- More efficient list density
- Side-by-side sections

Do not create a different workflow.

---

# 21. Phase 17 — Desktop Enhancement

Enhance the mobile baseline for desktop.

Use additional width for:

- Multi-column layouts
- Side-by-side sections
- Wider content
- Expanded navigation
- Richer contextual information
- More efficient data presentation

The same existing workflow must remain recognizable.

---

# 22. Phase 18 — Cross-Screen Consistency

Review all screens for consistent:

- Typography
- Spacing
- Buttons
- Inputs
- Cards
- Dialogs
- Toasts
- Badges
- Icons
- Navigation
- States
- Responsive behavior

Prefer shared components for repeated patterns.

---

# 23. Phase 19 — Final UI Review

After implementation, review representative viewport sizes:

- 320px
- 360px
- 375px
- 390px
- 414px
- Tablet
- Desktop

Check for:

- Horizontal overflow
- Cramped controls
- Unreadable text
- Poor spacing
- Difficult touch interactions
- Broken dialogs
- Poor form layouts
- Navigation problems
- Inconsistent components
- Accessibility issues

This review is for **UI quality and regression detection**.

It is not a workflow redesign.

---

# 24. Final Acceptance Criteria

The phase is complete when:

- [ ] Mobile is the intentional base layout.
- [ ] Existing screens are comfortable on mobile.
- [ ] No accidental horizontal overflow exists.
- [ ] Existing navigation is mobile-friendly.
- [ ] Dashboard is mobile-first.
- [ ] Groups are mobile-first.
- [ ] Expense creation is mobile-first.
- [ ] Expense editing is mobile-first.
- [ ] Existing split methods remain accessible.
- [ ] Expense history is readable on mobile.
- [ ] Balances are easy to understand.
- [ ] Settlement UI is comfortable on mobile.
- [ ] Activity is mobile-friendly.
- [ ] Settings/profile are mobile-friendly.
- [ ] Existing modal forms behave correctly.
- [ ] Existing toast behavior is presented consistently.
- [ ] Loading/empty/error/unauthorized/success states are clear.
- [ ] Touch targets are comfortable.
- [ ] Accessibility is preserved/improved.
- [ ] Tablet layouts are coherent.
- [ ] Desktop layouts progressively enhance the mobile baseline.
- [ ] Existing functionality remains unchanged.
- [ ] Existing workflows remain unchanged.
- [ ] No new product features were introduced.
- [ ] No backend/business-logic changes were introduced for UI purposes.

---

# 25. Final Principle

> **Mobile-first is a UI strategy, not a product redesign.**

The existing Splitly workflows already define what users can do.

This phase should make those workflows:

**clearer → easier → faster → more comfortable → more accessible**

on mobile first, while progressively enhancing the same experience for tablet and desktop.
