## Why

Editable line-item cells currently keep edit icons visible after an editor popover opens because hover, focus, and open-state styling still win. Once an editor is open, those icons become visual noise and can make the active table row look like it has multiple competing edit targets.

## What Changes

- Hide all editable-cell edit icons whenever any editable-cell editor popover is open.
- Make the open-editor state override hover, focus-within, and per-cell open icon styling.
- Keep editor popovers, cell content, table column widths, and row action icons unchanged.
- Preserve normal hover/focus edit icon behavior when no editor popover is open.

## Capabilities

### New Capabilities
- `editable-cell-affordance-visibility`: Defines when inline editable-cell edit affordances are visible or suppressed.

### Modified Capabilities
- None.

## Impact

- Affects editable line-item cell components for bill item, price, and discount.
- Affects shared editable-cell SCSS visibility rules.
- Affects focused tests/stories that assert edit icon behavior during open editor states.
- No API, dependency, data model, or backend changes.
