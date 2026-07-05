## ADDED Requirements

### Requirement: Inline numeric editing uses a borderless in-cell surface
The system SHALL render inline price and discount edit states as borderless table-cell editing surfaces rather than boxed numeric form controls.

#### Scenario: Price edit starts without a boxed number control
- **WHEN** a user starts inline editing a line-item price
- **THEN** the editor appears inside the table cell without native number steppers, a boxed field frame, or a form-control outline that protrudes beyond the cell surface

#### Scenario: Discount edit starts without a boxed number control
- **WHEN** a user starts inline editing a line-item discount
- **THEN** the editor appears inside the table cell without native number steppers, a boxed field frame, or a form-control outline that protrudes beyond the cell surface

### Requirement: Numeric edit alignment matches numeric display alignment
The system SHALL keep numeric display values and numeric inline draft values right-aligned within the same table cell content area.

#### Scenario: Editing a formatted price preserves numeric alignment
- **WHEN** a user starts inline editing a displayed price value such as `249,999`
- **THEN** the draft value remains right-aligned in the price column instead of shifting left or centering inside a smaller control

#### Scenario: Editing a formatted discount preserves numeric alignment
- **WHEN** a user starts inline editing a displayed discount value such as `2,000`
- **THEN** the draft value remains right-aligned in the discount column instead of shifting left or centering inside a smaller control

### Requirement: Inline numeric editors tolerate formatted draft text
The system SHALL use text-based decimal input behavior for inline numeric editing and parse comma-formatted draft values into numeric commit values.

#### Scenario: Comma-formatted price draft commits as a number
- **WHEN** a user edits a price draft containing grouping separators such as `249,999`
- **THEN** the commit path parses the draft as the numeric value `249999`

#### Scenario: Comma-formatted discount draft commits as a number
- **WHEN** a user edits a discount draft containing grouping separators such as `2,000`
- **THEN** the commit path parses the draft as the numeric value `2000`

### Requirement: Inline editing does not change table row height
The system SHALL keep invoice line-item row height stable when an inline editable cell enters edit mode.

#### Scenario: Starting a price edit preserves row height
- **WHEN** a user starts inline editing a price cell
- **THEN** the line-item row does not grow taller because of input wrapper height, invalid text, steppers, margins, or external focus outlines

#### Scenario: Starting a discount edit preserves row height
- **WHEN** a user starts inline editing a discount cell
- **THEN** the line-item row does not grow taller because of input wrapper height, invalid text, steppers, margins, or external focus outlines

### Requirement: Edit icon affordances do not allocate cell layout space
The system SHALL render editable-cell icon affordances as out-of-flow overlays inside the cell shell, without allocating grid lanes, flex lanes, gaps, padding reservations, or table width.

#### Scenario: Numeric edit icon does not shift numeric content
- **WHEN** a numeric editable cell renders its edit icon affordance
- **THEN** the icon is positioned at inline-start without changing the numeric value or editor's right-aligned content width

#### Scenario: Text edit icon does not shift text content
- **WHEN** a text editable cell renders its edit icon affordance
- **THEN** the icon is positioned at inline-end without changing the text value's left-aligned content width

#### Scenario: Icon visibility changes do not alter table geometry
- **WHEN** an edit icon appears because the cell is hovered, focused, or active
- **THEN** the table column widths, cell content alignment, and row height remain unchanged

### Requirement: Inline focus indication remains inside the cell
The system SHALL provide a visible inline edit focus indication that remains inside the table cell and does not make the editor read as an inserted form widget.

#### Scenario: Focused inline editor uses quiet cell-local affordance
- **WHEN** an inline price or discount editor receives focus
- **THEN** the focus indication is a subtle in-cell treatment such as an inset underline or fill and does not protrude outside the row or cell bounds

### Requirement: Rich editable-cell overlays remain outside table overflow
The system SHALL continue rendering rich price option, discount form, and bill-item picker content through the editable-cell overlay portal outside the invoice table overflow container.

#### Scenario: Rich editor opens from an out-of-flow icon
- **WHEN** a user opens a rich editor from an editable-cell icon affordance
- **THEN** the visible popover content is rendered outside the table overflow container while the trigger remains associated with the production table cell

#### Scenario: Rich editor does not create table scroll
- **WHEN** a rich editor extends beyond the visual bounds of the invoice table
- **THEN** the editor remains visible above the parent billing UI instead of causing the table, icon cell, or row area to become scrollable

### Requirement: Production code paths are preserved
The system SHALL preserve the existing production invoice table, bill details, disabled-state, cancel, validation, and commit code paths while changing the editable-cell visual geometry.

#### Scenario: Storybook exercises production editable-cell behavior
- **WHEN** editable-cell behavior is exercised in Storybook
- **THEN** the story uses production `BillDetails`, `InvoiceTable`, and editable-cell components rather than a Storybook-only replacement

#### Scenario: Disabled rows do not expose edit affordances
- **WHEN** a line item is not editable because of bill or row state
- **THEN** inline editors and rich edit icon affordances remain unavailable for that cell
