## Why

The price option popover currently feels like a separate editor panel while the bill-item popover already has the desired select-cell interaction model. Standardizing the price picker on the same visual and behavioral base reduces interaction inconsistency without changing pricing logic or table layout.

## What Changes

- Make the price option picker use the same select-list popover pattern as the bill-item picker.
- Keep the existing auto-commit behavior when a price option is selected.
- Keep inline numeric price editing separate from price-option selection.
- Remove price-popover-only visual hierarchy that duplicates the active cell value, such as the separate current-price block.
- Preserve the existing table column sizing, active cell anchoring, portal overlay behavior, and line-item recalculation semantics.

## Capabilities

### New Capabilities
- `price-popover-select-pattern`: Defines the required price option popover behavior and visual grammar when editing invoice line-item price options.

### Modified Capabilities

## Impact

- Affected UI: invoice line-item price cells and their option picker popover.
- Affected code likely includes `EditablePriceCell`, shared editable-cell styles, and focused editable price cell tests/stories.
- No API changes.
- No dependency changes.
- No change to discount editing, bill-item editing, payment behavior, totals calculation rules, or save/cancel behavior.
