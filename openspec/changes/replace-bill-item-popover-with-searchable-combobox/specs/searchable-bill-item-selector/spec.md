## ADDED Requirements

### Requirement: Bill item selector is searchable
The system SHALL provide a searchable billable service selector when editing an invoice line-item bill item.

#### Scenario: Searchable selector opens from bill item cell
- **WHEN** a user activates an editable bill-item cell or its chevron affordance
- **THEN** the system displays a searchable selector for available billable services inside the existing editable-cell overlay

#### Scenario: Services can be filtered by name
- **WHEN** a user types into the searchable bill-item selector
- **THEN** the system filters available billable service options by service name

#### Scenario: Current service is represented in selector
- **WHEN** the searchable bill-item selector opens for a line item with a matched billable service
- **THEN** the selector represents the current billable service as the selected item

### Requirement: Bill item selection remains constrained
The system SHALL only commit bill-item changes when the user selects a billable service from the provided options.

#### Scenario: Service selection auto-commits
- **WHEN** a user selects a billable service from the searchable selector
- **THEN** the system commits the selected service and closes the editor without requiring save or cancel buttons

#### Scenario: Free text is not committed
- **WHEN** a user types text that does not correspond to a selected billable service
- **THEN** the system does not commit that typed text as a bill item

#### Scenario: Empty service list is handled
- **WHEN** no billable services are available
- **THEN** the selector communicates that no bill items are available and does not commit a selection

### Requirement: Bill item selector preserves existing line-item semantics
The system SHALL preserve existing line-item recalculation and update behavior when a billable service is selected through the searchable selector.

#### Scenario: Existing price replacement behavior is preserved
- **WHEN** a selected line item already has an associated service price and the user selects a different billable service
- **THEN** the system applies the same first-price replacement behavior used by the prior bill-item option list

#### Scenario: Commit payload remains compatible
- **WHEN** a billable service selection is committed
- **THEN** the system sends the same billable service and item fields expected by existing line-item update handling

### Requirement: Searchable selector preserves table layout
The system SHALL add searchable selection without making the Carbon control participate in invoice table column sizing.

#### Scenario: ComboBox remains inside overlay
- **WHEN** the searchable bill-item selector is rendered
- **THEN** the Carbon ComboBox is rendered inside the existing overlay portal rather than directly replacing the table cell content

#### Scenario: Table columns remain stable
- **WHEN** the searchable selector opens, filters, selects, or closes
- **THEN** the invoice table column widths remain unchanged
