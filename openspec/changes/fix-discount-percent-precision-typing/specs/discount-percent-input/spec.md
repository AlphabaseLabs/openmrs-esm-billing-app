## ADDED Requirements

### Requirement: Small non-zero percents remain visible
The system SHALL display derived non-zero discount percentages as visibly non-zero values in the discount popover percent input.

#### Scenario: Small discount on large price
- **WHEN** a line item has price `259999` and discount amount `10`
- **AND** the user opens the discount popover
- **THEN** the percent input displays a non-zero percent such as `0.0038`
- **AND** the percent input does not display `0.00`

#### Scenario: Percent below visible precision floor
- **WHEN** a derived percent is greater than `0` but below the minimum visible non-zero precision
- **AND** the user opens the discount popover
- **THEN** the percent input displays a non-zero floor indicator
- **AND** the percent input does not imply that the discount is zero

### Requirement: Focused percent typing preserves raw input
The system SHALL preserve the user's raw percent input text while the percent field is focused.

#### Scenario: User types multi-digit percent
- **WHEN** the user focuses the percent input
- **AND** the user types `10`
- **THEN** the field displays `10` while focused
- **AND** the field is not reformatted to `1.00` or `10.0000` during typing

#### Scenario: User types decimal percent
- **WHEN** the user focuses the percent input
- **AND** the user types `10.5`
- **THEN** the field displays `10.5` while focused
- **AND** the user's cursor is not disrupted by per-keystroke fixed-decimal formatting

#### Scenario: User types partial decimal
- **WHEN** the user focuses the percent input
- **AND** the user types `10.`
- **THEN** the field preserves `10.` while focused
- **AND** the system does not immediately normalize it to a fixed decimal value

### Requirement: Focused percent edits still live-apply amount
The system SHALL parse valid focused percent input and live-apply it to the actual discount amount using the line item price.

#### Scenario: Multi-digit percent commits actual amount
- **WHEN** a line item has price `259999`
- **AND** the user changes the focused percent value to `10.5`
- **THEN** the actual discount amount is updated from `price * 10.5 / 100`
- **AND** the discount table cell remains the actual amount display

### Requirement: Settled percent text is normalized
The system SHALL normalize percent input text on open, blur, and popover close, not on every focused keystroke.

#### Scenario: Percent normalizes on blur
- **WHEN** the user types `10.5` in the focused percent input
- **AND** the percent input loses focus
- **THEN** the field displays the settled formatted percent value

#### Scenario: Percent normalizes on popover reopen
- **WHEN** the user enters a percent value and closes the popover
- **AND** the user opens the discount popover again
- **THEN** the percent input displays the settled formatted percent value derived from the current discount amount
