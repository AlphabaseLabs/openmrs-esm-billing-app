## ADDED Requirements

### Requirement: Editable numeric cells use predictable lanes
The system SHALL render editable numeric invoice table cells with predictable content and affordance lanes.

#### Scenario: Editable numeric cell has stable content and affordance lanes
- **WHEN** a numeric editable invoice table cell is rendered
- **THEN** the cell contains a content lane for the displayed value or active editor and an affordance lane for the edit trigger or reserved empty affordance space

#### Scenario: Icon visibility does not alter geometry
- **WHEN** an edit icon is hidden, disabled, visible, or absent for a row state
- **THEN** the editable cell preserves the same lane geometry for that column type

### Requirement: Numeric editable cells place affordance before content
The system SHALL place the edit affordance lane to the left of the value/editor lane for numeric editable numeric invoice table cells.

#### Scenario: Numeric display value aligns right
- **WHEN** a numeric editable cell displays a value
- **THEN** the edit affordance lane is positioned to the left and the numeric value is right-aligned in the content lane

#### Scenario: Numeric active editor aligns right
- **WHEN** a numeric editable cell enters active editing state
- **THEN** the edit affordance lane remains to the left and the active editor is right-aligned in the content lane

#### Scenario: Numeric read-only row preserves alignment lane
- **WHEN** a numeric cell is not editable because the bill or line item is locked
- **THEN** the numeric value aligns to the same right-edge content lane used by editable rows in that column
### Requirement: Active editors replace only the content lane
The system SHALL replace only the editable cell content lane when entering active editing state.

#### Scenario: Active editor does not add uncontrolled inline width
- **WHEN** an editable cell enters active editing state
- **THEN** the active editor replaces the displayed value inside the content lane without adding uncontrolled inline layout outside the lane system

#### Scenario: Affordance lane remains stable during editing
- **WHEN** an editable cell switches between display and active editing state
- **THEN** the affordance lane remains stable in size and orientation for that cell type

### Requirement: Editable columns account for active editor width
The system SHALL ensure editable table columns reserve enough width for their intended display and active editor states.

#### Scenario: Opening editor does not unexpectedly reflow column
- **WHEN** a user opens an inline editor in a numeric editable invoice table cell
- **THEN** the column does not unexpectedly reflow because the editor width exceeds the inactive cell geometry

#### Scenario: Narrow viewport uses table overflow instead of cell geometry breakage
- **WHEN** the viewport is too narrow to fit all editable column minimum widths
- **THEN** the existing table overflow behavior handles the width pressure and editable cell lane geometry remains intact

### Requirement: Numeric headers align to numeric content lanes
The system SHALL align numeric table headers with the numeric content lane rather than the affordance lane.

#### Scenario: Numeric header follows value alignment axis
- **WHEN** a numeric editable column has a left affordance lane
- **THEN** the column header visually aligns with the right-aligned numeric value/editor lane

### Requirement: Geometry uses production editable-cell implementation
The system SHALL implement editable-cell geometry in production invoice table components rather than Storybook-only components.

#### Scenario: Storybook renders production geometry
- **WHEN** editable numeric invoice table cells are rendered in Storybook
- **THEN** they use the same production editable-cell geometry used by `InvoiceTable`
