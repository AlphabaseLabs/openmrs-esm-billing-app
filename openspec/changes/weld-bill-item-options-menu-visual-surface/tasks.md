## 1. Current-state confirmation

- [x] 1.1 Locate the bill-item options menu styles and class wiring used by the editable bill-item cell.
- [x] 1.2 Confirm the current Downshift combobox behavior remains correct and does not need behavior changes.
- [x] 1.3 Confirm price and discount popover styles are separate from the bill-item options menu styles.

## 2. Welded menu geometry

- [x] 2.1 Remove or override bill-item-specific fixed minimum width that makes the options menu wider than the active bill-item cell.
- [x] 2.2 Make the bill-item options menu content honor the active cell anchor width provided by the overlay layer.
- [x] 2.3 Align the options menu left edge with the active bill-item cell left edge.
- [x] 2.4 Remove the visible vertical gap between the active cell bottom edge and the menu top edge.
- [x] 2.5 Remove standalone top-border or shadow treatment that makes the menu look like a separate floating card.
- [x] 2.6 Preserve enough subtle lower-layer depth for the portaled menu to remain readable over surrounding content.

## 3. Option row visual rhythm

- [x] 3.1 Give bill-item option rows an explicit comfortable row height or min-height.
- [x] 3.2 Adjust bill-item option row padding so labels no longer look vertically compressed.
- [x] 3.3 Keep selected option styling clear with the selected background, left rail, and right-aligned checkmark.
- [x] 3.4 Ensure highlighted option styling remains visible without overriding selected option clarity.
- [x] 3.5 Apply compatible row rhythm to the bill-item no-results state if visible.

## 4. Scope protection

- [x] 4.1 Keep the visual changes scoped to bill-item-specific classes, not generic popover or option classes.
- [x] 4.2 Confirm price option menus do not inherit the bill-item welded surface treatment.
- [x] 4.3 Confirm discount editor popovers do not inherit the bill-item welded surface treatment.
- [x] 4.4 Confirm no nested bill-item search input or Carbon ComboBox is reintroduced into the options menu.

## 5. Validation

- [x] 5.1 Run the focused editable bill-item cell tests.
- [x] 5.2 Run Storybook outside the sandbox and inspect the default pending bill story.
- [x] 5.3 Confirm the bill-item options list visually reads as a continuation of the active cell rather than a separate thing.
- [x] 5.4 Confirm option rows have comfortable height and are no longer compressed.
- [x] 5.5 Confirm search still works from the active cell and filters the welded options menu.
