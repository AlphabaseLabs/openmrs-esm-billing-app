## 1. Component Placement and Structure

- [x] 1.1 Add a dedicated bill-level additional discount control component or equivalent layout unit near the invoice bill details view.
- [x] 1.2 Render the control after `InvoiceTable` and before `Payments`, aligned with the settlement area shown in the mockup.
- [x] 1.3 Keep the control outside the invoice table rows, search, selection, sorting, numbering, and action-column behavior.
- [x] 1.4 Remove or replace any plain additional-discount input in the payments panel so only one additional discount editor is visible.
- [x] 1.5 Render the current `bill.additionalDiscount` value with a zero fallback for missing values.
- [x] 1.6 Display the control in a read-only/disabled state for closed bills.

## 2. Fixed Amount Editing

- [x] 2.1 Reuse or extract the existing editable numeric-cell behavior for the additional discount amount surface.
- [x] 2.2 Commit valid fixed-amount edits on Enter and blur.
- [x] 2.3 Reject fixed amounts below `0` or above the current discountable bill amount before additional discount.
- [x] 2.4 Show validation feedback for invalid fixed amounts and restore the previously persisted value when the edit is canceled or rejected.
- [x] 2.5 Ensure fixed-amount editing is unavailable for closed bills.

## 3. Percent Affordance Behavior

- [x] 3.1 Add a trailing `%` affordance to the additional discount control using the same visual and interaction pattern as inline line-item discount cells.
- [x] 3.2 Open a compact percent popover from the `%` affordance.
- [x] 3.3 Include a percent input and clear action in the popover.
- [x] 3.4 Omit line-item-only sponsor and comment fields from the bill-level popover.
- [x] 3.5 Avoid a separate `Apply` button; persist valid percent changes using the inline discount-cell commit behavior.
- [x] 3.6 Preserve focused percent draft text while editing and normalize percent display on blur.
- [x] 3.7 Calculate percent edits from `max(0, currentAmountDue + currentAdditionalDiscount)`.
- [x] 3.8 Persist clear action as an additional discount value of `0`.

## 4. Persistence and State Synchronization

- [x] 4.1 Wire valid fixed amount, percent, and clear commits to `updateBillAdditionalDiscount(bill.uuid, amount)`.
- [x] 4.2 Send the additional discount amount in the API request payload without mutating line-item payloads.
- [x] 4.3 Show success feedback when the update succeeds.
- [x] 4.4 Show error feedback when the update fails.
- [x] 4.5 Revalidate or refresh invoice bill data after successful additional discount updates.
- [x] 4.6 Keep or restore the server-confirmed additional discount value after failed updates.

## 5. Totals and Payment Behavior

- [x] 5.1 Ensure the summary discount row displays line-item discounts plus `bill.additionalDiscount`.
- [x] 5.2 Ensure the summary total amount row remains gross line subtotal plus tax before displayed discounts.
- [x] 5.3 Ensure amount due and payment overpayment validation use the discounted amount due after additional discount.
- [x] 5.4 Ensure updating additional discount does not mutate line-item discounts, line totals, line numbering, selection, sorting, or search behavior.
- [x] 5.5 Keep existing `+ Add item` final-row behavior unchanged.

## 6. Verification

- [x] 6.1 Add or update unit tests for rendering placement, zero fallback, and read-only closed bill behavior.
- [x] 6.2 Add or update interaction tests for fixed amount commit, invalid fixed amount rejection, percent popover editing, and clear action.
- [x] 6.3 Add or update API interaction tests for successful and failed `updateBillAdditionalDiscount` calls.
- [x] 6.4 Add or update summary/payment tests for displayed discount, total amount, amount due, and overpayment validation.
- [x] 6.5 Add or update tests proving additional discount edits do not mutate line-item data or table behavior.
- [x] 6.6 Add or update Storybook coverage for the open bill, closed bill, and existing additional discount states.
- [x] 6.7 Run the focused frontend test suite for invoice bill details, payments, billing resource mapping, and editable line-item recomputation.
- [x] 6.8 Run OpenSpec validation for `add-invoice-additional-discount-field`.
