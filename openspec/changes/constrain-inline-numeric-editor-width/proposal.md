## Why

Clicking an editable numeric cell can change invoice table column widths because the active inline Carbon `TextInput` subtree contributes a different intrinsic width than the display value. The active editor must fit inside the existing cell geometry instead of causing the table auto-layout algorithm to recalculate column widths.

## What Changes

- Constrain the inline numeric editor shell and Carbon `TextInput` wrappers to the same available width as the display state.
- Apply the constraint to inline numeric editing for price and discount cells.
- Preserve right alignment for numeric values and inline numeric inputs.
- Preserve the existing inline editing behavior, popover editors, chevron affordances, table columns, and row action icons.
- Do not move the inline editor to a portal or overlay in this change.

## Capabilities

### New Capabilities
- `inline-numeric-editor-width-stability`: Defines the width stability contract for active inline numeric editors inside invoice table cells.

### Modified Capabilities
- None.

## Impact

- Affects shared editable-line-item cell styles for inline numeric editor shells and Carbon input wrappers.
- May affect focused tests around editable price and discount cell geometry.
- No API, dependency, backend, data model, popover, row action, or table column definition changes.
