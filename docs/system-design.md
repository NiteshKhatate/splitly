# Splitly Design System — Forms & Validation

## 1. Form Philosophy

Splitly forms should be:

* Simple
* Consistent
* Accessible
* Predictable
* Easy to scan
* Fast to complete
* Clear about validation errors
* Consistent across authentication, groups, expenses, settlements, and profile management

All forms must use the reusable Splitly form components and follow the visual rules defined in this document.

---

# 2. Standard Form Architecture

Splitly uses:

```text
React Hook Form
        +
      Zod
        +
Standard Splitly Form Components
```

React Hook Form manages:

* Form state
* Field registration
* Submission state
* Dirty state
* Touched state
* Form errors

Zod manages:

* Input validation
* Validation rules
* Error messages
* Shared validation schemas

Use `zodResolver` to connect Zod to React Hook Form.

---

# 3. Standard Form Structure

A standard form should follow this structure:

```text
Form
│
├── FormField
│   ├── Label
│   ├── Input
│   ├── Description (optional)
│   └── ErrorMessage (when invalid)
│
├── FormField
│   ├── Label
│   ├── Input
│   └── ErrorMessage
│
└── FormActions
    ├── Cancel
    └── Submit
```

Use reusable components rather than recreating this structure for every form.

---

# 4. Labels

Every input must have a visible, meaningful label unless there is a documented accessibility reason not to.

Examples:

```text
Full name
Email address
Password
Group name
Expense amount
```

Do not rely on placeholder text as the only label.

Labels should remain visible when the user enters a value.

---

# 5. Placeholder Text

Placeholders should provide examples or hints, not replace labels.

Good:

```text
Label: Email address

Placeholder:
you@example.com
```

Bad:

```text
Placeholder:
Enter your email
```

with no visible label.

Do not overuse placeholders.

---

# 6. Input States

Every input should support these states:

```text
Default
Hover
Focus
Filled
Disabled
Read-only
Error
```

Follow the global color, typography, border, radius, and spacing tokens defined in this document.

---

# 7. Focus State

Focused inputs must have a clearly visible focus state.

Focus styling must:

* Meet accessibility expectations.
* Be visually distinct.
* Not depend only on subtle color changes.

Do not remove browser focus indicators without providing an equivalent accessible focus treatment.

---

# 8. Error State

When a field is invalid:

* Clearly indicate the field is invalid.
* Display the error message below or adjacent to the field.
* Use the standard semantic error styling.
* Associate the error message with the input for assistive technologies.

Example:

```text
Email address

┌────────────────────────────────────┐
│ invalid-email                      │
└────────────────────────────────────┘

Please enter a valid email address.
```

Do not display raw Zod or database error objects to users.

---

# 9. Error Message Style

Validation messages should be:

* Short
* Specific
* Actionable
* Human-readable

Prefer:

```text
Email address is required.
```

over:

```text
Invalid input.
```

Prefer:

```text
Passwords do not match.
```

over:

```text
Validation failed.
```

Do not expose technical details.

---

# 10. Helper Text

Use helper text when additional context is useful.

Example:

```text
Password

[••••••••••]

Use at least 8 characters.
```

Helper text should not compete visually with the main form content.

If an error exists, the error message takes priority over normal helper text.

---

# 11. Required Fields

Required fields should be communicated consistently.

Follow the project's chosen convention rather than inventing a different pattern on individual pages.

Do not rely solely on color to indicate required fields.

---

# 12. Submit Buttons

Every form should have one clearly identifiable primary submission action.

Examples:

```text
Create account
Log in
Create group
Add person
Add expense
Save changes
```

Use the standard Splitly primary button.

The button must have:

```text
Default
Loading
Disabled
```

states.

During submission:

```text
Create group
     ↓
Creating group...
```

The exact visual treatment should follow the Button component specification.

---

# 13. Cancel Buttons

Cancel actions should use the standard secondary/ghost button variant defined by the design system.

Examples:

```text
Cancel
Close
Back
```

Cancel should not visually compete with the primary submission action.

---

# 14. Form Actions

For standard forms:

```text
[ Cancel ] [ Submit ]
```

The primary action should be visually dominant.

On mobile, form actions should remain easy to tap and should not create horizontal overflow.

---

# 15. Loading State

While a form is submitting:

