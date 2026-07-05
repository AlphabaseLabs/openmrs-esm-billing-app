## 1. Production Data Contracts

- [x] 1.1 Update the `BillableService` and service price types so service prices include `uuid`, `name`, `price`, and optional `paymentMode` from the existing billable services API.
- [x] 1.2 Add production helpers to normalize billable service labels, extract line-item service UUIDs, find selected service prices, and choose the default service price using `Default` first and first returned price second.
- [x] 1.3 Add production helpers for numeric parsing, currency-safe line subtotal calculation, discount total calculation, line total calculation, and bill-level total/balance recomputation.
- [x] 1.4 Add production payload helpers for price, discount, and bill item commits using the existing `BillLineItemUpdate` shape and matching existing edit-bill workspace semantics.

## 2. Shared Editable Cell Infrastructure

- [x] 2.1 Create the production editable line-item cells module under `src/invoice/` with shared types for editable columns, active editor keys, commit results, and editability checks.
- [x] 2.2 Implement a single active editor controller in `InvoiceTable` so only one inline input, popover, or ComboBox can be active across all rows.
- [x] 2.3 Implement shared commit/cancel behavior for Enter, Space, Escape, Tab, blur, and click-away without double-submitting saves.
- [x] 2.4 Add shared SCSS for plain-cell rest state, hover/focus affordances, numeric right alignment, bordered options icons, validation state, and unclipped floating layers.

## 3. Price Cell

- [x] 3.1 Implement `EditablePriceCell` as a production component that renders formatted text at rest and a hover-revealed options icon only for editable rows.
- [x] 3.2 Implement price number inline edit with Carbon `NumberInput`, focus/select-on-open, non-empty numeric validation, minimum zero validation, Enter/Tab/blur save, and Escape cancel.
- [x] 3.3 Implement the price options popover using available service prices, current selection highlighting by amount, current value display, and `Label - (amount)` option labels.
- [x] 3.4 Persist typed price saves with `price` and preset saves with `price`, `priceName`, and `priceUuid`, then trigger bill recomputation on success.

## 4. Discount Cell

- [x] 4.1 Implement `EditableDiscountCell` as a production component that renders formatted text at rest and a hover-revealed options icon only for editable rows.
- [x] 4.2 Implement discount number inline edit for absolute discount amount with minimum zero validation and maximum line subtotal validation.
- [x] 4.3 Implement the discount form popover with amount, percent, discount sponsor, and comment fields, including amount/percent synchronization.
- [x] 4.4 Persist valid discount edits as `discounts` payloads and trigger bill recomputation on success.

## 5. Bill Item Cell

- [x] 5.1 Implement `EditableBillItemCell` as a production component that renders the item label at rest and opens a Carbon `ComboBox` for editable rows.
- [x] 5.2 Implement contains-match filtering, current item preselection, no-results behavior, selection commit, and Escape/blur cancel behavior.
- [x] 5.3 On bill item selection, refresh available prices from the selected service and reset row price to the selected service default/first price.
- [x] 5.4 Persist bill item selection with the selected billable service identifier plus reset `price`, `priceName`, and `priceUuid`, then trigger bill recomputation on success.

## 6. Invoice Table and Bill Details Integration

- [x] 6.1 Replace static `TableCell` rendering for `billItem`, `price`, and `discount` columns with the production editable cell components while preserving other columns unchanged.
- [x] 6.2 Preserve existing row selection behavior, including disabled selection for locked statuses and automatic inclusion of paid line items.
- [x] 6.3 Add edited bill state ownership in `BillDetails`, synchronize it from incoming `bill` prop changes, and pass the edited bill to `InvoiceTable`, `Payments`, `InvoiceActions`, and invoice summary rendering.
- [x] 6.4 Wire successful cell commits to update the edited bill state and recompute `lineItems`, `totalAmount`, `totalDiscounts`, `billLineItemDiscounts`, `totalTax`, `balance`, and payment-derived values where present.
- [x] 6.5 Handle failed saves by preserving the previous committed value and showing an error notification.

## 7. Focused Production Stories

- [x] 7.1 Add or update `BillDetails` stories for a default pending bill using the real production `BillDetails`, `InvoiceTable`, `Payments`, and editable cell components.
- [x] 7.2 Add or update `InvoiceTable` stories for editable pending rows, locked paid rows, selected rows, mixed statuses, and loading state using production components only.
- [x] 7.3 Add focused story states for price picker open, discount form open, Bill item ComboBox open, invalid numeric values, and constrained table overflow without introducing mock editable-cell components.
- [x] 7.4 Ensure Storybook mocks remain limited to OpenMRS runtime side effects and boundary data fixtures, not replacement UI behavior.

## 8. Tests and Verification

- [x] 8.1 Add unit tests for numeric parsing, discount conversion, default price selection, billable service matching, and bill recomputation helpers.
- [x] 8.2 Add component tests for Price cell inline edit, Price picker selection, validation failure, and locked-row behavior.
- [x] 8.3 Add component tests for Discount cell inline edit, form synchronization, validation failure, and locked-row behavior.
- [x] 8.4 Add component tests for Bill item ComboBox filtering, selection commit, no-match behavior, and price reset.
- [x] 8.5 Add integration coverage that saving a valid edit calls `updateBillLineItem`, updates the row, and updates the invoice summary displayed by `BillDetails`.
- [x] 8.6 Confirm no new Storybook-only editable cell implementation exists and no existing table-engine behavior regressed.
