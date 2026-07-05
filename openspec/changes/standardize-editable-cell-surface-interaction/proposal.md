## Why

The borderless inline editor now avoids boxed form controls, but the editable cell still does not behave like a full table-cell surface. Values can appear vertically off-center in the row, and inline editing only starts when the user clicks directly on the visible number or text instead of anywhere in the editable cell area.

This change closes that interaction geometry gap so editable cells feel like stable table cells: content is vertically centered and the full editable cell content surface acts as the inline edit hit target.

## What Changes

- Standardize editable cell shells as full-width, vertically centered row surfaces.
- Make the editable content surface, not only the visible value text, open inline editing for price, discount, and bill-item cells where inline editing exists.
- Preserve separate behavior for floating edit icons: icon clicks open rich editors and do not also trigger inline editing.
- Preserve disabled-row behavior so non-editable cells remain non-interactive except for normal table selection/actions.
- Preserve borderless inline numeric input behavior from `standardize-borderless-inline-cell-editing`.
- Preserve rich editor portal behavior from `fix-editable-cell-popover-overflow`.
- Do not introduce Storybook-only editable-cell components or redesign the invoice table.

## Capabilities

### New Capabilities

- `editable-cell-surface-interaction`: Defines the vertical alignment and hit-target behavior for production invoice table editable-cell surfaces.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*`
- Affected tests:
  - Editable price, discount, and bill-item cell tests should cover full-surface click behavior and vertical-centering class/DOM contracts.
- No backend API changes.
- No dependency changes.
