## ADDED Requirements

### Requirement: Suppress editable-cell edit icons while an editor is open
The system SHALL hide all editable-cell edit icons whenever any editable-cell editor popover is open.

#### Scenario: Opening a price editor hides editable-cell icons
- **WHEN** a user opens the price editor popover for any invoice line item
- **THEN** the edit icons for bill item, price, and discount editable cells are not visible

#### Scenario: Hover does not reveal icons while an editor is open
- **WHEN** any editable-cell editor popover is open and the user hovers another editable cell
- **THEN** the hovered cell's edit icon remains hidden

#### Scenario: Focus does not reveal icons while an editor is open
- **WHEN** any editable-cell editor popover is open and an editable cell receives focus
- **THEN** that cell's edit icon remains hidden

### Requirement: Restore editable-cell edit icons after editor close
The system SHALL restore normal editable-cell edit icon visibility rules after the active editor popover closes.

#### Scenario: Hover reveals icons after editor close
- **WHEN** no editable-cell editor popover is open and the user hovers an editable cell
- **THEN** that cell's edit icon is visible according to the existing hover affordance behavior

#### Scenario: Focus reveals icons after editor close
- **WHEN** no editable-cell editor popover is open and an editable cell receives focus
- **THEN** that cell's edit icon is visible according to the existing focus affordance behavior

### Requirement: Leave non-editable-cell actions unchanged
The system SHALL NOT hide or alter row-level action icons solely because an editable-cell editor popover is open.

#### Scenario: Row actions remain visible during cell editing
- **WHEN** an editable-cell editor popover is open
- **THEN** row-level action icons in the Action column retain their existing visibility and behavior
