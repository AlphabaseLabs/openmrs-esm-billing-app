## 1. Invoice Table Rendering

- [x] 1.1 Add a manual final `TableRow` in `src/invoice/invoice-table.component.tsx` after the mapped line item rows inside `TableBody`.
- [x] 1.2 Gate the final add row with `!bill.closed`, matching the existing toolbar add action visibility.
- [x] 1.3 Render one `TableCell` in the final add row with `colSpan={columnLayout.columns.length}`.
- [x] 1.4 Render a single `Add item` action inside the row and wire its `onClick` to the existing `handleAddBillItem` callback.
- [x] 1.5 Ensure the add row is not added to `tableRows` and does not receive `getRowProps`, `TableSelectRow`, normal row cells, line item action buttons, or line item numbering.

## 2. Styling and Text

- [x] 2.1 Add dedicated SCSS classes in `src/invoice/invoice-table.scss` for the final add row, spanning cell, and add action.
- [x] 2.2 Style the row as a quiet full-width table action with a leading plus affordance and stable row height.
- [x] 2.3 Add an `addItem` translation key with fallback text `Add item` for the row action.
- [x] 2.4 Preserve existing toolbar `Add bill item` text, styling, and behavior.

## 3. Tests

- [x] 3.1 Update `src/invoice/invoice-table.component.test.tsx` to assert open bills render both the existing toolbar `Add bill item` action and the final-row `Add item` action.
- [x] 3.2 Add a test proving clicking the final-row `Add item` action launches `billing-form` with the same workspace props as the toolbar action.
- [x] 3.3 Add a test proving closed bills do not render the final-row `Add item` action.
- [x] 3.4 Add a test proving the final-row cell colspan equals the rendered column count when the selection column is present.
- [x] 3.5 Add a test proving the final-row cell colspan remains aligned after optional columns are hidden.
- [x] 3.6 Add a test proving the final add row is not selectable and does not affect displayed line item numbering.

## 4. Verification

- [x] 4.1 Run the targeted invoice table test suite.
- [x] 4.2 Run TypeScript checks for the billing app if available in the repo scripts.
- [x] 4.3 Verify the invoice table story or local UI shows the final `+ Add item` row directly after line item rows and before the payments section.
