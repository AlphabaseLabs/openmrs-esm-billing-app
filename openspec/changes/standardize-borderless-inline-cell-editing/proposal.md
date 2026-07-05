## Why

Inline editable line-item cells currently look and behave like form controls placed inside a table row. Numeric edits use boxed number inputs with steppers, left-shifted draft text, and a prominent focus ring, which breaks the visual continuity of the invoice table and can change the perceived row geometry.

This change standardizes inline editing so a table value appears to become editable in place: same alignment, same row height, no layout space allocated for edit icons, and rich editors continuing to escape table overflow through the existing overlay portal.

## What Changes

- Replace inline numeric `NumberInput` usage for price and discount with text-based decimal editing that supports comma-formatted draft values.
- Restyle inline price and discount editors as borderless in-cell editing surfaces instead of boxed form fields.
- Keep numeric display and edit text right-aligned so the value does not jump when editing starts.
- Prevent inline edit controls from increasing table row height.
- Position edit icon affordances as out-of-flow overlays inside the cell shell so they do not allocate grid, flex, gap, padding, or column width.
- Place numeric edit icons at inline-start and text edit icons at inline-end.
- Preserve the existing rich editor overlay portal for price options, discount form, and bill-item selection.
- Preserve existing production `InvoiceTable`, `BillDetails`, commit, cancel, disabled-row, and Storybook production-code paths.
- Do not introduce a Storybook-only editable-cell implementation.

## Capabilities

### New Capabilities

- `borderless-inline-cell-editing`: Defines the production invoice table standard for in-cell editable surfaces, out-of-flow edit icon affordances, numeric text editing, and portal-owned rich editors.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*`
  - Potentially `src/invoice/invoice-table.scss` only if table cell overflow or row-height styles need adjustment.
- Affected tests:
  - Editable price and discount inline-edit tests.
  - Editable bill-item affordance geometry tests.
  - Existing portal regression tests for rich editors.
- No backend API changes.
- No new runtime dependencies expected.
