## ADDED Requirements

### Requirement: Popovers are welded to active editable cells
The system SHALL render editable line-item popovers as visual extensions of the active table cell, with zero visual gap between the active cell and the popover.

#### Scenario: Bill item popover is welded to cell bottom-left
- **WHEN** a user opens the Bill item editor for an editable line item
- **THEN** the Bill item cell is visually active
- **AND** the popover is aligned to the bottom-left edge of the active cell with no visible gap
- **AND** the active cell border and popover border read as one connected editor surface

#### Scenario: Price popover is welded to cell bottom-right
- **WHEN** a user opens the Price tier editor for an editable line item
- **THEN** the Price cell is visually active
- **AND** the popover is aligned to the bottom-right edge of the active cell with no visible gap
- **AND** the popover does not align to the floating edit icon

#### Scenario: Discount popover is welded to cell bottom-right
- **WHEN** a user opens the Discount editor for an editable line item
- **THEN** the Discount cell is visually active
- **AND** the popover is aligned to the bottom-right edge of the active cell with no visible gap
- **AND** the popover does not align to the floating edit icon

### Requirement: Popovers escape table overflow
The system SHALL render editable line-item popovers outside the table overflow chain while preserving their visual anchor to the active cell.

#### Scenario: Opening popover does not create table scrollbars
- **WHEN** a user opens any Bill item, Price, or Discount popover in the line-item table
- **THEN** the table does not gain new scrollbars because of the popover content
- **AND** the popover can visually overflow the table area without being clipped by the table container

#### Scenario: Popover tracks the active cell anchor
- **WHEN** the viewport or scroll position changes while a popover is open
- **THEN** the popover remains positioned from the active cell bounds or closes according to the existing overlay behavior

### Requirement: Popovers use lightweight table-editor styling
The system SHALL style editable line-item popovers as table-attached editors, not detached modal cards.

#### Scenario: Active editor visual style
- **WHEN** any editable line-item popover is open
- **THEN** the active cell has a subtle active fill and border
- **AND** the popover has a thin border and minimal shadow
- **AND** the popover has no heavy card treatment

#### Scenario: Selected list option visual style
- **WHEN** a list editor contains the currently selected option
- **THEN** that option uses a soft fill, a two-pixel left accent, and a check indicator

### Requirement: Bill item editor commits on option selection
The system SHALL make the Bill item cell a whole-cell list editor that commits immediately when an item is selected.

#### Scenario: Open Bill item list from editable cell
- **WHEN** a user activates an editable Bill item cell
- **THEN** the system opens a list popover with a "Select bill item" caption
- **AND** the editor does not require a separate offset edit icon inside table layout space
- **AND** the popover has no Save or Cancel button

#### Scenario: Select Bill item option
- **WHEN** a user selects a bill item option from the Bill item popover
- **THEN** the selected bill item is committed immediately
- **AND** the popover closes
- **AND** affected line-item totals are recomputed

#### Scenario: Dismiss Bill item editor
- **WHEN** a user dismisses the Bill item popover without selecting an option
- **THEN** the Bill item value remains unchanged

#### Scenario: Bill item change refreshes price options
- **WHEN** a user changes the Bill item
- **THEN** the available Price tier options refresh for the new bill item
- **AND** the Price resets to the new item default only when the existing price was derived from the previous item default or selected tier
- **AND** a manually typed valid custom price is preserved

### Requirement: Price editor supports inline edit and immediate tier selection
The system SHALL support both direct borderless inline Price editing and a welded Price tier popover that commits immediately on selection.

#### Scenario: Direct Price value edit
- **WHEN** a user activates the displayed Price value for an editable line item
- **THEN** the system presents a borderless inline numeric editor
- **AND** the editor inherits the cell typography and right alignment
- **AND** the editor does not increase row height

#### Scenario: Open Price tier popover
- **WHEN** a user activates the Price tier affordance
- **THEN** the system opens a right-aligned list popover
- **AND** the popover shows the current price
- **AND** the popover shows selectable price options with labels and amounts
- **AND** the popover has no Save or Cancel button

#### Scenario: Select Price tier option
- **WHEN** a user selects a Price tier option
- **THEN** the selected price is committed immediately
- **AND** the popover closes
- **AND** affected line-item totals are recomputed

#### Scenario: Custom Price has no selected tier
- **WHEN** the current Price value does not match a configured tier option
- **THEN** the Price tier list shows no selected tier row

### Requirement: Discount editor auto-commits valid form changes
The system SHALL make the Discount popover a welded form editor that commits each valid change without Save or Cancel actions.

#### Scenario: Open Discount form popover
- **WHEN** a user activates the Discount affordance for an editable line item
- **THEN** the system opens a right-aligned Discount form popover
- **AND** the popover includes Amount and Percent inputs side by side
- **AND** the popover includes Discount sponsor and Comment fields
- **AND** the popover has no Save or Cancel button

#### Scenario: Amount and Percent stay synchronized
- **WHEN** a user enters a valid Discount amount
- **THEN** the Percent value updates from the line-item subtotal
- **AND** affected totals are recomputed from the committed amount

#### Scenario: Percent and Amount stay synchronized
- **WHEN** a user enters a valid Discount percent
- **THEN** the Amount value updates from the line-item subtotal
- **AND** affected totals are recomputed from the committed percent

#### Scenario: Valid Discount field change auto-commits
- **WHEN** a user changes any Discount form field to a valid value
- **THEN** the change is committed immediately through the production update path
- **AND** affected line-item totals are recomputed
- **AND** the popover remains open unless dismissed by the user

#### Scenario: Invalid Discount draft is not committed
- **WHEN** a user enters an invalid Discount value
- **THEN** the invalid draft remains visible in the editor
- **AND** the previous valid Discount value remains the committed value
- **AND** totals continue to use the previous valid committed value

#### Scenario: Dismiss Discount editor keeps valid changes
- **WHEN** a user dismisses the Discount popover after valid changes
- **THEN** the committed Discount changes remain applied

#### Scenario: Inline Discount reset
- **WHEN** a user activates the inline Discount reset action
- **THEN** the Discount amount is set to zero
- **AND** the Discount percent is set to zero
- **AND** discount-specific sponsor and comment metadata are cleared when applicable
- **AND** the reset commits immediately
- **AND** totals are recomputed
- **AND** the popover remains open

### Requirement: Inline numeric editors preserve keyboard commit semantics
The system SHALL keep inline numeric editing predictable for Price and Discount values.

#### Scenario: Commit inline numeric edit
- **WHEN** a user enters a valid inline numeric value and presses Enter or blurs the field
- **THEN** the value is committed
- **AND** affected line-item totals are recomputed

#### Scenario: Cancel inline numeric edit
- **WHEN** a user presses Escape while editing an inline numeric value
- **THEN** the draft is discarded
- **AND** the previous committed value is restored

#### Scenario: Hold invalid inline numeric draft
- **WHEN** a user enters an invalid inline numeric value
- **THEN** the invalid draft remains local to the editor
- **AND** the production row value is not updated
- **AND** totals continue to use the previous valid committed value

### Requirement: Locked rows remain static
The system SHALL prevent editable-cell affordances and popovers from appearing for locked line-item rows.

#### Scenario: Locked row has no editable affordance
- **WHEN** a line-item row is not editable because of its status
- **THEN** Bill item, Price, and Discount cells render as static values
- **AND** the cells do not show edit affordances on hover or focus
- **AND** the cells do not open popovers
- **AND** the cells do not use editable cursor styling
