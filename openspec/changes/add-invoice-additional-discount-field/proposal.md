## Why

Cashier users need to apply a bill-level discount from the invoice screen without changing individual line-item discounts. The invoice UI already has inline line-item discount editing, but it does not yet expose the mockup's `Additional discount` field in the settlement area.

## What Changes

- Add an editable `Additional discount` bill-level control below the invoice line-items table and above the payments section.
- Render the control as an amount field with a trailing `%` affordance that behaves like the existing inline discount cell percent affordance.
- Allow users to edit the additional discount as a fixed amount or as a percentage of the current eligible bill amount.
- Persist valid edits through the existing additional-discount update API and refresh invoice bill state after a successful update.
- Recalculate displayed totals so the summary discount includes line-item discounts plus the bill-level additional discount, and amount due reflects the additional discount.
- Display the current additional discount for closed bills without allowing edits.
- Preserve existing line-item discount behavior, payment processing behavior, and the final `+ Add item` row behavior.

## Capabilities

### New Capabilities

- `invoice-additional-discount-field`: Invoice bill details expose an editable bill-level additional discount control with fixed-amount editing, percent editing, persistence, and summary recalculation.

### Modified Capabilities

- None.

## Impact

- Affected frontend areas: invoice bill details layout, payment summary/totals display, billing resource update call, invoice mapping, editable bill recomputation helpers, and related tests/stories.
- Affected API integration: uses the existing `kenyaemr-cashier/bill/{billUuid}/additional-discount` update operation via the billing resource layer.
- Affected calculations: displayed total discount and amount due must account for `additionalDiscount` separately from line-item discounts.
- No backend schema change, line-item discount contract change, payment payload change, or additional line-item table data row is introduced.
