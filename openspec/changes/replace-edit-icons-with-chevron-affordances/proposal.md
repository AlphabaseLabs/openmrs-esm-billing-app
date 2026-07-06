## Why

Editable line-item cells currently use pencil edit icons even though the interaction opens an inline editor or picker anchored to the cell. A chevron affordance better communicates "open editor/options" and matches the intended welded popover visual direction.

## What Changes

- Replace editable-cell pencil edit icons with chevron affordances for the inline editable line-item cells.
- Keep the chevron as the cell-level editor affordance for bill item, price, and discount cells.
- Style the chevron affordance as a borderless elevated white chip with a subtle radius and shadow-defined edge.
- Preserve current hover/focus/open affordance visibility behavior; this change does not reintroduce the reverted "hide all icons while editor is open" behavior.
- Preserve table layout, cell content alignment, popover positioning, and row Action column icons.
- Do not change editor commit/reset behavior or popover content.

## Capabilities

### New Capabilities
- `editable-cell-chevron-affordances`: Defines the chevron affordance used by editable line-item cells.

### Modified Capabilities
- None.

## Impact

- Affects editable line-item cell components for bill item, price, and discount.
- Affects shared editable-cell icon styling and focused tests/stories that identify the cell affordance.
- No API, dependency, data model, backend, or row action icon changes.
