## Why

Editable line-item cells currently use layout lanes that make edit icons consume cell width. This causes numeric and text values to shift, misalign, or compete with the icon when the invoice table is constrained.

The edit icon should behave as a visual affordance layered above the cell content, not as table content that participates in cell geometry. This is needed before continuing total-bill discount and inline editing work so price, discount, and bill-item cells have a stable production geometry.

## What Changes

- Replace editable-cell icon lane geometry with a floating affordance model.
- Keep text and numeric cell content in normal table flow with no extra icon lane, grid column, flex gap, padding reservation, or truncation added for the icon.
- Position numeric edit icons at the cell inline-start edge while keeping numeric display text and editors right-aligned across the cell.
- Position text edit icons at the cell inline-end edge while keeping text display and editors left-aligned across the cell.
- Give floating edit icons a small white or gray background so they remain readable when visually overlapping content.
- Preserve the existing portal behavior for rich editor popovers; only the compact edit trigger placement changes.
- Do not introduce Storybook-only editable-cell implementations.

## Capabilities

### New Capabilities

- `editable-cell-floating-affordance`: Defines how editable line-item cell edit triggers float above text and numeric cell content without allocating layout space inside table cells.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*`
  - Potentially `src/invoice/invoice-table.scss` if table-cell styles need to stop forcing lane geometry.
- Affected tests/stories:
  - Editable-cell tests should assert the trigger does not participate in the normal cell content layout.
  - Existing production Storybook stories should continue to render real `BillDetails`, `InvoiceTable`, and editable-cell code paths.
- No API-breaking changes are expected.
- No backend API changes are expected.
