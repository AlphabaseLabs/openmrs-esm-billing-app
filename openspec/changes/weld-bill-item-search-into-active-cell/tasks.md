## 1. Dependency and current-state preparation

- [x] 1.1 Confirm `downshift` is not already a direct dependency and add it as a direct dependency before importing `useCombobox`.
- [x] 1.2 Locate the current bill-item editable cell implementation and identify the nested Carbon `ComboBox` code path to replace.
- [x] 1.3 Confirm price and discount editable cells are not touched by this change.

## 2. Headless combobox behavior

- [x] 2.1 Replace the visual Carbon `ComboBox` usage in the bill-item editor with Downshift `useCombobox`.
- [x] 2.2 Wire `getInputProps()` to an input rendered inside the active bill-item table cell.
- [x] 2.3 Wire `getToggleButtonProps()` to the existing chevron affordance in the active cell.
- [x] 2.4 Wire `getMenuProps()` to the popover menu container.
- [x] 2.5 Wire `getItemProps()` to each filtered billable service option.
- [x] 2.6 Preserve selected-item state so the current bill item is marked in the option list.

## 3. Welded active-cell UI

- [x] 3.1 Render the in-cell search input only while the bill-item editor is open.
- [x] 3.2 Seed the in-cell input with the current bill-item name when opening.
- [x] 3.3 Select the input text on open so typing replaces the current bill-item name.
- [x] 3.4 Style the input as borderless, transparent, cell-height aligned, and inheriting the editable-cell typography.
- [x] 3.5 Ensure the popover contains only the option menu or empty state, with no nested bordered input shell.
- [x] 3.6 Keep the chevron visible inside the active cell and flipped/open while the menu is expanded.

## 4. Selection, filtering, and cancellation behavior

- [x] 4.1 Filter billable service options by the in-cell input query.
- [x] 4.2 Show a non-selectable `No results` state when no billable services match.
- [x] 4.3 Commit only when a valid billable service option is selected.
- [x] 4.4 Preserve existing bill-item price recalculation behavior after a valid selection.
- [x] 4.5 Prevent typed free text from committing or creating a bill item.
- [x] 4.6 Revert to the previous selected bill item on Escape without selection.
- [x] 4.7 Revert to the previous selected bill item on blur/close without selection.
- [x] 4.8 Ensure Enter commits only the active valid option.

## 5. Accessibility and keyboard behavior

- [x] 5.1 Ensure the in-cell input exposes combobox semantics and expanded state.
- [x] 5.2 Ensure the input is associated with the popover listbox.
- [x] 5.3 Ensure active option state is exposed for keyboard navigation.
- [x] 5.4 Verify ArrowDown and ArrowUp navigate options.
- [x] 5.5 Verify Home and End move through the option list where supported by Downshift.
- [x] 5.6 Verify Escape exits without committing typed free text.

## 6. Tests and stories

- [x] 6.1 Update bill-item cell unit tests for the in-cell input and headless option menu.
- [x] 6.2 Test that opening the editor does not render a nested Carbon ComboBox visual input in the popover.
- [x] 6.3 Test filtering from the in-cell input.
- [x] 6.4 Test valid selection commits the selected billable service.
- [x] 6.5 Test typed free text does not commit.
- [x] 6.6 Test Escape and blur revert to the previous selected bill item.
- [x] 6.7 Run focused bill-item cell tests.
- [x] 6.8 Run Storybook outside the sandbox and visually inspect the default pending bill story.
- [x] 6.9 Confirm the Storybook bill-item editor shows one active surface: the table cell input plus popover options only.
