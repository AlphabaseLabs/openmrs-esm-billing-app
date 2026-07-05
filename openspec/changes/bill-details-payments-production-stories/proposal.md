## Why

The next feature work targets bill-level discount behavior in the invoice totals area, but current Storybook coverage only renders the invoice line items table. We need production-code stories for `BillDetails` and `Payments` first so the total discount design can be evaluated against the real invoice layout, payment summary, selected line item behavior, and current discount calculations.

## What Changes

- Add focused Storybook stories for the real `BillDetails` production component.
- Add focused Storybook stories for the real `Payments` production component.
- Reuse realistic billing fixtures across `InvoiceTable`, `BillDetails`, and `Payments` stories where practical.
- Mock external runtime dependencies needed by these production components in Storybook.
- Cover pending bills, existing line-item discounts, selected line items, paid/closed states, amount due states, and payment validation-relevant states.
- Defer all bill-level discount UI, mutation behavior, payload design, and backend integration to a later change.

## Capabilities

### New Capabilities

- `bill-details-payments-production-stories`: Storybook stories that render production `BillDetails` and `Payments` components as the baseline for later total bill discount work.

### Modified Capabilities

- None.

## Impact

- Affected code: Storybook stories, Storybook mocks, and shared story fixtures for invoice/billing components.
- Production runtime behavior: no intended changes.
- APIs: no intended changes.
- Dependencies: no new runtime dependencies expected.
