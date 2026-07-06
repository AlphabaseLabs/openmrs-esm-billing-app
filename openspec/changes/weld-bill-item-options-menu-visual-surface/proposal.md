## Why

The bill-item search behavior is now correctly welded into the active table cell, but the options list still reads visually as a separate floating popover. The menu needs a precise visual surface refinement so the active cell and its options list feel like one continuous editor instead of two stacked controls.

## What Changes

- Refine only the bill-item options menu visual treatment used by the editable bill-item cell.
- Make the options list visually attach to the active bill-item cell by sharing the same width, border rhythm, and horizontal alignment.
- Remove the standalone popover feel from this bill-item menu, including the heavy independent shell treatment that makes it look detached from the cell.
- Increase bill-item option row height and vertical rhythm so options no longer look compressed.
- Preserve the existing Downshift search behavior, keyboard behavior, valid-option-only commit behavior, and no-nested-input structure.
- Preserve price and discount editor popovers; this change is scoped to the bill-item options menu visual surface only.

## Capabilities

### New Capabilities

- `welded-bill-item-menu-surface`: Defines the visual contract for the editable bill-item cell's welded options menu surface.

### Modified Capabilities

- None.

## Impact

- Affected code: editable line-item cell styles and any bill-item-specific class wiring needed to support the welded menu surface.
- Affected UI: the default pending bill story and any production bill details view using the editable bill-item cell.
- No API, data model, dependency, or persistence changes.
- No changes to price, discount, payments, invoice actions, or non-bill-item popovers.
