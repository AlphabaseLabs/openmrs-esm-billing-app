## ADDED Requirements

### Requirement: Open invoices show a final add item row

The invoice line-items table SHALL render a final non-data row with an `Add item` affordance when the bill is open.

#### Scenario: Add item row appears after rendered line items

- **WHEN** an invoice line-items table is rendered for a bill where `closed` is false
- **AND** the table renders one or more line item rows
- **THEN** the table body SHALL render an add item row after the line item rows
- **AND** the add item row SHALL contain an action with accessible name `Add item`.

#### Scenario: Add item row spans the visible table

- **WHEN** an open invoice line-items table renders the add item row
- **THEN** the add item row SHALL contain a single table cell
- **AND** that cell SHALL span all currently rendered table columns, including the selection column when it is present.

### Requirement: Add item row opens the existing add bill item workspace

The add item row action SHALL trigger the same add bill item workspace behavior as the existing table toolbar action.

#### Scenario: User clicks add item row action

- **WHEN** a user clicks the `Add item` action in the final table row
- **THEN** the system SHALL launch the `billing-form` workspace
- **AND** the workspace props SHALL include the current bill patient UUID
- **AND** the workspace props SHALL include workspace title `Add bill item`
- **AND** the workspace props SHALL set `navigateToBillAfterSave` to true.

### Requirement: Add item row is not line item data

The add item row SHALL NOT participate in line item data behavior.

#### Scenario: Table row mechanics ignore add item row

- **WHEN** the invoice line-items table renders the add item row
- **THEN** the add item row SHALL NOT be included in the Carbon `DataTable` rows array
- **AND** the add item row SHALL NOT render a selection checkbox
- **AND** the add item row SHALL NOT render line item action buttons
- **AND** the add item row SHALL NOT affect line item numbering.

#### Scenario: Search and sorting do not treat add item as a line item

- **WHEN** a user searches or sorts the invoice line-items table
- **THEN** the add item row SHALL remain outside line item matching and ordering logic
- **AND** the add item row SHALL render after the currently rendered line item rows when it is visible.

### Requirement: Closed invoices hide the final add item row

The invoice line-items table SHALL NOT render the final add item row when the bill is closed.

#### Scenario: Closed bill table

- **WHEN** an invoice line-items table is rendered for a bill where `closed` is true
- **THEN** the table body SHALL NOT render the add item row
- **AND** no `Add item` action SHALL be available from the final table row.

### Requirement: Existing toolbar add action remains unchanged

The existing line-items toolbar `Add bill item` action SHALL remain available for open bills and SHALL keep its current workspace launch behavior.

#### Scenario: Open bill toolbar action

- **WHEN** an invoice line-items table is rendered for a bill where `closed` is false
- **THEN** the existing toolbar `Add bill item` action SHALL remain visible
- **AND** activating it SHALL launch the same `billing-form` workspace behavior as before.
