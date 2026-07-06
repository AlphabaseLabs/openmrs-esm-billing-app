## ADDED Requirements

### Requirement: Active bill-item cell is the search input
The bill-item editor SHALL use the active table cell itself as the searchable combobox input surface while the editor is open.

#### Scenario: Opening bill-item editor
- **WHEN** the user opens the bill-item editor for a selected line item
- **THEN** the active bill-item cell displays a borderless text input containing the current bill-item name
- **AND** the input text is selected for replacement typing
- **AND** the popover does not render a second visual input control

#### Scenario: Active cell visual continuity
- **WHEN** the bill-item editor is open
- **THEN** the input surface remains visually welded to the table cell
- **AND** the input inherits the cell typography, height, active background, and cell alignment
- **AND** the chevron remains inside the cell as the combobox toggle affordance

### Requirement: Popover contains only bill-item options
The bill-item editor popover SHALL contain the bill-item option menu and no nested Carbon ComboBox shell.

#### Scenario: Popover opens
- **WHEN** the user opens the bill-item editor
- **THEN** the popover shows the available billable service options
- **AND** it does not show a separate bordered input, clear button, or standalone ComboBox visual shell

#### Scenario: Current selection is indicated
- **WHEN** the option list includes the currently selected bill item
- **THEN** that option is visually marked as selected
- **AND** other options remain selectable

### Requirement: Search filters valid catalog bill items
The bill-item editor SHALL filter the available options from the in-cell input value.

#### Scenario: Filtering options
- **WHEN** the user types a search query into the active bill-item cell input
- **THEN** the option list only shows billable services whose names match the query

#### Scenario: No matching options
- **WHEN** the search query matches no billable services
- **THEN** the popover shows a non-selectable `No results` state
- **AND** no create-new action is shown

### Requirement: Only valid bill-item selections commit
The bill-item editor SHALL commit only when the user selects a valid billable service option.

#### Scenario: Selecting an option
- **WHEN** the user selects a billable service option from the popover
- **THEN** the line item commits that billable service
- **AND** the editor closes
- **AND** existing bill-item price recalculation behavior is preserved

#### Scenario: Typed free text does not commit
- **WHEN** the user types text that is not selected from the billable service list
- **THEN** the typed text is not committed as a bill item
- **AND** no arbitrary bill item is created

### Requirement: Uncommitted search text reverts
The bill-item editor SHALL restore the previous selected bill item when the user exits without selecting a valid option.

#### Scenario: Escape cancels typed query
- **WHEN** the user types a query and presses Escape without selecting an option
- **THEN** the editor closes
- **AND** the cell displays the previous selected bill-item name
- **AND** the line item remains unchanged

#### Scenario: Blur cancels typed query
- **WHEN** the user types a query and moves focus away without selecting an option
- **THEN** the editor closes or resets according to the existing editable-cell close behavior
- **AND** the cell displays the previous selected bill-item name
- **AND** the line item remains unchanged

### Requirement: Combobox accessibility is preserved
The bill-item editor SHALL preserve accessible combobox semantics while using the custom welded cell surface.

#### Scenario: Combobox wiring
- **WHEN** the bill-item editor is open
- **THEN** the in-cell input has combobox semantics with expanded state
- **AND** the input is associated with the listbox popover
- **AND** active option state is exposed for keyboard navigation

#### Scenario: Keyboard navigation
- **WHEN** the user uses ArrowDown, ArrowUp, Home, End, Enter, or Escape while the bill-item editor is open
- **THEN** the editor follows standard single-select combobox keyboard behavior
- **AND** Enter commits the active valid option
- **AND** Escape exits without committing typed free text

### Requirement: Scope remains bill-item only
The welded searchable combobox change SHALL apply only to the bill-item editable cell.

#### Scenario: Other editors remain unchanged
- **WHEN** the user opens the price or discount editor
- **THEN** those editors keep their existing interaction model
- **AND** they are not converted to in-cell searchable combobox inputs
