## Why

The simplified discount popover now has a single percent input, but two edge cases make it misleading and hard to use: small real discounts can display as `0.00%`, and formatting the controlled input on every keystroke prevents normal multi-digit or decimal typing. This change makes the percent editor accurate for small values and stable while typing.

## What Changes

- Increase settled percent display precision so small non-zero discounts do not render as `0.00`.
- For non-zero percentages below the chosen visible precision floor, display a non-zero indicator instead of a rounded zero.
- Preserve raw focused input text while the user types values like `1`, `10`, `10.`, and `10.5`.
- Continue parsing and live-applying percent edits to the actual discount amount using `price * percent / 100`.
- Normalize/format percent text only on open, blur, and popover close.
- Keep the simplified popover model unchanged: percent input, sponsor selector, comment textarea, and bottom `Clear` action.
- Keep table discount amount editing and display unchanged.

## Capabilities

### New Capabilities
- `discount-percent-input`: Defines precision and focused typing behavior for the simplified discount popover percent input.

### Modified Capabilities

## Impact

- Affected code:
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.tsx`
  - `src/invoice/editable-line-item-cells/editable-discount-cell.component.test.tsx`
- No API, dependency, or data model changes.
- No changes to price or bill-item editors.
