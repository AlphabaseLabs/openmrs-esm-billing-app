## 1. Current-State Diagnosis

- [x] 1.1 Locate the current Quantity column rendering in the invoice line-item table.
- [x] 1.2 Identify the existing editability predicate used by Price, Discount, and Bill Item cells.
- [x] 1.3 Identify the existing line-item update and recalculation helpers used by editable Price and Discount.
- [x] 1.4 Confirm the current static Quantity layout, alignment, width, and Storybook baseline before changing it.

## 2. Quantity Adapter Implementation

- [x] 2.1 Add an `EditableQuantityCell` billing adapter near the existing editable line-item cell adapters.
- [x] 2.2 Render `EditableQuantityCell` through `EditableNumericCell` from `@alphabase/editable-carbon-table-cell-kit`.
- [x] 2.3 Configure Quantity as inline-only by not passing popover configuration.
- [x] 2.4 Preserve the current compact Quantity cell geometry with a Quantity-specific class or alignment option.
- [x] 2.5 Keep non-editable rows rendering static Quantity text.

## 3. Quantity Validation and Commit Behavior

- [x] 3.1 Parse Quantity input as a positive whole number.
- [x] 3.2 Commit valid Quantity values on Enter.
- [x] 3.3 Commit valid Quantity values on blur.
- [x] 3.4 Cancel edits and restore the prior Quantity value on Escape.
- [x] 3.5 Reject empty, zero, negative, decimal, and non-numeric values without calling the update flow.
- [x] 3.6 Restore the previous display value after invalid input is rejected.

## 4. Billing Update and Recalculation

- [x] 4.1 Create the line-item update payload containing the new Quantity value.
- [x] 4.2 Reuse existing billing recalculation helpers so amount, discount, tax, total, and invoice totals update consistently.
- [x] 4.3 Ensure Quantity updates do not alter Price, Discount, or Bill Item adapter behavior.
- [x] 4.4 Confirm paid, closed, disabled, and otherwise non-editable bill states block Quantity editing.

## 5. Tests

- [x] 5.1 Add focused tests for opening the Quantity inline editor.
- [x] 5.2 Add tests for valid Quantity commit on Enter and blur.
- [x] 5.3 Add tests for Escape cancel behavior.
- [x] 5.4 Add tests for invalid Quantity rejection and prior-value restore.
- [x] 5.5 Add tests proving non-editable rows keep static Quantity text.
- [x] 5.6 Add tests proving the adapter uses the shared editable Carbon numeric cell mechanics.
- [x] 5.7 Add tests proving Quantity update payloads and recalculated totals are correct.
- [x] 5.8 Add geometry tests proving Quantity, Price, Discount, Tax, Total, and Action columns do not move or resize when Quantity editing opens, rejects, commits, or cancels.

## 6. Storybook Validation

- [x] 6.1 Update production BillDetails stories to exercise editable Quantity in pending bill scenarios.
- [x] 6.2 Confirm paid and closed bill stories render Quantity as read-only.
- [x] 6.3 Validate in Storybook that opening Quantity editor does not render a popover.
- [x] 6.4 Validate in Storybook that opening Quantity editor does not resize table columns.
- [x] 6.5 Validate in Storybook that existing Price, Discount, and Bill Item editors still behave as before.

## 7. Final Validation

- [x] 7.1 Run focused Quantity adapter tests.
- [x] 7.2 Run existing editable Price, Discount, and Bill Item adapter tests.
- [x] 7.3 Run editable Carbon table cell kit tests if shared props or styles are touched.
- [x] 7.4 Run TypeScript validation.
- [x] 7.5 Run Storybook geometry smoke validation against the production BillDetails pending bill story.
