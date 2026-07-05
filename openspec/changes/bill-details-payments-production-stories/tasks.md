## 1. Fixture Baseline

- [x] 1.1 Create reusable invoice story fixtures or fixture builders for bills, line items, payments, taxes, discounts, and payment modes.
- [x] 1.2 Update the existing `InvoiceTable` stories to consume the shared fixtures where practical.
- [x] 1.3 Ensure fixture totals remain internally consistent across `totalAmountWithoutTaxAndDiscount`, `totalTax`, `totalDiscounts`, `totalActualPayments`, `balance`, and line item totals.

## 2. Storybook Runtime Mocks

- [x] 2.1 Add or extend Storybook mocks for `@openmrs/esm-framework` APIs used by `BillDetails` and `Payments`.
- [x] 2.2 Add or extend Storybook mocks for `@openmrs/esm-patient-common-lib` components used by `Payments`.
- [x] 2.3 Mock payment mode data and payment submission side effects so `Payments` renders without a live backend.
- [x] 2.4 Keep mocks at runtime boundaries and avoid changing production component props only for Storybook.

## 3. BillDetails Production Stories

- [x] 3.1 Add a focused `BillDetails` story file that imports and renders the production component.
- [x] 3.2 Add a pending bill story showing invoice summary, actions, `InvoiceTable`, and `Payments` together.
- [x] 3.3 Add a story with existing line-item discounts and taxes so current table and payment summary values are visible.
- [x] 3.4 Add a paid or closed bill story showing production status-gated behavior.

## 4. Payments Production Stories

- [x] 4.1 Add a focused `Payments` story file that imports and renders the production component.
- [x] 4.2 Add a pending payment summary story showing total amount, discount, total tendered, amount due, and payment controls.
- [x] 4.3 Add a selected line items story using selected unpaid line items.
- [x] 4.4 Add an existing discount and tax summary story.
- [x] 4.5 Add a paid bill story showing the production paid state.

## 5. Scope Guardrails

- [x] 5.1 Confirm no bill-level discount controls, bill-level discount calculations, mutation behavior, or backend payload assumptions are introduced.
- [x] 5.2 Confirm the stories document current production behavior only and are ready to support a later total bill discount change.
