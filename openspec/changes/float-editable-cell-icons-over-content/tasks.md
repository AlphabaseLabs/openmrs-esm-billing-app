## 1. Diagnose current geometry

- [x] 1.1 Inspect the current editable-cell DOM and CSS for bill item, price, and discount cells before changing code.
- [x] 1.2 Identify every class or wrapper that makes the edit icon participate in grid, flex, gap, padding, or width allocation.
- [x] 1.3 Confirm which behaviors are cell-local trigger geometry versus rich editor popover portal behavior, so the portal fix is not regressed.

## 2. Replace icon lane layout with floating affordances

- [x] 2.1 Replace numeric editable-cell lane geometry with a shell/content/trigger structure where the trigger is absolutely positioned and out of normal layout flow.
- [x] 2.2 Place numeric edit triggers at inline-start while preserving right-aligned numeric display values and inline numeric editors across the full cell width.
- [x] 2.3 Replace text editable-cell trigger geometry with the same floating affordance model.
- [x] 2.4 Place text edit triggers at inline-end while preserving left-aligned bill-item text content across the full cell width.
- [x] 2.5 Remove or neutralize obsolete icon lane styles, grid columns, flex gaps, and any content padding added solely to reserve icon space.

## 3. Preserve readability and interactions

- [x] 3.1 Give floating edit triggers a compact white or gray background surface and existing focus treatment so icons remain readable over content.
- [x] 3.2 Ensure content is not truncated or shortened solely because of the edit trigger overlay.
- [x] 3.3 Preserve hover, focus, disabled, active, and keyboard behavior for editable and non-editable rows.
- [x] 3.4 Preserve rich editor popover portal behavior for price, discount, and bill-item editors.
- [x] 3.5 Confirm only one active editable-cell editor remains open at a time.

## 4. Update tests

- [x] 4.1 Update numeric editable-cell tests to assert the trigger no longer occupies a dedicated layout lane.
- [x] 4.2 Update text editable-cell tests to assert the trigger no longer occupies normal content layout space.
- [x] 4.3 Update or add tests that verify numeric content remains right-aligned and text content remains left-aligned.
- [x] 4.4 Update or add tests that verify the rich popover still renders through the overlay portal outside the table overflow boundary.
- [x] 4.5 Keep existing commit, cancel, validation, locked-row, and disabled-state tests passing.

## 5. Validate production stories

- [x] 5.1 Run the focused editable line-item cell tests.
- [x] 5.2 Run TypeScript validation if implementation or test types changed.
- [x] 5.3 Run Storybook outside the sandbox and inspect the production `BillDetails` pending bill story.
- [x] 5.4 Confirm visually that edit icons float over the cell content without changing table column widths or causing text/number shifts.
- [x] 5.5 Confirm visually that opening rich editors still floats above the table instead of making the table or icon area scroll.
- [x] 5.6 Confirm no Storybook-only editable-cell implementation was introduced.
