# Billing Invoice Playwright Regression Spec

This is a non-executable reference spec for the future Playwright regression suite. It lists the complete invoice scenario catalog that should be covered one by one.

## Purpose

Verify billing invoice behavior across creation, inline editing, line discounts, Bulk discount editing, full and partial payment, refunds, closing, reopening, payment deletion, line deletion, and bill deletion.

Prefer one independent bill per scenario. Chain scenarios only when the user flow itself requires continuity, such as partial payment followed by remaining payment.

## Shared Setup

- Use API setup for deterministic fixtures.
- Use UI actions for the behavior being verified.
- Assert both visible UI and backend REST state.
- Keep all amounts in cents-safe decimal values.
- Use unique test data names per scenario.
- Ensure the authenticated provider has an open cashier timesheet.
- Prefer known billable services and payment modes, or create dedicated test fixtures.
- Clean up only records created by the scenario.

## Shared Money Invariants

```text
lineSubtotal       = price * quantity
lineDiscount       = sum(line.discounts.amount)
lineTax            = sum(line.taxes.amount)
lineTotal          = lineSubtotal - lineDiscount + lineTax
lineItemsTotal     = sum(non-voided lineTotal)
billTotal          = lineItemsTotal
displayDiscount    = sum(lineDiscount)
amountDue          = billTotal - totalActualPayments
Bulk discount      = UI editor over line-item discounts
```

## Scenario Matrix

### BI-001: Simple Add Item, Payment, Verify Updates

Setup:

- Create a bill with one line item, no discount, no tax assumptions beyond fixture defaults.

Actions:

- Open invoice.
- Verify line item appears.
- Pay full amount due.

Expected:

- Bill status changes from `PENDING` to `PAID`.
- Line status becomes `PAID`.
- `totalActualPayments == original amountDue`.
- `balance == 0`.
- Payment history displays the payment.
- Dashboard/history views show updated paid state.

### BI-002: Add More Items, Edit Quantity, Line Discount, Full Payment

Setup:

- Create a bill with multiple line items.

Actions:

- Edit quantity for one line.
- Apply a fixed line-level discount.
- Pay full amount due.

Expected:

- Edited line subtotal uses edited quantity.
- Discount persists on the edited line only.
- Bill discount summary includes line discount.
- Full payment sets bill and payable lines to `PAID`.
- `balance == 0`.

### BI-003: Add More Items, Edit Quantity, Line Discount, Partial Payment

Setup:

- Create a bill with multiple line items.

Actions:

- Edit quantity for one line.
- Apply a fixed line-level discount.
- Pay less than total amount due.

Expected:

- Bill status becomes `POSTED`.
- Payment history shows one payment.
- `totalActualPayments == partialPayment`.
- `balance == amountDueBeforePayment - partialPayment`.
- Line allocation state matches selected payment behavior.

### BI-004: Add Remaining Payment

Setup:

- Start from a bill with a valid partial payment state.

Actions:

- Pay exactly the remaining balance.

Expected:

- Bill status becomes `PAID`.
- `balance == 0`.
- `totalActualPayments == firstPayment + remainingPayment`.
- Payment history shows both payments.
- No duplicate or voided payment is counted in totals.

### BI-005: Add Items, Line Discount, Bulk Discount

Setup:

- Create a bill with multiple lines.
- Apply at least one line-level discount.

Actions:

- Edit Bulk discount through the UI.
- Verify invoice summary.

Expected:

- Bulk discount changes persist as line-item discounts.
- Line item taxes recalculate from line subtotals after line discounts.
- Display discount equals `sum(lineDiscounts)`.
- Bill total equals `sum(lineTotals)`.
- Amount due equals `billTotal - totalActualPayments`.

### BI-006: Add Items, Override Price, Discounts, Full Payment

Setup:

- Create a bill with multiple lines.

Actions:

- Override a line price.
- Apply fixed discount.
- Pay full amount due.

Expected:

- Original price and overridden price are distinguishable.
- Line total uses overridden price.
- Discount uses overridden price as base unless product rules specify otherwise.
- Full payment sets bill `PAID`.
- `balance == 0`.

### BI-007: Add Items, Override Price, Discounts, Partial Payment

Setup:

- Create a bill with multiple lines.

Actions:

- Override a line price.
- Apply fixed discount.
- Pay less than amount due.

