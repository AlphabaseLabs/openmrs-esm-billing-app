## 1. Shared Affordance Surface

- [x] 1.1 Update the shared `.optionsButton` style to use the transparent bordered affordance box surface.
- [x] 1.2 Keep existing shared `.optionsButton` behavior for size, centering, opacity transition, hover visibility, focus visibility, open visibility, cursor, and focus outline.
- [x] 1.3 Remove the old white elevated affordance box treatment from the shared `.optionsButton` surface.

## 2. Cell-Specific Cleanup

- [x] 2.1 Remove bill-item-specific box styling that duplicates shared `.optionsButton` size, radius, background, border, shadow, centering, or opacity behavior.
- [x] 2.2 Remove price-specific box styling that duplicates shared `.optionsButton` size, radius, background, border, shadow, centering, or opacity behavior.
- [x] 2.3 Reduce discount-specific percent affordance styling to glyph alignment only if the shared `.optionsButton` now owns the box surface.

## 3. Behavior Preservation

- [x] 3.1 Preserve bill-item and price chevron glyph rendering and open-state rotation behavior.
- [x] 3.2 Preserve discount `%` glyph rendering and discount editor open behavior.
- [x] 3.3 Confirm the change does not alter popover layout, popover positioning, table column widths, bill-item search behavior, price selection behavior, discount calculations, or payment totals.
