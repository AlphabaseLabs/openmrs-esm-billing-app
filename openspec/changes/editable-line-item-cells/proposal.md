## Why

Line-item billing edits currently require leaving the table flow or using row-level actions, which slows down common invoice correction work. The billing app needs production inline editing for Price, Discount, and Bill item cells while preserving the existing Carbon `DataTable` behavior and production rendering.

## What Changes

- Add production inline editing for `Price`, `Discount`, and `Bill item` cells inside the existing invoice Line Items `DataTable`.
- Keep the current table engine and row structure; editing behavior is implemented as production cell components rendered by the real invoice table.
- Add a hybrid Price cell where clicking the number free-types a price and clicking the hover icon opens an available-prices picker.
- Add a hybrid Discount cell where clicking the number free-types an absolute discount and clicking the hover icon opens the discount form.
- Add a Bill item cell with a searchable Carbon `ComboBox` that commits only on selection.
- Enforce one active editor across the table.
- Gate editing by line-item status so locked rows, including `PAID`, render as static cells with no editing affordance.
- Persist saved edits through production billing resources and immediately recompute row totals and invoice summary values.
- Add or update focused Storybook stories only to exercise the real production components and states needed for this change; do not create mock/story-only implementations of the editable cells.

## Capabilities

### New Capabilities

- `editable-line-item-cells`: Production invoice line-item table behavior for inline editing Price, Discount, and Bill item cells, including validation, popovers, persistence, recomputation, accessibility, and Storybook coverage using real components.

### Modified Capabilities

- None.

## Impact

- Affected production UI:
  - `src/invoice/invoice-table.component.tsx`
  - `src/invoice/invoice-table.scss`
  - `src/invoice/bill-details.component.tsx`
  - supporting production components/helpers under `src/invoice/`
- Affected resource/API usage:
  - Reuse `updateBillLineItem` and `BillLineItemUpdate` from `src/billing.resource.ts`.
  - Use existing billable service data as the source for Bill item options and available price options.
- Affected Storybook:
  - Focused production stories may be added or adjusted for `BillDetails` and `InvoiceTable` states, but stories must render the real production implementation rather than a parallel mock component.
- No table-engine replacement, no breaking public API changes expected, and no story-only prototype implementation is in scope.
