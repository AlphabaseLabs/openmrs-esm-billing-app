## Why

The discount percent editor now works, but its settled display and welded popover geometry still look technically unfinished: whole percentages show unnecessary trailing decimals, the popover is right-aligned instead of left-welded to the discount cell, and the `%` affordance remains visible while the popover is open. This change tightens those last UI details without changing discount math or popover content.

## What Changes

- Format settled percent values with up to 4 decimal places, trimming trailing zeroes.
- Keep tiny non-zero percentages visibly non-zero.
- Align the discount popover's left border with the discount cell's left border.
- Hide the `%` options affordance while the discount popover is open.
- Preserve closed-state hover/focus behavior for the `%` affordance.
- Keep the simplified popover content unchanged: percent input, sponsor selector, comment textarea, bottom `Clear`.
- Keep discount amount editing, price editor, and bill-item editor behavior unchanged.

## Capabilities

### New Capabilities
- `discount-percent-popover-polish`: Defines final display and geometry polish for the simplified discount percent popover.

### Modified Capabilities

## Impact

- Affected code:
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.tsx`
  - `src/invoice/editable-line-item-cells/editable-line-item-cells.scss`
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.test.tsx`
- No API, dependency, data model, or billing math changes.
