## Why

Changing a line item from a short item/low amount to a longer item/high amount currently causes visible horizontal layout shifts in the bill details page. The root cause is content-driven geometry: the top summary uses flex `space-between`, and the invoice line items table relies on auto table layout, so wider text and numeric values reflow adjacent stats and columns.

## What Changes

- Stabilize the bill details summary stats so changing total amount text length does not move the later stats or action area.
- Stabilize invoice line item table columns so changing bill item, price, discount, tax, or total content does not reallocate column widths.
- Preserve the existing production visual structure, Carbon table usage, editable cell behavior, and responsive behavior.
- Keep editable affordances overlay-only; they must not consume table-cell layout width or influence column sizing.
- Avoid changing bill calculations, payment behavior, API payloads, or persistence semantics.

## Capabilities

### New Capabilities
- `stable-invoice-layout-geometry`: Defines stable bill details summary and invoice line item table geometry that does not shift when editable line item content changes.

### Modified Capabilities

## Impact

- Affected code:
  - `src/invoice/bill-details.component.tsx`
  - `src/invoice/invoice.scss`
  - `src/invoice/invoice-table.component.tsx`
  - `src/invoice/invoice-table.scss`
  - editable line item cell styles only if needed to preserve overlay-only affordances
- No API changes.
- No new dependencies.
- No changes to bill calculation logic, line item mutation logic, payment allocation, or Storybook mock data.
