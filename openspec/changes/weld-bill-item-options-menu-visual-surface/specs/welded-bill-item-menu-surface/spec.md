## ADDED Requirements

### Requirement: Bill-item options menu visually welds to the active cell
The editable bill-item options menu SHALL appear as the continuation of the active bill-item table cell, not as a separate standalone popover.

#### Scenario: Menu opens below active bill-item cell
- **WHEN** the user opens the bill-item editor in the default pending bill story
- **THEN** the options menu top edge SHALL visually attach to the active bill-item cell bottom edge without a visible vertical gap
- **AND** the options menu left edge SHALL align with the active bill-item cell left edge
- **AND** the options menu SHALL read as the lower portion of the same editor surface

#### Scenario: Menu uses active cell width
- **WHEN** the bill-item editor is open
- **THEN** the options menu SHALL use the active bill-item cell width as its visual width
- **AND** the menu SHALL NOT impose a wider standalone minimum width that makes it visually detach from the active cell in the default pending bill story

### Requirement: Bill-item options menu removes standalone shell treatment
The bill-item options menu SHALL avoid visual treatments that make it read as an independent card separate from the active cell.

#### Scenario: Standalone popover styling is not visible
- **WHEN** the bill-item options menu is open
- **THEN** the menu SHALL NOT show a heavy independent popover shell around the options list
- **AND** the menu SHALL NOT show a separate top border or shadow treatment that visually splits it from the active cell

#### Scenario: Depth treatment remains subtle
- **WHEN** the bill-item options menu overlaps surrounding content
- **THEN** any shadow or border treatment SHALL support the combined active-cell-plus-menu surface
- **AND** it SHALL NOT make the menu appear as a disconnected floating box

### Requirement: Bill-item option rows have comfortable vertical rhythm
The bill-item option rows SHALL have explicit vertical sizing that prevents the options from appearing compressed.

#### Scenario: Options list displays available bill items
- **WHEN** the bill-item options menu displays Consultation, Clear Aligner, and Registration
- **THEN** each option row SHALL have enough vertical height for readable labels and selection state
- **AND** the rows SHALL NOT rely on compact generic option padding that makes the list appear squeezed

#### Scenario: Selected option remains clear
- **WHEN** the current bill item appears in the options list
- **THEN** the selected option SHALL retain clear selected styling
- **AND** the selected option checkmark SHALL remain right-aligned within the welded menu width

### Requirement: Bill-item search behavior remains unchanged
The visual welded menu refinement SHALL preserve the existing bill-item search and selection behavior.

#### Scenario: Search remains in active cell
- **WHEN** the bill-item editor is open
- **THEN** the searchable input SHALL remain inside the active table cell
- **AND** the options menu SHALL NOT render a nested search input or nested Carbon ComboBox visual shell

#### Scenario: Filtering and selection continue to work
- **WHEN** the user types into the active bill-item cell input
- **THEN** the options menu SHALL filter billable service options using the existing behavior
- **AND** selecting a valid option SHALL continue to commit the selected bill item using the existing behavior

### Requirement: Scope is limited to bill-item options menu visuals
The welded visual treatment SHALL be limited to the editable bill-item options menu.

#### Scenario: Other editable popovers are unaffected
- **WHEN** price or discount editors are opened
- **THEN** their popover surfaces SHALL keep their existing visual treatment
- **AND** they SHALL NOT inherit the bill-item welded options menu surface styling