Expected:

- Override persists.
- Discount persists.
- Bill status is `POSTED`.
- Balance equals discounted overridden total minus tendered payments.

### BI-008: Add Items, Override Price, Percentage Discounts, Partial Payment

Setup:

- Create a bill with multiple lines.

Actions:

- Override a line price.
- Apply percentage discount.
- Pay less than amount due.

Expected:

- Discount stores expected percentage/rate.
- Discount amount equals overridden line base times percentage.
- Bill status is `POSTED`.
- Balance equals expected remaining amount.

### BI-009: Change Already Paid Item Price

Setup:

- Create and fully pay a bill.

Actions:

- Increase price on a paid line through inline edit.

Expected:

- Existing payment allocation is not changed.
- If edited total exceeds allocated amount, line becomes `POSTED`.
- Bill becomes `POSTED`.
- Balance equals edited line total minus allocated amount.
- If edited total remains covered by allocation, line and bill remain `PAID`.

### BI-010: Change Partially Paid Item Price

Setup:

- Create a bill with a partially paid line.

Actions:

- Change the partially paid line price.

Expected:

- Allocation remains unchanged.
- Line amount due recomputes from edited total minus allocation.
- Bill remains `POSTED` unless payments cover the new amount due.
- Summary totals and payment validation use recomputed balance.

### BI-011: Delete Paid Item

Current behavior:

- Backend line item deletion checks for active allocations and rejects deletion when allocations exist.

Actions:

- Attempt to delete a paid line item.

Expected:

- Deletion is rejected while active allocations exist.
- Error explains that associated payments must be removed first.
- Bill totals, payments, and line items remain unchanged.

Alternative user-facing behavior:

- If product wants paid item removal, use refund flow instead of direct deletion.

### BI-012: Delete Payment

Setup:

- Create a bill with at least one payment.

Actions:

- Delete a payment with a reason.

Expected:

- Payment is voided or excluded from active totals.
- `totalActualPayments` decreases by deleted payment amount.
- Bill balance increases accordingly.
- Bill status recomputes from `PAID` to `POSTED` or `PENDING` as appropriate.
- Payment history no longer counts the deleted payment.

### BI-013: Close Bill

Setup:

- Create and fully pay a bill.

Actions:

- Close the bill with a reason.

Expected:

- Closing is allowed only when `balance == 0`.
- Bill has `closed == true`.
- Close reason, closed by, and closed date are persisted.
- Closed bill edit policy is explicit in UI and API behavior.

### BI-014: Reopen Bill, Inline Edit Line Item

Setup:

- Start from a closed bill.

Actions:

- Reopen the bill.
- Change a line item from inline edit.

Expected:

- Bill has `closed == false`.
- Inline edit succeeds.
- Line totals recompute.
- Bill status and balance recompute.
- If edit creates a payment gap, bill becomes `POSTED`.

### BI-015: Refund Item From Bill With Line-Level Discounts

Policy decision:

- Refund amount equals the refunded line net total.

Formula:

```text
refundAmount = refundedLineNetTotal
```

Setup:

- Create a bill with multiple positive line items.
- Apply at least one line-level discount.
- Optionally use Bulk discount to create additional line-item discounts.
- Fully pay the bill.

Actions:

- Refund one paid item.

Expected:

- Original paid line remains unchanged.
- A new negative `CREDITED` line is created.
- Refund line reverses the original line-level discount and tax values proportionally to the refunded line.
- Bill total, tendered amount, and balance reflect the refund policy.
- Refund action is not offered again for the same paid line once matched by a refund line.

Example:

```text
line A net total: 100
line B net total: 300
refund amount for line A: 100
```

### BI-016: Delete Bill

Setup:

- Create a bill with known line items and optional payments depending on supported policy.

Actions:

- Delete or force delete bill with reason.

Expected:

- Bill is voided/deleted according to backend contract.
- Bill no longer appears in default dashboard and history results.
- Direct fetch either fails or returns voided state, depending API contract.
- Associated line items and payments follow backend deletion policy.
- Audit reason is persisted where supported.

## Coverage Split

Recommended smoke subset:

- `BI-001`
- `BI-003`
- `BI-004`
- `BI-005`
- `BI-009`
- `BI-013`
- `BI-014`

Full regression subset:

- `BI-001` through `BI-016`.
