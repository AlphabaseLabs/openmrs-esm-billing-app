## ADDED Requirements

### Requirement: Quantity can be edited inline
The system SHALL allow editable pending invoice line items to edit Quantity directly inside the Quantity table cell using the shared editable Carbon numeric cell mechanics.

#### Scenario: User opens Quantity inline editor
- **WHEN** a user activates the Quantity cell for an editable pending line item
- **THEN** the Quantity cell displays an inline numeric editor in the cell without opening a popover

#### Scenario: Quantity uses reusable numeric cell mechanics
- **WHEN** the Quantity cell is editable
- **THEN** it uses the shared editable Carbon table cell kit rather than a custom one-off cell editor implementation

### Requirement: Quantity commits valid positive whole numbers
The system SHALL commit Quantity changes only when the entered value is a positive whole number.

#### Scenario: Commit valid quantity with Enter
- **WHEN** a user enters a positive whole number in the Quantity editor and presses Enter
- **THEN** the system commits the new Quantity through the line-item update flow

#### Scenario: Commit valid quantity on blur
- **WHEN** a user enters a positive whole number in the Quantity editor and leaves the field
- **THEN** the system commits the new Quantity through the line-item update flow

#### Scenario: Reject invalid quantity
- **WHEN** a user enters an empty, zero, negative, decimal, or non-numeric Quantity value
- **THEN** the system does not commit the invalid value and restores the previous Quantity display value

#### Scenario: Cancel quantity edit
- **WHEN** a user changes Quantity and presses Escape before committing
- **THEN** the system restores the previous Quantity display value and does not call the line-item update flow

### Requirement: Quantity updates invoice totals through billing logic
The system SHALL keep Quantity-specific billing behavior in the billing app adapter and recalculate affected line-item and invoice totals after a valid Quantity commit.

#### Scenario: Quantity adapter creates billing update
- **WHEN** a valid Quantity value is committed
- **THEN** the billing adapter sends an update payload containing the new Quantity for that line item

#### Scenario: Quantity commit recalculates totals
- **WHEN** a valid Quantity value is committed
- **THEN** the line item amount, discount, tax, total, and invoice totals reflect existing billing recalculation rules

### Requirement: Quantity respects row editability
The system SHALL keep Quantity read-only when the line item or bill state is not editable.

#### Scenario: Paid row quantity is read-only
- **WHEN** a line item is paid or otherwise non-editable
- **THEN** the Quantity cell renders as static text and does not open an inline editor

#### Scenario: Closed bill quantity is read-only
- **WHEN** the bill is closed or otherwise non-editable
- **THEN** the Quantity cell renders as static text and does not open an inline editor

### Requirement: Quantity editing preserves table geometry
The system SHALL preserve invoice table column width and position while Quantity editing is inactive, active, committing, or cancelling.

#### Scenario: Opening Quantity editor does not resize columns
- **WHEN** a user opens the Quantity inline editor
- **THEN** the Quantity, Price, Discount, Tax, Total, and Action column widths and horizontal positions remain unchanged

#### Scenario: Invalid Quantity input does not resize columns
- **WHEN** a user types an invalid Quantity value
- **THEN** the Quantity, Price, Discount, Tax, Total, and Action column widths and horizontal positions remain unchanged

#### Scenario: Committing Quantity does not resize columns
- **WHEN** a valid Quantity value is committed
- **THEN** the Quantity, Price, Discount, Tax, Total, and Action column widths and horizontal positions remain unchanged

### Requirement: Quantity has no popover
The system SHALL keep Quantity editing inline-only and SHALL NOT render any Quantity editor popover.

#### Scenario: Quantity editor opens without overlay
- **WHEN** a user activates the Quantity editor
- **THEN** no Quantity popover or option overlay is rendered
