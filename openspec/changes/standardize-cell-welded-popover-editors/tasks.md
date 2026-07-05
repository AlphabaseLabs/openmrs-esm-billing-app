## 1. Diagnose Current Editor Paths

- [x] 1.1 Inspect the current production Bill item, Price, and Discount editable cell components and identify which code owns inline editing, popover open state, commit behavior, and locked-row gating.
- [x] 1.2 Inspect the current shared overlay/popover positioning code and identify whether it anchors to the cell, icon, or another element.
- [x] 1.3 Identify any current Save/Cancel, detached-card styling, table-contained overlay rendering, or Storybook-only editor behavior that conflicts with this spec.

## 2. Shared Welded Popover Shell

- [x] 2.1 Update the shared editable-cell popover positioning so Bill item anchors bottom-start to the active cell and Price/Discount anchor bottom-end to the active cell.
- [x] 2.2 Ensure popovers remain portaled outside the table overflow chain and do not introduce table scrollbars or clipping.
- [x] 2.3 Add the active-cell visual state with subtle fill and border continuity while a popover is open.
- [x] 2.4 Update popover shell styling to use a thin border and minimal shadow instead of a detached card treatment.
- [x] 2.5 Ensure floating edit icons remain outside table layout space and are not used as popover anchors.

## 3. Bill Item Editor

- [x] 3.1 Make the editable Bill item cell open its list editor from the whole cell surface.
- [x] 3.2 Render the Bill item popover with a "Select bill item" caption and selected-row styling.
- [x] 3.3 Commit Bill item option selection immediately, close the popover, and recompute affected totals.
- [x] 3.4 Preserve manual valid Price overrides when Bill item changes, while resetting tier/default-derived prices to the new item default.
- [x] 3.5 Ensure dismissing the Bill item popover without selection leaves the value unchanged.

## 4. Price Editor

- [x] 4.1 Preserve borderless right-aligned inline Price value editing with Enter/blur commit and Escape cancel.
- [x] 4.2 Render the Price tier popover as a right-welded list with current price, option labels, option amounts, and selected-row styling.
- [x] 4.3 Commit Price tier selection immediately, close the popover, and recompute affected totals.
- [x] 4.4 Show no selected tier when the current Price is a valid custom value that does not match a configured tier.

## 5. Discount Editor

- [x] 5.1 Preserve borderless right-aligned inline Discount value editing with Enter/blur commit and Escape cancel.
- [x] 5.2 Render the Discount popover as a right-welded form with linked Amount and Percent inputs, Discount sponsor, Comment, and no Save or Cancel buttons.
- [x] 5.3 Auto-commit each valid Discount form field change through the production update path and recompute totals while keeping the popover open.
- [x] 5.4 Keep invalid Discount drafts local without updating the committed row value or totals.
- [x] 5.5 Add an inline Discount reset action that sets amount and percent to zero, clears discount-specific metadata when applicable, commits immediately, recomputes totals, and keeps the popover open.
- [x] 5.6 Ensure dismissing the Discount popover keeps all valid auto-committed changes.

## 6. Locked Rows and Accessibility

- [x] 6.1 Ensure locked rows render Bill item, Price, and Discount cells as static values with no affordance, editable cursor, or popover trigger.
- [x] 6.2 Preserve keyboard support for opening editors, committing inline values, canceling inline drafts with Escape, and dismissing popovers.
- [x] 6.3 Ensure focus remains predictable when a popover opens, commits, resets, or dismisses.

## 7. Tests

- [x] 7.1 Add or update tests for welded popover alignment metadata and portal behavior where practical in the existing test stack.
- [x] 7.2 Add or update tests for Bill item immediate commit, dismiss-without-change, and price option refresh behavior.
- [x] 7.3 Add or update tests for Price inline edit, tier selection, custom price tier state, and total recomputation.
- [x] 7.4 Add or update tests for Discount amount/percent synchronization, valid auto-commit, invalid draft handling, inline reset, and dismiss-keeps-changes behavior.
- [x] 7.5 Add or update tests proving locked rows expose no editable affordance or popover trigger.

## 8. Production Storybook Coverage

- [x] 8.1 Update production Storybook stories to exercise the real Bill item, Price, and Discount editor states without Storybook-only mock editor implementations.
- [x] 8.2 Include a pending bill story showing the welded Bill item list, Price tier list, and Discount form editors.
- [x] 8.3 Include locked or paid row coverage showing static non-editable cells.
- [ ] 8.4 Run focused tests for the editable line-item cell area.
- [ ] 8.5 Run TypeScript validation.
- [ ] 8.6 Run Storybook outside the sandbox and manually inspect the welded popover behavior in the production stories.
