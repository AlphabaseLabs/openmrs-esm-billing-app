## ADDED Requirements

### Requirement: Editable cells do not own invoice table column widths
Editable line-item cell internals SHALL NOT impose intrinsic width, minimum width, or fixed-width constraints that change invoice table column distribution.

#### Scenario: Numeric editable cells preserve table-owned column width
- **WHEN** Price or Discount cells render editable value wrappers, inline editors, or edit affordances
- **THEN** those wrappers do not set a minimum width that is larger than the containing table cell
- **AND** the invoice table column width remains controlled by the table structure and cell content baseline

#### Scenario: Text editable cells preserve table-owned column width
- **WHEN** Bill item cells render editable value wrappers or edit affordances
- **THEN** those wrappers do not force the Bill item column wider than the table would make it for the same text content
- **AND** the Bill item column remains controlled by the table structure and cell content baseline

### Requirement: Editable cell content adapts inside the containing table cell
Editable cell content SHALL shrink and align within the existing table cell instead of expanding the cell.

#### Scenario: Numeric content remains right-aligned
- **WHEN** a numeric editable cell renders in display mode
- **THEN** the value is right-aligned inside the current table cell width
- **AND** the value wrapper has `min-width: 0` or equivalent shrink behavior
- **AND** the value wrapper does not reserve width for the edit icon

#### Scenario: Text content remains left-aligned
- **WHEN** a text editable cell renders in display mode
- **THEN** the value is left-aligned inside the current table cell width
- **AND** the value wrapper has `min-width: 0` or equivalent shrink behavior
- **AND** the value wrapper does not reserve width for the edit icon

#### Scenario: Inline numeric editor does not expand the column
- **WHEN** a user activates inline editing for Price or Discount
- **THEN** the inline input fits within the existing table cell width
- **AND** activating the editor does not increase the measured table column width
- **AND** activating the editor does not increase row height except for existing validation messaging when invalid

### Requirement: Floating edit icons do not participate in table layout
Editable-cell edit affordances SHALL be visually available without contributing to table column measurement.

#### Scenario: Floating icon does not reserve a layout lane
- **WHEN** an editable cell renders a floating edit icon
- **THEN** the icon is positioned outside normal layout flow
- **AND** no padding, margin, grid column, or flex lane is added to reserve horizontal space for the icon

#### Scenario: Floating icon remains readable over content
- **WHEN** a floating edit icon overlaps cell content
- **THEN** the icon has a small readable background or border treatment
- **AND** the content is not truncated solely to make room for the icon

### Requirement: Portaled popovers do not affect table measurement
Editable-cell popovers SHALL remain outside the table layout tree and SHALL NOT affect invoice table column widths.

#### Scenario: Opening Price popover preserves column widths
- **WHEN** a user opens the Price tier popover
- **THEN** the popover is portaled outside the table overflow chain
- **AND** the table columns keep the same widths they had before the popover opened

#### Scenario: Opening Discount popover preserves column widths
- **WHEN** a user opens the Discount form popover
- **THEN** the popover is portaled outside the table overflow chain
- **AND** the table columns keep the same widths they had before the popover opened

#### Scenario: Opening Bill item popover preserves column widths
- **WHEN** a user opens the Bill item popover
- **THEN** the popover is portaled outside the table overflow chain
- **AND** the table columns keep the same widths they had before the popover opened

### Requirement: Production stories demonstrate column-width parity
Production Storybook stories SHALL provide a reliable way to inspect editable-cell tables without mock-only layout behavior.

#### Scenario: Default pending bill story shows table-owned columns
- **WHEN** the default pending bill production story renders
- **THEN** the invoice line-item table column widths visually match the production table baseline
- **AND** editable-cell wrappers, icons, and inactive popovers do not widen Price or Discount columns

#### Scenario: Open editor stories preserve columns
- **WHEN** the Bill item, Price, or Discount open-editor production stories render
- **THEN** opening the editor does not shift the line-item table column widths
- **AND** the story uses the production editable-cell components rather than Storybook-only mock implementations
