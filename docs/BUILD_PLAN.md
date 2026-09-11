# Splitly — Mobile-First UX / Responsive Design Build Plan

**Status:** Ready to execute  
**Phase:** Mobile-First UX / Responsive Hardening  
**Purpose:** Rework the existing responsive experience so mobile is the intentional baseline while preserving Splitly's product behavior, financial correctness, and established visual direction.

---

## 1. Phase Objective

The MVP and core production-hardening implementation already exist. This phase focuses specifically on the application's **mobile-first experience**.

The goal is not to create a separate mobile application.

The goal is to make the existing Splitly application:

- mobile-first,
- responsive,
- touch-friendly,
- accessible,
- easy to use on small screens,
- progressively enhanced for tablet and desktop.

The desired design progression is:

> **Mobile baseline → Tablet enhancement → Desktop enhancement**

Do not treat mobile as a compressed desktop layout.

---

## 2. Source of Truth

Before making changes, read:

1. `AGENTS.md`
2. `docs/system-design.md`
3. the existing `docs/BUILD_PLAN.md` history/specification if available
4. `docs/RELEASE_CHECKLIST.md`
5. `docs/OPERATIONS.md`
6. the current application implementation

The implementation is the source of truth for the current state.

Do not assume existing documentation accurately describes the current UI.

---

## 3. Phase Rules

### 3.1 Preserve the product

This phase is a UX/responsive improvement, not a product-scope expansion.

Do not add unrelated product features.

Do not change financial semantics.

Do not change authorization rules.

Do not replace the established architecture.

### 3.2 Preserve the visual direction

Reuse the existing:

- design tokens,
- colors,
- typography,
- buttons,
- inputs,
- cards,
- dialogs,
- navigation,
- status patterns,
- spacing,
- radius,
- shadows,
- icons/components.

Do not introduce a new visual identity.

The objective is to make the existing product work better on small screens.

### 3.3 Mobile is the baseline

The smallest supported viewport is the starting point for layout decisions.

Desktop and tablet should progressively enhance the mobile baseline.

---

# 4. Mobile-First UX Principles

## 4.1 Content priority

For every screen:

1. Identify the user's primary goal.
2. Put the most important information first.
3. Make the primary action obvious.
4. Move secondary information into progressive disclosure where appropriate.
5. Avoid desktop-level information density on small screens.

---

## 4.2 Touch-first interaction

Controls must be comfortable to use with touch.

Review:

- buttons,
- links,
- icon buttons,
- menus,
- checkboxes,
- radio controls,
- dropdowns,
- participant selectors,
- date inputs,
- modal controls.

Avoid:

- tiny controls,
- tightly packed actions,
- hover-only interactions,
- adjacent destructive actions with insufficient separation.

---

## 4.3 No accidental horizontal overflow

Primary workflows should not require horizontal scrolling.

Pay particular attention to:

- dashboard cards,
- group pages,
- expense lists,
- balance displays,
- tables,
- forms,
- dialogs,
- navigation.

If a desktop table becomes unusable on mobile, transform it into a readable list/card representation rather than simply shrinking the table.

---

# 5. Phase 1 — Baseline Mobile Audit

Before changing the UI, inspect the application at representative mobile widths.

Recommended baseline widths:

- 320px
- 360px
- 375px
- 390px
- 414px

Also inspect:

- 768px tablet
- 1024px desktop
- a larger desktop viewport

Audit at minimum:

- authentication
- dashboard
- groups
- group overview
- expense history
- expense detail
- add expense
- edit expense
- split configuration
- balances
- settlement
- activity
- profile/settings
- dialogs/modals
- navigation
- toasts
- loading states
- empty states
- error states

### Deliverable

Before implementation, identify:

- layout problems,
- overflow,
- cramped controls,
- poor information hierarchy,
- difficult touch interactions,
- desktop-only assumptions,
- modal problems,
- form problems,
- navigation problems.

Do not redesign everything at once.

---

# 6. Phase 2 — Mobile Navigation

Implement a mobile-appropriate navigation experience.

The existing product information architecture should remain recognizable.

Mobile navigation should provide easy access to:

- Dashboard
- Groups
- Activity
- Profile/Settings
- primary Add Expense action

