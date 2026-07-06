## 1. Summary Stat Geometry

- [x] 1.1 Replace the desktop/tablet summary stats distribution in `invoice.scss` with deterministic lanes instead of `justify-content: space-between`.
- [x] 1.2 Ensure the invoice action button area remains in a stable lane and does not shift when the Total amount value length changes.
- [x] 1.3 Preserve the existing less-than-desktop stacked layout for summary stats and actions.

## 2. Invoice Table Column Geometry

- [x] 2.1 Define stable column width rules for selection, Number, Bill item, Status, Quantity, Price, Discount, Tax, Total, and Action columns in `invoice-table.scss`.
- [x] 2.2 Apply the stable column classes through existing `InvoiceTable` header/cell class hooks without replacing Carbon `DataTable`.
- [x] 2.3 Keep numeric columns right-aligned and prevent longer formatted numbers from expanding adjacent columns.
- [x] 2.4 Keep the Bill item column readable for production service names without pushing Status and later columns horizontally.
- [x] 2.5 Preserve selectable paid/pending row behavior and action button layout.

## 3. Editable Cell Layout Neutrality

- [x] 3.1 Confirm editable bill item, price, and discount affordances remain absolutely positioned or otherwise layout-neutral.
- [x] 3.2 Ensure inline editors and popovers do not add intrinsic width to table columns.
- [x] 3.3 Avoid truncating displayed content solely to make room for the editable affordance.

## 4. Focused Story Coverage

- [x] 4.1 Add or update a focused Storybook state that shows the short-value case (`Consultation`, low total) and long-value case (`Clear Aligner`, high total) using production components.
- [x] 4.2 Ensure the focused story can be used to visually compare column lanes before and after changing the bill item.

## 5. Validation

- [x] 5.1 Run focused invoice table and bill details tests if requested.
- [x] 5.2 Run TypeScript validation if requested.
- [x] 5.3 Run Storybook outside the sandbox and inspect the affected BillDetails/InvoiceTable stories if requested.
