## Context

Invoice bill details render the line-items table in `bill-details.component.tsx` and the settlement/payment summary in `payments.component.tsx`. Line-item discounts already use `EditableDiscountCell`, which combines fixed-amount inline editing with a trailing `%` affordance backed by an inline popover. The billing resource layer exposes `updateBillAdditionalDiscount`, and mapped bill data can carry `additionalDiscount` separately from line-item discounts.

The requested field is a bill-level settlement control, not table data:

```text
┌───────────────────────────────┐
│ Line items table              │
│   item row                    │
│   item row                    │
│   + Add item row              │
├───────────────────────────────┤
│             Additional Discount: [ amount ] % │
├───────────────────────────────┤
│ Payments + summary            │
└───────────────────────────────┘
```

## Goals / Non-Goals

**Goals:**

- Add the mockup's `Additional discount` field below line items and above payments.
- Keep the control outside the invoice `DataTable` rows so sorting, selection, search, and line numbering remain unchanged.
- Reuse the inline discount-cell interaction model: fixed amount editing on the amount surface, and percent editing from the trailing `%` affordance.
- Persist valid changes through the bill-level additional-discount update operation.
- Refresh bill data after a successful save and keep payment summary totals consistent with `additionalDiscount`.
- Display but disable the control for closed bills.

**Non-Goals:**

- Do not add backend persistence or change the backend settlement model in this UI-field change.
- Do not create a synthetic line item, waiver, payment, or line-item discount for the additional discount.
- Do not add sponsor or comment inputs to the bill-level discount popover.
- Do not introduce an `Apply` button workflow for this field.
- Do not alter existing inline line-item discount behavior.

## Decisions

### Render the field as a bill-level sibling between table and payments

The additional discount UI should be rendered from the bill details page layout, positioned after `InvoiceTable` and before `Payments`. A dedicated component such as `AdditionalDiscountControl` can own formatting, validation, save state, and the percent popover while receiving bill values and callbacks from `BillDetails`.

Alternative considered: keep the field inside the payments summary panel. Rejected because the mockup places it as a bridge between line-item editing and payment settlement, and because the control should not be visually grouped with payment method entry.

Alternative considered: add another row to the table. Rejected because the control is not line-item content and must not participate in table search, selection, column layout, or row actions.

### Reuse inline discount-cell behavior instead of a plain number input

The fixed amount surface should behave like existing inline numeric cells: click/focus to edit, commit on Enter or blur, cancel/restore on invalid or failed save. The trailing `%` should open a compact popover using the same interaction pattern as line-item discount cells.

The bill-level percent popover should include:

- a percent input,
- a clear action,
- no sponsor field,
- no comment field,
- no separate `Apply` button.

Alternative considered: Carbon `NumberInput` plus explicit apply. Rejected because the user asked for the `%` icon behavior to match inline discount cells.

### Calculate percent from the discountable bill amount

Percent editing should convert the entered percent into a fixed additional discount amount using the current discountable bill amount before the additional discount is applied:

```text
percentBase = max(0, currentAmountDue + currentAdditionalDiscount)
nextAdditionalDiscount = round(percentBase * percent / 100)
```

The UI should validate that the final amount is not negative and does not exceed the maximum allowed bill-level discount amount. If the backend supplies stricter eligibility, backend validation remains authoritative and failed saves should restore the server-confirmed value.

Alternative considered: use gross line subtotal plus tax. Rejected because it can discount already-settled value.

Alternative considered: calculate from the already-discounted amount due. Rejected because increasing or decreasing an existing additional discount would compound against itself.

### Persist on commit and revalidate

Valid fixed-amount commits, valid percent edits, and clear actions should call `updateBillAdditionalDiscount(bill.uuid, amount)`. On success, the UI should show success feedback and revalidate or refresh the invoice bill data so totals and payment validation use server-confirmed state. On failure, the UI should show error feedback and not permanently replace the displayed value with the failed draft.

Alternative considered: only update local editable bill state. Rejected because payment eligibility and status are server-backed and can drift after settlement operations.

### Keep summary math explicit

The UI should continue to distinguish these concepts:

```text
grossTotal      = line subtotal + tax before any displayed discount
lineDiscounts   = sum(line item discounts)
additional      = bill.additionalDiscount
displayDiscount = lineDiscounts + additional
amountDue       = grossTotal - displayDiscount - payments - waivers - deposits
```

The implementation may use mapped bill fields if they already provide these values, but tests should verify the user-visible totals rather than depending only on internal field names.

## Risks / Trade-offs

- [Risk] The field duplicates an existing plain input in the payments component during migration. -> Mitigation: replace or relocate that UI so only one additional discount editor is visible.
- [Risk] Percent base semantics can be misunderstood on partially paid bills. -> Mitigation: cover existing-additional-discount and partial-payment cases in tests.
- [Risk] The bill-level field may visually drift from the right-side totals column at smaller widths. -> Mitigation: add responsive layout rules and verify desktop and mobile story states.
- [Risk] API failures can leave draft UI out of sync with server state. -> Mitigation: restore server-confirmed value on failed save and revalidate after successful save.
- [Risk] Reusing line-item discount internals too tightly could leak sponsor/comment behavior into bill-level editing. -> Mitigation: extract only shared numeric/percent editing primitives or configure the popover explicitly for bill-level use.
