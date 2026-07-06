## Why

The line items table can now hide optional columns, but the table still uses static full-column-set width assumptions. When columns are hidden, the remaining columns do not redistribute available space deterministically, causing excessive slack in trailing columns and inconsistent geometry across viewport sizes.

## What Changes

- Add deterministic width redistribution for the visible line item table columns.
- Drive visible column sizing from column metadata instead of static CSS widths that assume every optional column is present.
- Keep `table-layout: fixed` so editable cells, inline editors, and popovers do not resize columns when activated.
- Include Carbon-managed synthetic columns, such as the selection checkbox column, in the width model when they are rendered.
- Compute visible table minimum width from the currently visible columns.
- Ensure fixed columns such as selection and actions keep stable widths while flexible data columns absorb surplus space by explicit weights.
- Preserve existing column visibility UI, localStorage behavior, editable cell behavior, and billing calculations.
- Do not move the column visibility control out of the toolbar in this change.

## Capabilities

### New Capabilities

- `line-item-column-width-redistribution`: Defines deterministic width allocation for the invoice line items table when optional columns are hidden or restored.

### Modified Capabilities

- None.

## Impact

- Affects the invoice line items table column registry and table rendering.
- Affects invoice table CSS that currently assigns static per-column widths and table minimum width.
- Adds focused unit/component coverage for visible-column width allocation, Carbon selection column alignment, and editable-cell width stability.
- Adds Storybook/DOM smoke coverage for representative hide/show combinations and viewport sizes.
- Does not change backend APIs, bill payload shape, persisted column visibility format, or billing calculation logic.
