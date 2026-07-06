## Why

The discount editor popover currently duplicates the inline discount amount editor and exposes redundant amount/readout content, making the interaction heavier than needed. The intended model is simpler: the table cell remains the actual discount amount editor, while the popover provides an alternate percent-based editor plus discount metadata.

## What Changes

- Preserve the discount table cell as the inline actual discount amount editor.
- Simplify the discount popover to only show a percent input, discount sponsor selector, comment textarea, and bottom `Clear` action.
- Derive the popover percent from the current discount amount using the line item price when the popover opens.
- When the user changes the percent in the popover, update the actual discount amount shown in the table cell using `price * percent / 100`.
- Round displayed percent values so raw floating point tails never appear.
- Replace the discount cell's hover/open affordance with a `%` sign instead of the generic chevron.
- Remove redundant popover content: amount input, heading/title, per-item readout, total formula line, and top reset link.
- Keep price and bill-item editors unchanged.

## Capabilities

### New Capabilities
- `discount-editor-popover`: Defines the simplified discount popover behavior, percent-to-amount synchronization, metadata controls, and visual affordance for discount editing.

### Modified Capabilities

## Impact

- Affected code:
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.tsx`
  - `src/invoice/editable-line-item-cells/editable-line-item-cells.scss`
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.test.tsx`
- No API or dependency changes.
- Price and bill-item editable cell implementations should remain untouched except where shared styles already support the discount cell.
