## Context

The discount editor popover includes a sponsor selector between the discount input and the comment field. The current selector behaves like an expanded in-flow dropdown, so opening it pushes the comment field down and changes the form geometry. Elsewhere, selectable options use searchable Carbon-style controls, so the sponsor selector also feels inconsistent.

This change is limited to the discount sponsor selector. The discount popover itself, discount calculations, percent/amount editing, comment field, and payment totals must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Replace the discount sponsor dropdown with a searchable Carbon `ComboBox`.
- Keep the existing sponsor options: `Practice and doctor`, `Practice`, and `Doctor`.
- Keep the selected sponsor value and update flow unchanged.
- Ensure the options menu overlays rather than taking layout space.
- Prevent the comment field from moving when sponsor options are opened.

**Non-Goals:**

- Do not change discount percent or amount editing.
- Do not change discount calculations, auto-commit behavior, comment behavior, payment totals, or popover anchoring.
- Do not change bill-item selectors, price selectors, table layout, or payment UI.
- Do not introduce free-create sponsor values.

## Decisions

1. Use Carbon `ComboBox` for the sponsor selector.

   The sponsor selector is a fixed-list searchable single-select inside a form. Carbon `ComboBox` provides the expected searchable input/listbox semantics without requiring a custom headless combobox.

2. Keep sponsor options fixed.

   The selectable values remain `Practice and doctor`, `Practice`, and `Doctor`. Typed text is only for filtering existing options and must not create a new sponsor value.

3. Keep the options menu out of normal form flow.

   The opened listbox must layer over the popover content instead of increasing the sponsor field's layout height. The comment field should keep its position and size while the menu is open.

4. Scope styling to the discount popover sponsor field.

   Any overrides needed to control menu layering, width, or z-index should target the discount sponsor selector only, avoiding regressions in bill-item and price selectors.

## Risks / Trade-offs

- Carbon `ComboBox` styles may render the menu in-flow under the local popover CSS -> Mitigate with scoped sponsor selector styles that keep the menu layered and out of normal form flow.
- Filtering can leave typed text that is not a valid sponsor -> Mitigate by allowing only existing sponsor options to commit; blur or close should retain the last selected sponsor unless a valid option is chosen.
- Scoped menu layering can overlap the comment field visually -> This is intentional while open; the comment field must not be pushed down.
- Broad Carbon overrides could regress other comboboxes -> Mitigate by scoping all overrides to the discount sponsor selector container.
