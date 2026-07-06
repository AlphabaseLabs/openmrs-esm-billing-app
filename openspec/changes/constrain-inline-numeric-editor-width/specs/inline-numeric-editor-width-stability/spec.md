## ADDED Requirements

### Requirement: Inline numeric editor preserves table column width
The system SHALL prevent editable numeric table columns from changing width when a price or discount cell enters inline edit mode.

#### Scenario: Price inline editor opens without column shift
- **WHEN** a user opens inline editing for a price cell
- **THEN** the price column retains the same table layout width as it had before the click

#### Scenario: Discount inline editor opens without column shift
- **WHEN** a user opens inline editing for a discount cell
- **THEN** the discount column retains the same table layout width as it had before the click

### Requirement: Inline numeric editor is constrained to cell width
The system SHALL constrain the inline numeric editor and its Carbon text input wrappers to the available editable-cell content width.

#### Scenario: Editor wrapper does not define wider intrinsic width
- **WHEN** the inline numeric editor is rendered
- **THEN** the editor shell and Carbon input wrappers are constrained with no larger intrinsic minimum width than the cell content lane

#### Scenario: Editor remains inside existing cell shell
- **WHEN** the inline numeric editor is active
- **THEN** it remains inside the existing editable-cell content shell rather than being rendered as a portal or overlay

### Requirement: Numeric alignment remains unchanged
The system SHALL preserve right alignment for numeric display values and active inline numeric inputs.

#### Scenario: Active price input is right aligned
- **WHEN** a price cell is in inline edit mode
- **THEN** the active input text is right aligned

#### Scenario: Active discount input is right aligned
- **WHEN** a discount cell is in inline edit mode
- **THEN** the active input text is right aligned
