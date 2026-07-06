## ADDED Requirements

### Requirement: Price option picker follows select-cell popover pattern
The system SHALL render the line-item price option picker using the same select-cell popover pattern as the bill-item picker, including welded placement, concise title, selectable option rows, selected-row highlight, and trailing selected-state indicator.

#### Scenario: Price option picker opens from chevron affordance
- **WHEN** a user activates the chevron affordance in an editable price cell
- **THEN** the system displays a popover anchored to the active price cell using the same welded overlay behavior as the bill-item picker

#### Scenario: Price picker uses concise select title
- **WHEN** the price option picker is open
- **THEN** the popover displays a concise price-option selection title without a separate current-price summary block

#### Scenario: Price options render as select rows
- **WHEN** service price options are available for the active line item
- **THEN** each option row displays the option label, the formatted option amount, and any selected-state indicator using a consistent select-list row layout

#### Scenario: Selected price option is visually identified
- **WHEN** a price option matches the active line-item price selection
- **THEN** that option row is highlighted and displays a trailing selected-state checkmark

### Requirement: Price option picker preserves existing behavior
The system SHALL preserve the existing price editing behavior while changing only the price option picker visual and structural pattern.

#### Scenario: Price option selection auto-commits
- **WHEN** a user selects a price option in the picker
- **THEN** the system commits the selected price option and closes the popover without requiring save or cancel buttons

#### Scenario: Inline numeric price editing remains separate
- **WHEN** a user activates the price value surface instead of the chevron affordance
- **THEN** the system opens the inline numeric price editor rather than the price option picker

#### Scenario: Pricing calculations remain unchanged
- **WHEN** a selected price option is committed
- **THEN** the system applies the same line-item recalculation and commit payload semantics used before this visual standardization

### Requirement: Price option popover layout remains stable
The system SHALL keep the price option popover readable and layout-neutral relative to the invoice table.

#### Scenario: Price popover has stable readable width
- **WHEN** the price option picker is open from a narrow price column
- **THEN** the popover uses a stable readable minimum width rather than shrinking to the price cell's visual width

#### Scenario: Price popover does not resize table columns
- **WHEN** the price option picker opens or closes
- **THEN** the invoice table column widths remain unchanged
