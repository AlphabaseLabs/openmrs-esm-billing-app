## Why

The price picker popover still uses the older generic menu surface: blue selected state, generic menu width, and a detached-looking option panel. The bill-item selector now has a clearer option surface, so the price picker should visually align with that pattern without changing pricing behavior.

## What Changes

- Align the price picker option menu colors with the bill-item option surface.
- Use teal for selected price option fill, left bar, and check mark.
- Use neutral grey for hover and keyboard-highlight states.
- Align price option row width and rhythm with the active price cell/menu surface instead of the older generic detached popover sizing.
- Keep price option labels, amounts, selected value behavior, and commit behavior unchanged.
- Do not change bill-item search, discount editor, line-item calculations, or payment behavior.

## Capabilities

### New Capabilities
- `price-popover-option-surface`: Defines the visual surface, option state colors, width, and row rhythm for the price picker popover.

### Modified Capabilities

## Impact

- Affects price picker popover styling and, if necessary, small class wiring for price option states.
- No data model, API, price calculation, bill-item selection, discount, payment, or dependency changes.
