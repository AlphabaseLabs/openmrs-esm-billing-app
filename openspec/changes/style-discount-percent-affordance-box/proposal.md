## Why

The discount `%` trigger currently reads like loose table text rather than a deliberate editable-cell affordance. It should share the chevron affordance's size and radius so the editable controls feel consistent, while keeping a transparent background to avoid adding another filled surface in the discount cell.

## What Changes

- Style the discount `%` affordance as a fixed-size box matching the editable chevron affordance size and radius.
- Use a transparent background for the discount affordance box.
- Add a light grey border around the discount affordance box.
- Center the `%` glyph optically within the box.
- Preserve existing hover/focus/open visibility behavior for the discount affordance.
- Do not change the discount popover form, discount calculations, auto-commit behavior, payment behavior, or other editable-cell affordances.

## Capabilities

### New Capabilities
- `discount-percent-affordance-box`: Defines the visual surface for the discount `%` editable-cell trigger affordance.

### Modified Capabilities

## Impact

- Affects only discount editable-cell affordance styling.
- No data model, API, discount calculation, payment, bill-item, price, or popover behavior changes.
