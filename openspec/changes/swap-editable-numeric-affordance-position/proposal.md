## Why

Editable numeric cells currently place the chevron/control affordance on the left and the numeric value on the right. For price and discount editing, this reads backward from the desired selectable-cell pattern, where the value should read first and the control should sit at the trailing edge.

## What Changes

- Left-align editable price and discount display values inside their cells.
- Move the floating chevron/control affordance for editable numeric cells from the left side to the right side.
- Preserve the rule that the affordance does not reserve table layout space.
- Preserve existing table column widths, popover anchoring, inline editing behavior, and price/discount commit behavior.
- Do not change read-only rows, action buttons, bill item text cells, or payment controls.

## Capabilities

### New Capabilities

- `editable-numeric-affordance-position`: Editable price and discount cells present values at the inline start and floating controls at the inline end without changing table geometry.

### Modified Capabilities

- None.

## Impact

- Affected code is limited to editable numeric cell styling and focused tests/stories for price and discount cells.
- No backend, API, calculation, dependency, or data model changes.
- No table column width or Carbon DataTable replacement work.
