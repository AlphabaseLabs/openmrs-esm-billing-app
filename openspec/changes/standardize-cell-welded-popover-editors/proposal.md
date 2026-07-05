## Why

The editable line-item cells now have the right production integration path, but their popover editors still behave and read like detached generic overlays. We need a precise standard for cell-welded popovers so Bill item, Price, and Discount editing feels like an extension of the table cell while preserving the real production code path.

## What Changes

- Standardize a shared cell-welded popover shell for editable line-item table cells.
- Anchor popovers to the active table cell, not to a floating icon, with zero visual gap between the cell edge and the editor.
- Keep active editable cells visually connected to their open popover through a subtle active fill and matching border.
- Make Bill item selection a whole-cell list editor that commits immediately on option selection and has no Save or Cancel button.
- Make Price tier selection a right-aligned list editor that commits immediately on option selection and has no Save or Cancel button.
- Make Discount editing a right-aligned form editor with linked amount and percent inputs, live valid auto-commit, inline reset, and no Save or Cancel button.
- Preserve borderless inline numeric editing for direct Price and Discount value edits.
- Preserve portal-based overlay positioning so popovers escape table overflow and never force table scrollbars.
- Preserve locked-row behavior: static display only, with no edit affordance, hover trigger, cursor, or popover.

## Capabilities

### New Capabilities

- `cell-welded-popover-editors`: Defines the visual geometry, anchoring, trigger behavior, and commit model for production editable line-item popover editors.

### Modified Capabilities

- None.

## Impact

- Affects production editable line-item cell components for Bill item, Price, and Discount.
- Affects shared editable-cell overlay and popover styling.
- Affects line-item total recomputation behavior when Bill item, Price, or Discount edits commit.
- Affects Storybook stories only insofar as they must render the real production components and demonstrate these editor states; no Storybook-only mock editor implementations.
- No backend API contract changes are expected.
