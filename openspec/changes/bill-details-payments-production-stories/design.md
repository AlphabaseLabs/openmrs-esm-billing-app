## Context

The `total-bill-discount` branch is intended to explore a bill-level discount in the invoice totals area. The current Storybook baseline renders the production `InvoiceTable`, but that table does not own the target area. The relevant production composition is `BillDetails`, which renders invoice summary details, `InvoiceTable`, `Payments`, and invoice actions. The relevant total/amount due area is inside `Payments`.

Before adding bill-level discount behavior, Storybook needs production-code stories for `BillDetails` and `Payments` so we can compare proposed UI against the real component tree, real calculated summary fields, existing selected-line-item behavior, and existing line-item discount display.

## Goals / Non-Goals

**Goals:**

- Add production-code Storybook stories for `BillDetails`.
- Add production-code Storybook stories for `Payments`.
- Use realistic bill, line item, payment, tax, and discount fixtures.
- Reuse shared invoice story fixtures where practical to reduce fixture drift.
- Mock only external runtime boundaries required by the components, including OpenMRS shell APIs, payment modes, patient-common UI dependencies, and navigation/workspace side effects.
- Capture current behavior for existing line-item discounts, selected rows, paid/closed bills, amount due, and payment validation states.

**Non-Goals:**

- No bill-level discount UI.
- No bill-level discount persistence or payload design.
- No backend API assumptions for bill-level discounts.
- No changes to production calculations.
- No full app shell recreation beyond what `BillDetails` and `Payments` already render.

## Decisions

### Render production components directly

Stories MUST import and render `src/invoice/bill-details.component.tsx` and `src/invoice/payments/payments.component.tsx`. They MUST NOT recreate the invoice totals section or payment summary from screenshot-only JSX.

Alternative considered: build a screenshot-matching prototype story first. Rejected because it would create a second source of truth before we understand the production component boundaries.

### Add a shared invoice fixture module

The existing `InvoiceTable` story already has realistic fixtures. This change should move or copy those fixtures into a shared story fixture module, then use them from `InvoiceTable`, `BillDetails`, and `Payments` stories as appropriate.

Alternative considered: duplicate separate fixtures in every story. Rejected because total amount, discount, tax, and balance values can drift.

### Mock external runtime boundaries

`BillDetails` and `Payments` pull in OpenMRS shell behavior, navigation, payment modes, modals, snackbars, patient-common components, and payment-processing hooks. Storybook should mock those boundaries while leaving the production component logic intact.

Alternative considered: refactor production components to accept many dependency override props. Rejected for this baseline because it would change production APIs only to support stories.

### Cover current discount semantics only

Stories should show the current state: line-item discounts contribute to `bill.totalDiscounts`, and `Payments` displays `Discount` using that field. They should not introduce a bill-level discount model.

Alternative considered: include placeholder total discount controls now. Rejected because that would mix baseline documentation with the next feature change.

## Risks / Trade-offs

- Story fixtures can drift from backend mapped data -> use fixture helpers that resemble `MappedBill` and include all summary fields used by `BillDetails` and `Payments`.
- Runtime mocks can hide integration problems -> keep mocks narrow and document which dependencies are mocked.
- `Payments` has form and validation behavior -> stories should include safe payment-mode fixtures and avoid requiring real payment submission.
- Full invoice-page parity may require patient header and app shell -> keep this change scoped to `BillDetails` and `Payments`, not `Invoice`.
