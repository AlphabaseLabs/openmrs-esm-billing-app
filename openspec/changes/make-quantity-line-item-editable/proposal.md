## Why

Line-item Quantity is currently static while Price, Discount, and Bill Item can be edited directly in the invoice table. Making Quantity editable now completes the core bill-item editing flow and reuses the newly extracted editable Carbon table cell kit instead of adding another one-off table-cell implementation.

## What Changes

- Add inline editing for the Quantity column in invoice line items.
- Use `EditableNumericCell` from `@alphabase/editable-carbon-table-cell-kit` for the cell mechanics.
- Keep Quantity-specific billing behavior in a billing adapter, including integer validation, payload generation, and invoice recalculation.
- Commit valid Quantity changes through the same line-item update flow used by existing editable cells.
- Preserve existing table geometry: opening the Quantity editor must not resize or shift the Quantity, Price, Discount, Tax, Total, or Action columns.
- Keep Quantity as an inline-only editor with no popover.
- Keep paid, closed, disabled, or otherwise non-editable rows read-only.

## Capabilities

### New Capabilities
- `editable-line-item-quantity`: Covers inline editing of invoice line-item Quantity using the shared editable Carbon table cell kit while preserving billing behavior and table geometry.

### Modified Capabilities
- None.

## Impact

- Affected invoice table rendering for line-item Quantity cells.
- Affected billing adapter code around editable line-item cells.
- Affected tests for line-item payload updates, validation, and table geometry.
- Affected Storybook production stories for BillDetails and InvoiceTable editable line-item states.
- No registry publishing, dependency publishing, or Quantity popover behavior is included.
