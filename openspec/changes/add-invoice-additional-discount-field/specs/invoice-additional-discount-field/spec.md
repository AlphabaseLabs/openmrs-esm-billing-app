## ADDED Requirements

### Requirement: Invoice details show a bill-level additional discount control
The invoice bill details view SHALL render a bill-level `Additional discount` control for bills after the line-items table and before the payments section.

#### Scenario: Control appears in the settlement area
- **WHEN** an invoice bill details page renders a bill
- **THEN** the page SHALL render an `Additional discount` label after the line-items table
- **AND** the page SHALL render the control before the payments section
- **AND** the control SHALL display the current `bill.additionalDiscount` amount, defaulting to `0` when absent
- **AND** the final `+ Add item` row SHALL remain the last row inside the line-items table.

#### Scenario: Control is not table data
- **WHEN** the invoice line-items table renders
- **THEN** the additional discount control SHALL NOT be included in the table rows array
- **AND** the additional discount control SHALL NOT participate in line-item search, sorting, row selection, line numbering, or row actions.

#### Scenario: Closed bill displays read-only additional discount
- **WHEN** an invoice bill details page renders a bill where `closed` is true
- **THEN** the page SHALL display the current additional discount when present
- **AND** the page SHALL NOT allow fixed-amount editing
- **AND** the page SHALL NOT allow percent editing
- **AND** the page SHALL NOT submit an additional discount update.

### Requirement: Fixed amount editing matches inline numeric editing
The additional discount control SHALL allow fixed amount editing from the amount surface using the same commit model as existing inline numeric discount cells.

#### Scenario: User commits a valid fixed amount
- **WHEN** a user activates the additional discount amount surface
- **AND** enters a valid fixed amount
- **AND** commits the edit with Enter or blur
- **THEN** the system SHALL persist the entered amount as the bill additional discount
- **AND** the system SHALL refresh invoice bill data after the update succeeds
- **AND** the control SHALL display the persisted additional discount amount.

#### Scenario: User enters an invalid fixed amount
- **WHEN** a user enters an additional discount amount below `0`
- **OR** a user enters an additional discount amount greater than the current discountable bill amount before additional discount
- **THEN** the system SHALL NOT submit the invalid value
- **AND** the control SHALL present validation feedback
- **AND** the previously persisted additional discount SHALL remain displayed after the invalid edit is canceled or rejected.

### Requirement: Percent affordance matches inline discount cell behavior
The additional discount `%` affordance SHALL behave like the `%` affordance used by inline line-item discount cells while omitting line-item-only fields.

#### Scenario: User opens percent editor
- **WHEN** a user activates the `%` affordance on the additional discount control
- **THEN** the system SHALL open a compact popover
- **AND** the popover SHALL contain a percent input
- **AND** the popover SHALL contain a clear action
- **AND** the popover SHALL NOT contain sponsor or comment fields
- **AND** the popover SHALL NOT require a separate `Apply` button.

#### Scenario: User edits percent value
- **WHEN** the additional discount percent popover is open
- **AND** the user enters a valid percent between `0` and `100`
- **THEN** the system SHALL calculate the additional discount amount from the current discountable bill amount before additional discount
- **AND** the system SHALL persist the calculated additional discount amount
- **AND** the amount surface SHALL display the calculated additional discount amount
- **AND** the percent input SHALL preserve focused draft text and normalize display on blur.

#### Scenario: User clears additional discount
- **WHEN** the additional discount percent popover is open
- **AND** the user activates the clear action
- **THEN** the system SHALL persist an additional discount value of `0`
- **AND** the amount surface SHALL display `0`
- **AND** invoice bill data SHALL refresh after the update succeeds.

### Requirement: Additional discount edits persist through the bill-level update API
Additional discount edits SHALL use the bill-level additional-discount update API and SHALL keep invoice state synchronized with the server.

#### Scenario: Successful update
- **WHEN** a user commits a valid additional discount edit
- **THEN** the system SHALL call the additional discount update API with the bill UUID
- **AND** the request payload SHALL include the new additional discount amount
- **AND** the system SHALL show success feedback after the API call succeeds
- **AND** the system SHALL revalidate invoice bill data.

#### Scenario: Failed update
- **WHEN** a user commits a valid additional discount edit
- **AND** the additional discount update API returns an error
- **THEN** the system SHALL keep the user on the invoice page
- **AND** the system SHALL show error feedback
- **AND** the system SHALL NOT permanently replace the displayed server-confirmed additional discount with the failed draft.

### Requirement: Invoice totals account for bill-level additional discount
The invoice payment summary SHALL include bill-level additional discount in displayed discount and amount due calculations without copying it into line items.

#### Scenario: Summary displays line and additional discounts
- **WHEN** an invoice bill has line-item discounts
- **AND** the bill has a positive additional discount
- **THEN** the summary discount row SHALL display the sum of line-item discounts and additional discount
- **AND** the total amount row SHALL continue to represent gross line subtotal plus tax before displayed discounts
- **AND** the amount due row SHALL reflect the additional discount.

#### Scenario: Payment validation uses discounted amount due
- **WHEN** an invoice bill has a positive additional discount
- **AND** the user enters a payment amount
- **THEN** overpayment validation SHALL compare the entered payment against amount due after additional discount
- **AND** a payment equal to the discounted amount due SHALL be valid.

#### Scenario: Additional discount does not mutate line items
- **WHEN** a user updates the bill-level additional discount
- **THEN** existing line item discount arrays SHALL remain unchanged
- **AND** line item totals SHALL remain based on their own price, quantity, taxes, and line-item discounts
- **AND** line item numbering, selection, sorting, and searching SHALL remain unchanged.