* Prevent duplicate submission.
* Disable the submit button.
* Display the standard loading indicator where appropriate.
* Preserve entered form values.
* Keep the user informed that the operation is in progress.

Do not replace the entire form with a blank loading screen unless the UX specifically requires it.

---

# 16. Success State

After a successful operation:

* Show an appropriate success message when useful.
* Update the relevant UI.
* Close the dialog when appropriate.
* Navigate when the flow requires navigation.

Do not show unnecessary success notifications for every minor interaction.

---

# 17. Server Errors

Server/database errors should be displayed through a standard form-level error or notification pattern.

Example:

```text
Something went wrong while creating the group.
Please try again.
```

Do not expose:

```text
PostgREST error
SQLSTATE
database constraint names
stack traces
Supabase internal errors
```

to users.

---

# 18. Field-Level vs Form-Level Errors

Use field-level errors when the problem belongs to a specific field.

Example:

```text
Email address
→ Please enter a valid email address.
```

Use form-level errors when the problem affects the entire operation.

Example:

```text
We couldn't create the group.
Please try again.
```

Do not duplicate the same error in multiple places.

---

# 19. Forms in Dialogs

Dialogs containing forms should follow the same form rules as full pages.

Recommended structure:

```text
┌─────────────────────────────────────┐
│ Add people                       ×  │
│                                     │
│ Email address                       │
│ [____________________________]      │
│                                     │
│ [ Cancel ]       [ Add person ]    │
└─────────────────────────────────────┘
```

The dialog must:

* Trap focus appropriately.
* Support Escape where appropriate.
* Have an accessible title.
* Have accessible controls.
* Prevent accidental duplicate submissions.

---

# 20. Mobile Forms

On mobile:

* Inputs should use comfortable touch targets.
* Labels must remain visible.
* Form actions must remain accessible.
* Avoid cramped multi-column layouts.
* Avoid horizontal scrolling.
* Use full-width controls where appropriate.

---

# 21. Validation Timing

Do not aggressively show validation errors before the user has interacted with a field unless the flow specifically requires it.

Use React Hook Form's validation behavior consistently across the application.

Validation should provide useful feedback without making the form feel hostile.

---

# 22. Validation Schema Rules

Zod schemas should represent actual business/input rules.

Example:

```ts
const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Group name is required")
    .max(100, "Group name must be 100 characters or fewer"),
});
```

Keep validation rules close to the relevant domain.

Avoid duplicating the same validation rule across multiple components.

---

# 23. Shared Validation

When the same domain validation is required in multiple places, create a shared schema.

Example:

```text
src/lib/validations/groups.ts
```

Then reuse it in:

* Create group
* Edit group
* Server-side validation
* Other relevant flows

Do not maintain separate versions of the same validation rules.

---

# 24. Accessibility

Forms must support:

* Keyboard navigation
* Visible focus
* Screen readers
* Correct labels
* Correct error associations
* Appropriate input types
* Appropriate autocomplete attributes
* Accessible loading states

Use native HTML semantics whenever possible.

---

# 25. Form Component Standard

The preferred abstraction is:

```text
Form
FormField
FormLabel
FormControl
FormDescription
FormMessage
FormActions
```

Exact component names may differ based on the implementation.

The important requirement is consistent behavior and styling.

---

# 26. Do Not Create One-Off Forms

When implementing a new form:

1. Check `src/components/ui/`.
2. Reuse the existing form components.
3. Check `src/lib/validations/`.
4. Reuse existing Zod schemas where applicable.
5. Create a new schema only when required.
6. Follow the same visual and interaction patterns as existing forms.

A new form should feel like it belongs to the same application.

---

# 27. Authentication Forms

The following forms must use the standard form architecture:

```text
Signup
Login
Password reset
```

They should use:

```text
React Hook Form
+
Zod
+
Splitly Form Components
```

---

# 28. Group Forms

Group-related forms must use the standard form architecture.

Examples:

```text
Create group
Edit group
Add person
```

---

# 29. Expense Forms

Expense-related forms must use the standard form architecture.

Examples:

```text
Add expense
Edit expense
Split expense
Record settlement
```

Financial validation should be especially strict.

---

# 30. Consistency Rule

If a user learns how to use one Splitly form, they should immediately understand every other Splitly form.

Keep consistent:

* Label placement
* Input appearance
* Error placement
* Button hierarchy
* Loading behavior
* Success behavior
* Spacing
* Typography
* Responsive behavior
