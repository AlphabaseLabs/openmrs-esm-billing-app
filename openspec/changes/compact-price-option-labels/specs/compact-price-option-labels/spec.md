## ADDED Requirements

### Requirement: Compact price option labels

The editable price cell popover SHALL render each available price option as a compact combined text label in the form `Name - (Amount)`.

#### Scenario: Price option row shows compact text

- **WHEN** the price option popover is opened for a bill item with a `Cash` price option of `15000`
- **THEN** the option row SHALL display `Cash - (15,000)` as one readable option label

#### Scenario: Multiple options remain scannable

- **WHEN** the price option popover contains `Cash`, `Card`, and `Insurance` price options
- **THEN** each option SHALL display as compact text such as `Cash - (15,000)`, `Card - (100,000)`, and `Insurance - (500,000)` without a large visual gap between name and amount

### Requirement: Selected check remains a trailing affordance

The editable price cell popover SHALL keep the selected check indicator visually separate from the compact option label.

#### Scenario: Selected price option

- **WHEN** a price option is currently selected
- **THEN** the row SHALL display the compact option label and the selected check indicator at the trailing edge of the row

### Requirement: Existing price selection behavior is preserved

The editable price cell popover MUST preserve existing price selection, auto-commit, and line-item recalculation behavior.

#### Scenario: Selecting a compact price option

- **WHEN** the user selects a compact price option row
- **THEN** the system SHALL commit the selected price option using the existing production price update and recalculation path

#### Scenario: Empty price options

- **WHEN** the selected bill item has no service prices
- **THEN** the popover SHALL continue to show the existing no-price-options fallback
