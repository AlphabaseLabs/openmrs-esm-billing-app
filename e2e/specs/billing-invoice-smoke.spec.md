# Billing Invoice Playwright Smoke Spec

This is a non-executable reference spec for the future Playwright smoke test. It intentionally describes the target coverage without implementing a `.spec.ts` test yet.

## Purpose

Verify the highest-risk billing invoice paths end to end:

```text
REST setup -> invoice UI -> user action -> REST verification -> UI verification
```

The smoke suite should be small enough to run frequently. It should prove the billing/invoice stack is connected and that the core settlement math is consistent between backend and frontend.

## Shared Setup

Each smoke test should:

- Use the custom Playwright fixture from `e2e/core/test.ts`.
- Authenticate with the existing storage state from global setup.
- Ensure the current provider has an open cashier timesheet before navigating to invoice routes.
- Seed patients, billable services, bills, and payment modes through REST where practical.
- Drive the action under test through the UI.
- Verify final state through REST and through visible invoice UI.
- Use unique receipt/service labels so tests can run against shared environments.
- Clean up only records created by the test.

## Shared Money Invariants

```text
lineSubtotal       = price * quantity
lineTotal          = lineSubtotal - lineDiscount + tax
lineItemsTotal     = sum(lineTotal)
billTotal          = lineItemsTotal - additionalDiscount
displayDiscount    = sum(lineDiscount) + additionalDiscount
amountDue          = billTotal - totalActualPayments
additionalDiscount = bill-level, tax-neutral, not copied into line items
```

## Smoke Scenarios

### SMK-001: Simple Item Full Payment

Source scenario: `BI-001`.

Setup:

- Create one pending bill with one active line item.
- Use a fixed known price and no discounts.

UI actions:

- Open `/spa/home/billing/patient/:patientUuid/:billUuid`.
- Verify invoice number, line item, payment panel, total amount, total tendered, and amount due.
- Enter amount equal to current balance.
- Process payment from the invoice payment panel.

Expected:

- Payment request succeeds.
- Bill has one non-voided payment.
- `totalActualPayments == originalBalance`.
- `balance == 0`.
- Bill status is `PAID`.
- Line item status is `PAID`.
- Payment history displays the payment method and tendered amount.
- Payment form is hidden or disabled after balance reaches zero.

### SMK-002: Partial Payment Then Remaining Payment

Source scenarios: `BI-003`, `BI-004`.

Setup:

- Create one bill with at least two active line items.
- Edit one line quantity or seed quantity greater than one.
- Apply a line-level fixed discount to one line.

UI actions:

- Open invoice.
- Pay less than the full amount due.
- Verify posted/partial state.
- Pay the exact remaining balance.

Expected after partial payment:

- Bill status is `POSTED`.
- `balance == amountDueBeforePayment - partialPayment`.
- `totalActualPayments == partialPayment`.
- Payment history shows exactly one payment.
- Allocations are present when selected line items were paid.

Expected after remaining payment:

- Bill status is `PAID`.
- `balance == 0`.
- `totalActualPayments == partialPayment + remainingPayment`.
- Payment history shows both payments.

### SMK-003: Additional Discount Settlement

Source scenario: `BI-005`.

Setup:

- Create a bill with at least two active line items.
- Apply at least one line-level discount.
- Apply a bill-level additional discount.

UI actions:

- Open invoice.
- Verify payment summary.
- Pay exactly `billTotal`.

Expected:

- Line item totals are unchanged by the additional discount.
- Line item taxes are unchanged by the additional discount.
- Discount summary shows `lineDiscounts + additionalDiscount`.
- Bill total equals `sum(lineTotals) - additionalDiscount`.
- Amount due uses `billTotal - totalActualPayments`.
- Paying the discounted amount sets `balance == 0`.
- Bill status becomes `PAID`.

### SMK-004: Paid Line Price Edit Creates Gap

Source scenario: `BI-009`.

Setup:

- Create and fully pay a one-line bill.

UI actions:

- Reopen or keep bill editable according to current policy.
- Increase the paid line price through inline edit.

Expected:

- Existing payment allocation remains unchanged.
- Edited line total increases.
- Line status becomes `POSTED` if edited total exceeds allocated amount.
- Bill status becomes `POSTED`.
- Bill balance equals edited total minus allocated amount.
- Payment panel allows paying the new gap.

### SMK-005: Close, Reopen, Inline Edit

Source scenarios: `BI-013`, `BI-014`.

Setup:

- Create and fully pay a bill.

UI actions:

- Close the bill with a reason.
- Verify closed state.
- Reopen the bill.
- Edit a line item through inline edit.

Expected:

- Closing is allowed only when `balance == 0`.
- Closed bill has `closed == true` and close reason persisted.
- Reopened bill has `closed == false`.
- Inline edit after reopen updates line values, bill totals, status, and balance.

## Not In Smoke

The following are intentionally regression coverage, not smoke coverage:

- Every price override branch.
- Every discount input mode.
- Delete payment branch matrix.
- Paid item deletion/rejection details.
- Refund branch matrix.
- Delete bill behavior.
