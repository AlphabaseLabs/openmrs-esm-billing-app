## Why

Quantity inline editing currently introduces a dedicated centered layout that does not match the established editable numeric cell geometry used by Price and Discount. This creates a visual inconsistency in the line items table and weakens the reusable editable-cell standard.

## What Changes

- Align Quantity editable-cell content to the same left content edge used by existing editable numeric cells.
- Remove or override any Quantity-specific centered layout for display text, hover affordance, and inline input.
- Preserve the current inline-only Quantity editing behavior with no popover.
- Preserve table column widths before, during, and after Quantity edit mode.
- Do not change Price, Discount, Bill Item, table data flow, commit behavior, or validation rules.

## Capabilities

### New Capabilities
- `quantity-editable-cell-alignment`: Defines the alignment contract for Quantity editable-cell display, affordance, and inline editor geometry.

### Modified Capabilities

None.

## Impact

- Affects the editable carbon table cell kit styling used by Quantity.
- Affects the Quantity editable cell visual alignment in invoice line item tables and related Storybook stories.
- No API, backend, dependency, or persistence changes.
