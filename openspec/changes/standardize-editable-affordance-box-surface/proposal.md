## Why

Editable-cell option triggers currently use different visual surfaces: bill item and price chevrons use the older white elevated box, while the discount `%` affordance uses the newer transparent bordered box. This creates unnecessary drift between controls that serve the same purpose.

## What Changes

- Make `.optionsButton` the shared editable-cell affordance surface.
- Standardize the shared surface to the transparent bordered box established for the discount `%` affordance.
- Reuse the shared surface across bill item, price, and discount editable-cell option buttons.
- Keep bill-item and price chevron glyphs and open-state rotation behavior.
- Keep the discount `%` glyph and discount editor behavior.
- Remove duplicated per-cell affordance box styling where it only redefines the same size, radius, background, border, or centering.
- Do not change popover layout, selection behavior, discount calculations, table layout, or payment behavior.

## Capabilities

### New Capabilities

- `editable-affordance-box-surface`: Defines the shared visual surface for editable-cell option buttons.

### Modified Capabilities

## Impact

- Affects editable line-item cell styling for bill item, price, and discount option buttons.
- No API, data model, calculation, table layout, popover positioning, or payment behavior changes.
