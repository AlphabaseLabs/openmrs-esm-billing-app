## ADDED Requirements

### Requirement: Inline discount amount editing is preserved
The system SHALL keep the discount table cell as the inline editor for the actual discount amount.

#### Scenario: User edits discount amount inline
- **WHEN** a user enters `20` in the discount table cell for a line item with subtotal `100`
- **THEN** the table cell displays discount amount `20`
- **AND** the line item discount amount is updated to `20`

#### Scenario: User opens popover after inline amount edit
- **WHEN** a line item has price `100` and discount amount `20`
- **AND** the user opens the discount popover
- **THEN** the popover percent field displays `20`
- **AND** the discount table cell continues to display amount `20`

### Requirement: Popover percent editing updates the discount amount
The system SHALL provide a percent input in the discount popover that derives from and updates the actual discount amount using the line item price.

#### Scenario: Percent edit updates table amount
- **WHEN** a line item has price `100` and discount amount `20`
- **AND** the user opens the discount popover
- **AND** the user changes the percent value from `20` to `30`
- **THEN** the discount table cell updates from `20` to `30`
- **AND** the line item discount amount is updated to `30`

#### Scenario: Percent edit uses price and not subtotal
- **WHEN** a line item has quantity `2`, price `100`, and discount amount `20`
- **AND** the user opens the discount popover
- **AND** the user changes the percent value to `30`
- **THEN** the discount table cell displays amount `30`
- **AND** the line item discount amount is updated to `30`
- **AND** the quantity does not multiply the percent-derived discount amount

### Requirement: Percent display is rounded
The system SHALL round displayed percent values to a fixed precision and SHALL NOT show raw floating point tails.

#### Scenario: Derived percent has a repeating decimal
- **WHEN** a line item price and discount amount produce a non-terminating or floating point imprecise percent value
- **AND** the discount popover is open
- **THEN** the percent input displays the configured rounded precision
- **AND** the percent input does not display a raw value such as `0.004000016000064`

### Requirement: Discount popover content is simplified
The discount popover SHALL contain only the percent input, discount sponsor selector, comment textarea, and bottom `Clear` action.

#### Scenario: User opens the simplified discount popover
- **WHEN** the user opens the discount popover
- **THEN** the popover shows a percent input
- **AND** the popover shows a discount sponsor selector
- **AND** the popover shows a comment textarea
- **AND** the popover shows a `Clear` action at the bottom
- **AND** the popover does not show a heading, amount input, per-item readout, total formula line, or top reset link

### Requirement: Discount metadata remains editable in the popover
The system SHALL allow the user to edit discount sponsor and comment metadata from the simplified discount popover without changing the inline amount editing model.

#### Scenario: User edits sponsor and comment
- **WHEN** the user changes the discount sponsor or comment in the popover
- **THEN** the line item discount metadata is updated using the existing discount update shape
- **AND** the discount amount remains controlled by the inline amount value or popover percent conversion

### Requirement: Discount clear action resets the discount
The system SHALL provide a bottom `Clear` action in the discount popover that removes the discount using the existing discount clearing semantics.

#### Scenario: User clears discount from popover
- **WHEN** a line item has a discount amount, sponsor, or comment
- **AND** the user clicks `Clear` in the popover
- **THEN** the discount amount is reset to `0`
- **AND** the discount percent derives to `0`
- **AND** discount sponsor and comment metadata are cleared according to the existing discount clearing semantics

### Requirement: Discount affordance communicates percent editing
The discount editable cell SHALL render `%` as its hover/open affordance instead of the shared chevron.

#### Scenario: User hovers discount cell
- **WHEN** the user hovers an editable discount cell
- **THEN** the discount cell affordance displays `%`
- **AND** the affordance uses the existing quiet editable cell visual treatment

#### Scenario: User opens discount popover
- **WHEN** the user opens the discount popover
- **THEN** the open discount cell affordance displays `%`
- **AND** the discount cell continues to display the actual discount amount

### Requirement: Other editable popovers remain unchanged
The system SHALL NOT change price editor or bill-item editor behavior as part of this discount popover simplification.

#### Scenario: User opens price or bill-item editor
- **WHEN** the user opens the price editor or bill-item editor
- **THEN** those editors keep their existing trigger behavior, popover content, and data update behavior
