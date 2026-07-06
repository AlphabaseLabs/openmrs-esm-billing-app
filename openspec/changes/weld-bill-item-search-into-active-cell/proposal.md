## Why

The current bill-item selector renders a full Carbon ComboBox inside the popover, creating two active input surfaces: the editable table cell and a second bordered input inside the menu. This breaks the welded editable-cell geometry we established for line-item editing and makes the search control look detached from the selected bill item.

## What Changes

- Replace the visual Carbon ComboBox embedded in the bill-item popover with a headless searchable single-select pattern.
- Make the active bill-item cell itself become the searchable input while the editor is open.
- Render only the bill-item option list inside the popover.
- Preserve combobox behavior through a headless combobox engine rather than rebuilding keyboard and ARIA behavior manually.
- Require valid catalog selection only; typed free text must never commit as a bill item.
- Keep this change scoped to the bill-item selector only. Price and discount editors are not changed.

## Capabilities

### New Capabilities

- `welded-bill-item-search`: Defines the bill-item searchable single-select behavior where the editable cell is the input surface and the popover contains only the filtered menu.

### Modified Capabilities

- None.

## Impact

- Affects `src/invoice/editable-line-item-cells/editable-bill-item-cell.component.tsx`.
- Affects editable-cell SCSS for the bill-item active input and popover menu.
- Affects bill-item cell tests and Storybook behavior for the default pending bill story.
- Adds `downshift` as a direct dependency if the implementation uses `useCombobox`; it is currently only available transitively through Carbon and should not be relied on transitively.
