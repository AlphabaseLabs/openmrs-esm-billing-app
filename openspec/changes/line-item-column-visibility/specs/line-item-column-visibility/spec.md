## ADDED Requirements

### Requirement: Line item table exposes optional column visibility controls
The system SHALL allow users to show or hide eligible optional columns in the invoice line items table.

#### Scenario: User hides an optional column
- **WHEN** the user hides an eligible optional column such as Status, Tax, Discount, Quantity, or Number
- **THEN** the table MUST remove that column header and all corresponding row cells from the rendered table
- **AND** the remaining headers and row cells MUST stay aligned

#### Scenario: User shows a hidden optional column
- **WHEN** the user shows a previously hidden optional column
- **THEN** the table MUST restore that column header and all corresponding row cells in the configured column order
- **AND** existing editable-cell behavior for that column MUST be available when applicable

### Requirement: Required columns remain visible
The system SHALL prevent required line item columns from being hidden.

#### Scenario: Required columns are not hideable
- **WHEN** the column visibility control is opened
- **THEN** required columns such as selection/control columns, Bill item, Price, Total, and Actions MUST NOT be offered as hideable columns

#### Scenario: Required columns remain visible after preferences load
- **WHEN** persisted visibility preferences are loaded
- **THEN** required columns MUST remain visible even if persisted data attempts to hide them

### Requirement: Column visibility is presentation-only
The system SHALL treat line item column visibility as a view preference only and MUST NOT alter bill data, calculations, validation, totals, or save payloads.

#### Scenario: Hidden financial column still participates in totals
- **WHEN** the user hides Discount or Tax
- **THEN** invoice totals MUST continue to include existing discount and tax values according to existing calculation rules

#### Scenario: Hidden editable column data is preserved
- **WHEN** the user hides an editable optional column such as Quantity or Discount
- **THEN** the underlying line item value MUST remain unchanged
- **AND** save payloads MUST continue to use the complete line item data model

### Requirement: Headers and cells share one column registry
The system SHALL render line item table headers and row cells from the same filtered column registry.

#### Scenario: Header and body visibility stay synchronized
- **WHEN** any optional column visibility setting changes
- **THEN** the table MUST derive both headers and row cells from the same visible column list
- **AND** no header-only or body-only hidden column state MUST occur

#### Scenario: Column order remains stable
- **WHEN** optional columns are hidden and shown
- **THEN** visible columns MUST remain in the registry-defined table order

### Requirement: Column visibility preference persists locally
The system SHALL persist line item column visibility preferences locally for the billing app table view.

#### Scenario: Preference persists after reload
- **WHEN** the user hides optional columns and reloads the page
- **THEN** the table MUST restore the user's visible-column preference from local storage

#### Scenario: Invalid persisted preference falls back safely
- **WHEN** local storage is missing, malformed, or contains unknown column ids
- **THEN** the table MUST fall back to the default visible-column configuration without crashing
- **AND** unknown column ids MUST be ignored

### Requirement: Active editors close before hiding their column
The system SHALL close active editable-cell state before applying a visibility change that hides the active column.

#### Scenario: User hides currently edited column
- **WHEN** an editable cell is active and the user hides that column
- **THEN** the active editor MUST close before the column is hidden
- **AND** the table MUST not leave orphaned popovers, inline editors, or focusable controls for the hidden column
