## ADDED Requirements

### Requirement: BillDetails production stories
Storybook SHALL include focused stories that render the production `BillDetails` component with realistic bill fixtures.

#### Scenario: Pending bill details baseline
- **WHEN** the default `BillDetails` story is opened
- **THEN** Storybook renders the production invoice summary, invoice actions, production `InvoiceTable`, and production `Payments` composition for a pending bill

#### Scenario: Existing line item discount baseline
- **WHEN** the `BillDetails` story uses a bill fixture with existing line-item discounts
- **THEN** the table discount column and payment summary discount value reflect the current production mapped bill fields

#### Scenario: Paid or closed bill baseline
- **WHEN** the `BillDetails` story uses a paid or closed bill fixture
- **THEN** Storybook renders production status-gated actions and totals without introducing bill-level discount controls

### Requirement: Payments production stories
Storybook SHALL include focused stories that render the production `Payments` component with realistic selected line item and payment fixtures.

#### Scenario: Pending payment summary baseline
- **WHEN** the default `Payments` story is opened
- **THEN** Storybook renders payment history, payment form, total amount, discount, total tendered, amount due, and payment action controls from the production component

#### Scenario: Selected line items baseline
- **WHEN** the `Payments` story passes selected unpaid line items
- **THEN** payment validation and amount due behavior uses the production selected-line-item logic

#### Scenario: Existing discount and tax summary baseline
- **WHEN** the `Payments` story uses a bill fixture with line-item discounts and taxes
- **THEN** the summary values display current production calculations from `totalAmountWithoutTaxAndDiscount`, `totalTax`, `totalDiscounts`, `totalActualPayments`, and `balance`

#### Scenario: Paid bill baseline
- **WHEN** the `Payments` story uses a paid bill fixture
- **THEN** Storybook renders the production paid-bill state without bill-level discount controls

### Requirement: Shared production story fixtures
Storybook SHALL use reusable billing fixtures for invoice table, bill details, and payments stories where practical.

#### Scenario: Reused billing fixtures
- **WHEN** invoice-related stories need bill and line item data
- **THEN** they use shared fixtures or fixture builders so totals, discounts, taxes, payment status, and balances remain consistent across stories

### Requirement: Runtime dependencies are mocked at boundaries
Storybook SHALL mock external runtime dependencies needed by `BillDetails` and `Payments` without changing production behavior.

#### Scenario: OpenMRS shell dependencies are absent
- **WHEN** `BillDetails` or `Payments` stories render in Storybook
- **THEN** OpenMRS shell APIs, navigation, modals, snackbars, payment modes, patient-common components, and workspace side effects are mocked sufficiently for the production components to render

### Requirement: Bill-level discount behavior is deferred
Storybook SHALL NOT introduce bill-level discount controls, bill-level discount calculations, mutation behavior, or backend payload design in this change.

#### Scenario: No total bill discount implementation
- **WHEN** the new stories are reviewed
- **THEN** they document current production behavior only and do not add total bill discount UI or logic
