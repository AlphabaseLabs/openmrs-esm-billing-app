## 1. Price Picker Structure

- [x] 1.1 Update `EditablePriceCell` so the price option picker uses a single concise select-title instead of a separate current-price summary block.
- [x] 1.2 Keep the chevron affordance as the only entry point for the price option picker.
- [x] 1.3 Keep clicking the price value surface wired to the inline numeric editor, not the price option picker.

## 2. Select-List Row Pattern

- [x] 2.1 Render price option rows with the same base option-row structure used by the bill-item picker.
- [x] 2.2 Add a stable amount lane for each price option row while keeping the selected checkmark at the trailing edge.
- [x] 2.3 Preserve selected-row highlighting for the currently active price option.
- [x] 2.4 Preserve empty-state copy when the active service has no price options.

## 3. Popover Styling

- [x] 3.1 Reuse the shared editable-cell popover chrome for price option selection.
- [x] 3.2 Add price-option-specific row layout styles only where the amount lane requires them.
- [x] 3.3 Give the price option popover a readable minimum width that does not depend on the narrow price table column.
- [x] 3.4 Confirm price popover open/close does not participate in table column sizing.

## 4. Behavior Preservation

- [x] 4.1 Preserve existing auto-commit behavior when a price option is selected.
- [x] 4.2 Preserve existing line-item recalculation and commit payload semantics for selected price options.
- [x] 4.3 Preserve Escape and outside-click close behavior through the existing overlay component.
- [x] 4.4 Avoid changing discount editor, bill-item editor, table column layout, or top invoice summary layout.

## 5. Tests and Stories

- [x] 5.1 Update focused editable price cell tests for the new price picker title and option row structure.
- [x] 5.2 Update any Storybook interaction selectors that relied on removed current-price copy.
- [ ] 5.3 Run focused editable price cell tests.
- [ ] 5.4 Run Storybook outside the sandbox and inspect the default pending bill price picker against the bill-item picker.
