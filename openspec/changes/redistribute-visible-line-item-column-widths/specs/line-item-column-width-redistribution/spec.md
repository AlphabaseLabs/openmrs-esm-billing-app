## ADDED Requirements

### Requirement: Visible line item columns allocate width deterministically
The system SHALL allocate invoice line item table widths from the currently rendered visible columns instead of from a static full-column-set width model.

#### Scenario: Optional column is hidden
- **WHEN** an optional line item column is hidden from the table
- **THEN** the remaining visible columns SHALL receive deterministic widths from the visible column set
- **AND** the hidden column SHALL NOT leave reserved visual space behind

#### Scenario: Multiple optional columns are hidden
- **WHEN** Status, Discount, and Tax are hidden together
- **THEN** the remaining visible columns SHALL fill the available table width in registry order
- **AND** trailing columns SHALL NOT absorb browser-dependent slack

#### Scenario: Optional columns are restored
- **WHEN** previously hidden optional columns are restored
- **THEN** the table SHALL recompute widths using the restored visible column set
- **AND** header and body cells SHALL remain aligned

### Requirement: Width allocation preserves fixed table layout
The system SHALL keep the line items table on fixed table layout while computing explicit widths for rendered columns.

#### Scenario: Editable cell opens
- **WHEN** a Price, Discount, Quantity, or Bill Item editable cell opens
- **THEN** the table column widths SHALL remain unchanged
- **AND** the active editor or popover SHALL NOT influence the table width allocation

#### Scenario: Content is longer than the visible cell
- **WHEN** a visible cell contains text or numeric content longer than its allocated column width
- **THEN** the table SHALL preserve the allocated column width
- **AND** the table SHALL use the existing cell overflow behavior rather than resizing columns from content

### Requirement: Width allocation includes rendered control columns
The system SHALL include non-registry table control columns in the width model when those columns are rendered.

#### Scenario: Selection column is rendered
- **WHEN** the Carbon selection checkbox column is rendered before the line item columns
- **THEN** the width model SHALL include a corresponding leading selection column
- **AND** every generated width SHALL align with the correct rendered header and body cell

#### Scenario: Selection column is not rendered
- **WHEN** the Carbon selection checkbox column is not rendered
- **THEN** the width model SHALL omit the synthetic selection column
- **AND** registry-backed columns SHALL remain aligned with their generated widths

### Requirement: Fixed columns do not absorb surplus
The system SHALL exclude fixed-width columns from surplus width distribution.

#### Scenario: Available table width exceeds minimum width
- **WHEN** the table container is wider than the visible column minimum width sum
- **THEN** fixed columns such as selection and Actions SHALL retain their fixed widths
- **AND** flexible data columns SHALL absorb surplus width according to explicit grow weights

#### Scenario: Action column remains stable
- **WHEN** optional columns such as Tax, Discount, or Status are hidden
- **THEN** the Actions column SHALL remain at its fixed width
- **AND** the Actions column SHALL NOT expand to consume freed space

### Requirement: Visible table minimum width follows visible columns
The system SHALL compute the line items table minimum width from the currently rendered visible columns.

#### Scenario: Container is narrower than visible minimum width
- **WHEN** the table container is narrower than the sum of visible column minimum widths
- **THEN** the table SHALL preserve the visible minimum width
- **AND** horizontal overflow behavior SHALL remain available rather than shrinking columns below their minimum widths

#### Scenario: Container is wider than visible minimum width
- **WHEN** the table container is wider than the sum of visible column minimum widths
- **THEN** the visible columns SHALL redistribute the surplus width deterministically
- **AND** the table SHALL continue to occupy the available table container width

### Requirement: Widths recompute on relevant layout changes
The system SHALL recompute line item column widths when the visible column set or table container width changes.

#### Scenario: Column visibility changes
- **WHEN** a user hides or restores a column from the column visibility control
- **THEN** the line item table SHALL recompute rendered column widths for the new visible column set

#### Scenario: Container width changes
- **WHEN** the line item table container changes width due to viewport resizing or layout changes
- **THEN** the line item table SHALL recompute rendered column widths
- **AND** column order and header/body alignment SHALL remain stable

### Requirement: Column visibility control placement remains unchanged
The system SHALL preserve the existing column visibility control placement for this change.

#### Scenario: Width redistribution is implemented
- **WHEN** the width redistribution behavior is added
- **THEN** the Columns control SHALL remain in its current toolbar location
- **AND** the change SHALL NOT introduce a new table-header overflow menu
