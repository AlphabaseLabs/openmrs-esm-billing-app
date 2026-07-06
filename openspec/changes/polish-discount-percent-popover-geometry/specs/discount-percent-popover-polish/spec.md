## ADDED Requirements

### Requirement: Settled percent display trims unnecessary decimals
The system SHALL display settled discount percent values with up to 4 decimal places and SHALL remove trailing zeroes when they do not carry information.

#### Scenario: Whole percent display
- **WHEN** the settled discount percent is `10`
- **THEN** the percent input displays `10`
- **AND** the percent input does not display `10.0000`

#### Scenario: Decimal percent display
- **WHEN** the settled discount percent is `10.5`
- **THEN** the percent input displays `10.5`
- **AND** the percent input does not display `10.5000`

#### Scenario: Small non-zero percent display
- **WHEN** the settled discount percent is `0.003846`
- **THEN** the percent input displays a rounded non-zero value such as `0.0038`
- **AND** the percent input does not display `0`

### Requirement: Discount popover is left-welded to the discount cell
The system SHALL align the discount popover's left border with the discount cell's left border.

#### Scenario: User opens discount popover
- **WHEN** the user opens the discount popover
- **THEN** the popover left edge aligns with the active discount cell left edge
- **AND** the popover is not right-edge aligned to the discount cell

### Requirement: Discount percent affordance hides while open
The system SHALL hide the `%` options affordance while the discount popover is open.

#### Scenario: Closed discount cell hover
- **WHEN** the discount popover is closed
- **AND** the user hovers or focuses the editable discount cell
- **THEN** the `%` affordance is visible

#### Scenario: Open discount popover
- **WHEN** the discount popover is open
- **THEN** the `%` affordance is visually hidden
- **AND** the active discount cell and popover remain visible

### Requirement: Existing discount editor behavior remains unchanged
The system SHALL preserve discount amount editing, percent-to-amount writeback, and simplified popover content.

#### Scenario: User edits discount percent
- **WHEN** the user edits the percent value in the discount popover
- **THEN** the discount amount continues to update using the existing price-based calculation
- **AND** the popover still contains only percent input, sponsor selector, comment textarea, and bottom `Clear`
