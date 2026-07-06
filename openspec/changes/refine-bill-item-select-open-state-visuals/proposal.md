## Why

The bill-item cell's open searchable-select state still reads as two stacked active surfaces: the table cell plus a colored input/menu treatment. This creates visual noise, mismatched accents, unstable text placement, and a menu that feels detached from the active cell.

## What Changes

- Refine the bill-item cell's open/edit state so the in-cell field is transparent, borderless, and visually part of the table cell.
- Keep the elevated white chevron affordance used by editable cells, but hide it while the bill-item select is closed and idle; show it on hover, focus, and open states.
- Standardize the bill-item options menu on one accent system: teal for selected state and neutral grey for hover/keyboard highlight.
- Align display text, active input text, and option text to the same x-position so opening the editor does not shift the label.
- Weld the active cell and options menu with a single seam and add only a subtle menu lift over underlying cards.
- Keep price picker and discount editor visuals unchanged.

## Capabilities

### New Capabilities
- `bill-item-select-open-state-visuals`: Defines the visual contract for the bill-item cell searchable single-select while it is open.

### Modified Capabilities

## Impact

- Affects bill-item editable-cell component styling and, if necessary, small class/attribute wiring for open state and option state styling.
- No API, data model, pricing, discount, payment, or dependency changes.
- Price picker and discount form implementations must remain untouched except for avoiding shared-style regressions.
