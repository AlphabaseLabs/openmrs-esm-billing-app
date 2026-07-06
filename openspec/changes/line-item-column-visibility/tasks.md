## 1. Column Registry

- [x] 1.1 Extract the invoice line items table columns into a registry with stable ids, labels, required/hideable metadata, renderers, className/alignment metadata, and default visibility.
- [x] 1.2 Mark required columns as non-hideable: selection/control columns, Bill item, Price, Total, and Actions.
- [x] 1.3 Mark optional columns as hideable where appropriate: Number, Status, Quantity, Discount, and Tax.
- [x] 1.4 Update table header rendering to derive headers from the filtered visible column registry.
- [x] 1.5 Update row cell rendering to derive cells from the same filtered visible column registry.

## 2. Visibility State and Persistence

- [x] 2.1 Add a visible-column state model that stores visible optional column ids while always including required columns.
- [x] 2.2 Add localStorage persistence using a billing-app scoped key for the line items table visible-column preference.
- [x] 2.3 Add safe preference loading that ignores unknown ids, repairs attempts to hide required columns, and falls back to defaults for malformed data.
- [x] 2.4 Close any active editable cell before applying a visibility change that hides the active column.

## 3. Column Visibility UI

- [x] 3.1 Add a column visibility control to the line items table toolbar near Search/Add bill item.
- [x] 3.2 Render hideable optional columns as checkable options in the control.
- [x] 3.3 Exclude required columns from hideable options.
- [x] 3.4 Ensure hiding/showing columns keeps the table in registry-defined column order.

## 4. Preserve Billing Behavior

- [x] 4.1 Confirm hidden Discount and Tax columns continue to participate in totals and bill calculations.
- [x] 4.2 Confirm hidden editable columns preserve underlying line item values and do not alter save payload shape.
- [x] 4.3 Confirm visible editable columns still support existing Price, Discount, Quantity, and Bill Item editing behavior.
- [x] 4.4 Confirm hiding columns does not leave orphaned popovers, inline editors, or focusable controls.

## 5. Storybook and Tests

- [x] 5.1 Add focused unit tests for registry filtering, required column protection, and persisted preference repair.
- [x] 5.2 Add component tests for hiding and showing optional columns while preserving header/body alignment.
- [x] 5.3 Add tests for hidden financial columns preserving calculations and line item data.
- [x] 5.4 Add Storybook coverage for default columns, compact view with optional columns hidden, and restored persisted preferences.
- [x] 5.5 Add a Storybook/DOM smoke check that verifies header and body cell counts stay synchronized after toggling columns.

## 6. Validation

- [x] 6.1 Run focused invoice table and editable line item tests.
- [x] 6.2 Run focused Storybook smoke validation against the column visibility stories.
- [x] 6.3 Run TypeScript validation.
