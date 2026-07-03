## 1. Replace Prototype Story Direction

- [x] 1.1 Remove or rename the screenshot-derived inline edit story so it is not presented as the production invoice table baseline.
- [x] 1.2 Create a focused production story entry for `InvoiceTable` under the invoice module.
- [x] 1.3 Ensure the story imports `InvoiceTable` from `src/invoice/invoice-table.component.tsx` and does not recreate table headers, rows, toolbar, or action cells in local JSX.

## 2. Storybook Runtime Mocks

- [x] 2.1 Provide deterministic Storybook mocks for OpenMRS framework helpers used by `InvoiceTable`, including layout/debounce behavior and the edit icon.
- [x] 2.2 Provide deterministic billable service data for `useBillableServices` so table search and service references behave predictably.
- [x] 2.3 Provide inert or action-logged behavior for `launchBillingWorkspace` so add, edit, cancel, and costs buttons can be clicked without a live OpenMRS shell.
- [x] 2.4 Keep mocks at external runtime boundaries and avoid changing `InvoiceTable` production props only for Storybook.

## 3. Invoice Fixtures

- [x] 3.1 Add realistic `MappedBill` and `LineItem` fixtures for an open pending bill with multiple line items.
- [x] 3.2 Include line items with `PENDING`, `PAID`, and `EXEMPTED` statuses to exercise selection and disabled action behavior.
- [x] 3.3 Include fixture discounts and taxes so the Price, Discount, Tax, and Total columns display production-calculated amounts.
- [x] 3.4 Add a closed bill fixture to exercise the hidden add bill item action.

## 4. Production Story Variants

- [x] 4.1 Add a default story for an open bill that matches the current production invoice line items table behavior.
- [x] 4.2 Add a mixed-status story showing pending, paid, and exempted row behavior.
- [x] 4.3 Add a selected-rows story using `selectedLineItems` and `onSelectItem`.
- [x] 4.4 Add a closed-bill story showing the production table without the add bill item action.
- [x] 4.5 Add a loading story using `isLoadingBill`.

## 5. Scope Guardrails

- [x] 5.1 Confirm no inline edit cells, rich popups, save flows, validation flows, or mutation behavior are introduced by this change.
- [x] 5.2 Confirm the stories document the current production baseline only, ready for a later inline-edit design change.