Where appropriate, use a compact bottom navigation and persistent/high-visibility Add Expense action.

### Acceptance Criteria

- Navigation works comfortably on a phone.
- Primary destinations are easy to reach.
- Add Expense is easy to discover.
- Touch targets are appropriate.
- No important destination becomes inaccessible.
- Desktop navigation remains appropriate at larger widths.

---

# 7. Phase 3 — Dashboard

Redesign the dashboard layout starting from mobile.

Prioritize:

1. Current financial position
2. Important balances
3. Groups
4. Recent activity
5. Primary actions

Avoid showing too many desktop dashboard cards side-by-side.

### Mobile requirements

- Single-column or appropriately stacked layout by default.
- Clear numeric hierarchy.
- Important balance information visible without excessive scrolling.
- Cards only where they improve grouping and comprehension.
- No horizontal overflow.

### Desktop enhancement

Use additional width for:

- multiple columns,
- richer activity information,
- additional contextual content.

---

# 8. Phase 4 — Groups

Make the groups experience mobile-first.

### Groups list

Each group should communicate its essential information clearly:

- group name,
- relevant balance/financial status,
- recent activity where appropriate,
- access/navigation affordance.

### Group detail

Prioritize:

- group identity,
- user's balance,
- Add Expense,
- Settle Up,
- recent expenses/activity.

Secondary administrative actions should not dominate the mobile screen.

---

# 9. Phase 5 — Expense Creation and Editing

This is a priority mobile workflow.

The mobile expense flow should be clear and vertically structured.

Recommended information progression:

1. Amount
2. Description
3. Paid by
4. Split method
5. Participants
6. Split configuration
7. Receipt
8. Review/submit

The exact implementation may differ.

### Requirements

- Use a mobile-friendly single-column layout by default.
- Use appropriate mobile input types/keyboards.
- Keep amount entry prominent.
- Make payer selection easy to understand.
- Make participant selection touch-friendly.
- Avoid cramped multi-column layouts.
- Keep validation errors close to the relevant fields.
- Preserve the existing financial calculation semantics.

---

# 10. Phase 6 — Split Configuration

The split system must remain fully functional on mobile.

Supported methods:

- Equal
- Exact
- Percentage
- Weighted

Do not remove split methods.

Use progressive disclosure where appropriate.

For example:

```text
Split method
[ Equally ▼ ]
```

Only show additional configuration when required by the selected method.

### Acceptance Criteria

- All four methods remain accessible.
- Users can understand the selected method.
- Inputs are touch-friendly.
- Amounts remain readable.
- The final allocation remains clear.
- No financial behavior changes as a result of the UI work.

---

# 11. Phase 7 — Expense History and Dense Data

Review every table/list containing financial information.

On mobile, prefer:

- stacked list items,
- cards,
- responsive rows,
- progressive disclosure,

where a desktop table becomes difficult to read.

Each expense should still make important information understandable, including as applicable:

- description,
- amount,
- payer,
- user's share,
- status,
- date.

Secondary actions such as edit/delete should not create cramped rows.

---

# 12. Phase 8 — Balances and Settlements

Balances are one of Splitly's most important mobile workflows.

Prioritize:

- who owes whom,
- how much,
- the user's own position,
- Settle Up action.

Avoid dense desktop-style balance tables on small screens.

Settlement flows should be short and easy to complete.

Do not alter balance or settlement calculations.

---

# 13. Phase 9 — Modals and Dialogs

Audit every modal/dialog.

For mobile:

- avoid unnecessarily narrow desktop dialogs,
- use full-width, full-screen, or sheet-like layouts where appropriate,
- prevent awkward nested scrolling,
- maintain accessible focus behavior,
- keep primary actions visible.

For forms inside modals:

### While pending

- keep modal open,
- prevent duplicate submission,
- preserve form state.

### On success

- show success toast,
- reset form,
- clear relevant state,
- close modal.

### On failure

- show error toast,
- keep modal open,
- preserve entered values where practical,
- allow retry.

---

# 14. Phase 10 — Toasts and Feedback

Review toast placement and behavior at mobile widths.

Requirements:

- Toasts must remain visible and readable.
- They must not cover critical controls.
- They must not overflow the viewport.
- Success appears only after confirmed success.
- Errors are understandable without exposing internal details.
- Multiple duplicate toasts should not be generated.

