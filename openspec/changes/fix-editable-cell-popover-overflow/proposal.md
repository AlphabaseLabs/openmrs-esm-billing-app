## Why

Editable line-item cells currently render their rich popover inside the invoice table cell tree. Because Carbon table wrappers use overflow containers for responsive table behavior, the popover becomes part of the table's scrollable overflow and can make the icon/table area scroll instead of floating above the bill UI.

This needs to be fixed before further inline-edit design work, because price, discount, and bill-item editors require reliable overlay behavior inside production table layouts.

## What Changes

- Render rich editable-cell popovers outside the table overflow container using an overlay/portal ownership model.
- Keep the editable cell trigger and visible cell value inside the production `InvoiceTable`.
- Position the popover from the active trigger/cell geometry rather than relying on table-cell-relative absolute positioning.
- Preserve existing production table behavior, responsive scrolling, row selection, closed/paid bill disabled states, and line-item commit behavior.
- Do not introduce a Storybook-only editable-cell implementation or redesign the table for Storybook.

## Capabilities

### New Capabilities

- `editable-cell-overlay`: Defines how rich invoice line-item cell editors must render above table overflow containers while remaining anchored to their production table cell triggers.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*`
  - `src/invoice/invoice-table.component.tsx`
  - `src/invoice/invoice-table.scss`
- Affected tests/stories:
  - Existing editable-cell tests should assert overlay behavior without relying on a Storybook-only component.
  - Production Storybook stories should continue rendering the real `BillDetails`, `InvoiceTable`, and editable-cell code paths.
- No API-breaking changes are expected.
- No backend API changes are expected.
