## ADDED Requirements

### Requirement: Editable cell content is vertically centered
The system SHALL vertically center editable cell display values and inline editors within the invoice table row without increasing row height.

#### Scenario: Numeric display value is centered in the row
- **WHEN** a price or discount cell is rendered in display mode
- **THEN** the visible numeric value is vertically centered with the other content in the same table row

#### Scenario: Numeric inline editor is centered in the row
- **WHEN** a price or discount cell enters inline edit mode
- **THEN** the active editor is vertically centered with the other content in the same table row

#### Scenario: Text display value is centered in the row
- **WHEN** a bill-item cell is rendered in display mode
- **THEN** the visible text value is vertically centered with the other content in the same table row

### Requirement: Editable cell content surface opens inline editing
The system SHALL treat the editable content surface as the inline edit hit target instead of requiring clicks directly on the visible value text.

#### Scenario: Clicking numeric cell whitespace starts price edit
- **WHEN** a user clicks inside the editable price content surface but outside the visible digits
- **THEN** the price cell enters inline edit mode

#### Scenario: Clicking numeric cell whitespace starts discount edit
- **WHEN** a user clicks inside the editable discount content surface but outside the visible digits
- **THEN** the discount cell enters inline edit mode

#### Scenario: Clicking text cell whitespace activates bill-item inline action
- **WHEN** a user clicks inside the editable bill-item content surface but outside the visible text
- **THEN** the bill-item cell runs the same inline action as clicking the visible bill-item value

### Requirement: Floating edit icon actions remain isolated
The system SHALL keep floating edit icon clicks separate from full-surface inline edit clicks.

#### Scenario: Price icon opens rich price picker only
- **WHEN** a user clicks the floating price edit icon
- **THEN** the rich price picker opens and the price inline text editor does not open from the same click

#### Scenario: Discount icon opens rich discount form only
- **WHEN** a user clicks the floating discount edit icon
- **THEN** the rich discount form opens and the discount inline text editor does not open from the same click

#### Scenario: Bill-item icon opens rich bill-item picker only
- **WHEN** a user clicks the floating bill-item edit icon
- **THEN** the rich bill-item picker opens and the bill-item inline action does not run from the same click

### Requirement: Disabled editable cells do not expose expanded hit targets
The system SHALL not expose full-surface inline edit hit targets for disabled line-item cells.

#### Scenario: Paid numeric cell remains non-editable
- **WHEN** a paid or otherwise non-editable line item renders a price or discount cell
- **THEN** clicking the cell surface does not open inline editing or a rich editor

#### Scenario: Disabled bill-item cell remains non-editable
- **WHEN** a non-editable line item renders a bill-item cell
- **THEN** clicking the cell surface does not open inline editing or a rich editor

### Requirement: Existing geometry standards are preserved
The system SHALL preserve the existing borderless inline editor, out-of-flow edit icon, and portal-owned rich popover geometry while adding full-surface hit targets.

#### Scenario: Expanding the hit target does not allocate icon space
- **WHEN** an editable cell renders its full-surface hit target and floating edit icon
- **THEN** the edit icon remains out of normal layout flow and does not change column width, content alignment, or row height

#### Scenario: Rich popover remains outside table overflow
- **WHEN** a user opens a rich editor from a floating edit icon
- **THEN** the popover content remains rendered outside the invoice table overflow container
