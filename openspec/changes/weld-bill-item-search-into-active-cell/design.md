## Context

The bill-item editable cell currently opens a popover that contains a full Carbon ComboBox. That creates two visible active surfaces: the editable table cell and a separate bordered ComboBox input inside the popover. The desired interaction is a welded editable-cell pattern where the table cell itself becomes the searchable input and the popover only contains the option menu.

The behavior still needs real combobox semantics: input/listbox ARIA wiring, active option tracking, keyboard navigation, Escape handling, Enter selection, and focus management. Rebuilding those manually is unnecessary and risky. Carbon ComboBox is built on Downshift, so this change should use Downshift headlessly and render its props into the existing editable-cell geometry.

`downshift` is not currently a direct dependency of this app. If `useCombobox` is imported directly, it must be added as a direct dependency rather than relying on Carbon's transitive dependency.

## Goals / Non-Goals

**Goals:**

- Make the active bill-item table cell the only visible input/search surface.
- Render the bill-item option list in the popover without a nested Carbon ComboBox input.
- Preserve accessible combobox behavior by using `useCombobox` headlessly.
- Keep the active cell visually consistent with the existing welded editable-cell shell.
- Support filtering valid billable services from the in-cell input value.
- Commit only valid billable service selections.
- Revert uncommitted text on Escape, blur, or close without selection.

**Non-Goals:**

- Do not change price picker behavior.
- Do not change discount popover behavior.
- Do not add create-new bill-item behavior.
- Do not allow arbitrary free-text bill items.
- Do not redesign table column widths, row heights, invoice summary, payment UI, or action icons.

## Decisions

### Use Downshift `useCombobox` as the headless behavior engine

Use `useCombobox` directly to keep combobox behavior while removing Carbon's visual shell.

Alternatives considered:

- Keep Carbon `ComboBox` and style away its shell: rejected because Carbon still owns a nested input surface and remains structurally separate from the editable cell.
- Build input/listbox behavior manually: rejected because keyboard behavior, ARIA relationships, focus state, and active descendant handling are easy to get subtly wrong.

### Render the input inside the active table cell

When the bill-item editor opens, replace the display label inside the active cell with a borderless text input wired with `getInputProps()`. The input must inherit the cell font, alignment, color, height, and active background treatment. The chevron remains in the cell and is wired with `getToggleButtonProps()`.

On open:

- Seed the input with the currently selected bill-item name.
- Select the input text so typing replaces the current name.
- Mark the cell as active.
- Flip the chevron open.

### Render only listbox content in the popover

The popover should use `getMenuProps()` and contain only:

- Filtered bill-item options wired with `getItemProps()`.
- A selected-item checkmark on the current selected service.
- A `No results` empty state when filtering returns no valid services.

The popover must not contain a second input, Carbon ComboBox shell, save/cancel buttons, or create-new action.

### Selection and commit semantics

Selecting an option commits that billable service immediately using the existing bill-item commit path. If the existing line item has a default-price-driven bill item selection behavior, preserve that recalculation behavior.

Typed text alone never commits. Blur, Escape, or close without selection restores the previous selected bill-item name and leaves the line item unchanged.

### Scope to bill item only

The bill-item cell is the only editor with a searchable single-select. Price is a menu/select pattern and discount is a multi-field form popover. Neither should be converted to a cell-input search pattern as part of this change.

## Risks / Trade-offs

- Direct Downshift import without direct dependency -> add `downshift` to dependencies before importing `useCombobox`.
- Headless wiring can drift from Carbon visual behavior -> keep Carbon tokens/classes only for styling, but let Downshift own input/menu/item behavior.
- Blur can fire before click selection -> use Downshift item selection state rather than ad hoc blur handlers where possible, and test option click selection.
- Typed query can leave stale text visible -> explicitly reset input value to the selected service name on close without selection.
- Empty results can appear like a valid option -> render `No results` as non-selectable text, not an item.
- Popover clipping/scroll regressions -> keep existing `EditableCellOverlay` popover anchoring and overflow behavior.