Use the existing toast system.

---

# 15. Phase 11 — Loading, Empty, Error, and Unauthorized States

Audit all major mobile screens for non-happy-path states.

Verify:

- loading states,
- empty states,
- errors,
- unauthorized access,
- successful mutation feedback.

These states must be intentionally designed for narrow screens rather than being accidental desktop layouts.

---

# 16. Phase 12 — Responsive Enhancement

After mobile layouts are correct, progressively enhance:

### Tablet

- introduce additional columns where useful,
- increase spacing where appropriate,
- improve list/table density without sacrificing readability.

### Desktop

- use available horizontal space,
- add side-by-side content,
- expand navigation,
- provide richer contextual information,
- preserve the same core workflows.

Do not create a separate desktop product.

---

# 17. Phase 13 — Accessibility

Mobile-first changes must preserve accessibility.

Review:

- semantic HTML,
- labels,
- focus,
- keyboard navigation,
- modal focus,
- screen-reader labels,
- error associations,
- touch targets,
- contrast,
- toast announcements.

Do not make controls visually compact at the expense of accessibility.

---

# 18. Phase 14 — Component Consistency

When fixing one responsive component:

- search for similar components,
- identify shared patterns,
- reuse existing components,
- avoid duplicate implementations.

Examples:

- all primary buttons should behave consistently,
- all dialogs should follow the same mobile pattern,
- all forms should use consistent spacing,
- all toast behavior should remain consistent,
- all list/card transformations should follow the same design language.

---

# 19. Testing and Review Phase

Testing and review are intentionally separate from the implementation phase.

After all mobile-first implementation tasks are complete, perform the final review.

### Review

Inspect:

- 320px
- 360px
- 375px
- 390px
- 414px
- tablet
- desktop

Review the complete critical workflows:

1. Sign in
2. Dashboard
3. Create group
4. Enter group
5. Add expense
6. Configure split
7. View balance
8. Settle up
9. Edit expense
10. Delete expense
11. Group update/delete according to permissions
12. Activity/history
13. Profile/settings

### Verification

Use the project's established test and verification strategy.

Do not claim mobile-first completion based only on the existence of responsive Tailwind classes.

The actual user experience must be reviewed at representative mobile widths.

---

# 20. Final Acceptance Criteria

The Mobile-First UX phase is complete when:

- [ ] Mobile is the intentional base layout.
- [ ] Core Splitly workflows are comfortable on a phone.
- [ ] No accidental horizontal overflow exists.
- [ ] Primary actions are easy to discover and reach.
- [ ] Touch targets are usable.
- [ ] Navigation is mobile-appropriate.
- [ ] Dashboard is mobile-first.
- [ ] Groups are mobile-first.
- [ ] Expense creation is mobile-first.
- [ ] Expense editing is mobile-first.
- [ ] All four split methods work comfortably on mobile.
- [ ] Expense history is readable without forcing desktop tables.
- [ ] Balances are easy to understand on mobile.
- [ ] Settlement is usable on mobile.
- [ ] Modal forms work correctly on mobile.
- [ ] Forms reset only after confirmed successful submission.
- [ ] Successful modal forms close only after confirmed success.
- [ ] Failed submissions preserve form state where practical.
- [ ] Toasts are readable and correctly positioned.
- [ ] Loading/empty/error/unauthorized/success states work on mobile.
- [ ] Accessibility is preserved.
- [ ] Tablet layout remains coherent.
- [ ] Desktop layout remains coherent and progressively enhanced.
- [ ] Existing financial logic is unchanged.
- [ ] Existing authorization/security behavior is preserved.
- [ ] Existing design direction is preserved.
- [ ] No unrelated product features were introduced.
- [ ] Final testing/review has been completed separately.
- [ ] Documentation matches the actual implementation.

---

# 21. Final Engineering Principle

> **Mobile-first does not mean mobile-only.**
>
> Start with the smallest useful experience, prioritize what matters most, make interaction comfortable for touch, and progressively use additional screen space as it becomes available.

For Splitly, the goal is a financial workflow that feels natural on a phone first and becomes richer—not merely larger—on tablet and desktop.
