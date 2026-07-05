## ADDED Requirements

### Requirement: Editable cells render in the production invoice table
The system SHALL render editable `Bill item`, `Price`, and `Discount` cells from production invoice table code while preserving the existing Carbon `DataTable` engine.

#### Scenario: Pending bill renders editable production cells
- **WHEN** a pending bill is displayed in `BillDetails`
- **THEN** the line items table renders the real production editable cell components for `Bill item`, `Price`, and `Discount`
- **AND** the table continues to use the existing Carbon `DataTable` row, selection, search, loading, and action behavior

#### Scenario: No story-only implementation is used
- **WHEN** Storybook renders the invoice table or bill details stories for this capability
- **THEN** the stories render the same production components used by the billing app
- **AND** the stories MUST NOT render a parallel mock editable-cell implementation

### Requirement: Editability is gated by line-item status
The system SHALL allow cell editing only for line-item statuses that support edits and SHALL render locked rows as static cells.

#### Scenario: Pending row exposes edit affordances
- **WHEN** the user hovers or focuses a `PENDING` line-item cell for `Bill item`, `Price`, or `Discount`
- **THEN** the cell exposes the appropriate edit affordance for that column

#### Scenario: Paid row remains static
- **WHEN** the user hovers or focuses a `PAID` line-item cell for `Bill item`, `Price`, or `Discount`
- **THEN** the cell renders as static text
- **AND** no cursor change, icon, input, dropdown, or popover affordance is shown

### Requirement: Only one cell editor is active
The system SHALL allow at most one active inline editor, dropdown, or popover across the line items table.

#### Scenario: Activating another cell commits the valid current edit
- **WHEN** a cell has a valid draft value and the user activates another editable cell
- **THEN** the current cell commits its value before the next cell opens

#### Scenario: Activating another cell does not discard invalid edits
- **WHEN** a cell has an invalid draft value and the user activates another editable cell
- **THEN** the current cell remains active with its validation error
- **AND** the next cell does not open

### Requirement: Price cell supports inline entry and preset picker
The system SHALL provide a hybrid `Price` cell with separate hit zones for free-typed numeric editing and preset price selection.

#### Scenario: Price number enters inline edit
- **WHEN** the user clicks the price number on an editable row
- **THEN** the number is replaced with a focused Carbon `NumberInput` containing the current price
- **AND** the options icon is hidden while inline editing

#### Scenario: Price inline edit saves valid value
- **WHEN** the user enters a non-empty numeric price greater than or equal to zero and commits with Enter, Tab, blur, or click-away
- **THEN** the system persists the price change
- **AND** the cell returns to formatted text
- **AND** row total and invoice summary values are recomputed

#### Scenario: Price inline edit rejects invalid value
- **WHEN** the user commits an empty, non-numeric, or negative price value
- **THEN** the system does not save the value
- **AND** the price input remains active with an error state

#### Scenario: Price icon opens preset picker
- **WHEN** the user clicks the hover-revealed price options icon
- **THEN** the system opens a popover anchored to the price cell
- **AND** the price number remains visible
- **AND** inline price editing does not start

#### Scenario: Selecting preset price updates row
- **WHEN** the user selects a preset price option from the price popover
- **THEN** the system persists `price`, `priceName`, and `priceUuid` for that line item
- **AND** the selected price option closes
- **AND** row total and invoice summary values are recomputed

### Requirement: Discount cell supports inline amount entry and discount form
The system SHALL provide a hybrid `Discount` cell with separate hit zones for absolute amount editing and the discount form.

#### Scenario: Discount number enters inline edit
- **WHEN** the user clicks the discount number on an editable row
- **THEN** the number is replaced with a focused numeric editor for the absolute discount amount
- **AND** the discount form popover does not open

#### Scenario: Discount inline edit saves valid amount
- **WHEN** the user enters an absolute discount amount greater than or equal to zero and less than or equal to the line subtotal
- **THEN** the system persists the discount update
- **AND** row total and invoice summary values are recomputed

#### Scenario: Discount icon opens form
- **WHEN** the user clicks the hover-revealed discount options icon
- **THEN** the system opens a discount form popover
- **AND** the form includes amount, percent, discount sponsor, and comment fields

#### Scenario: Discount amount and percent stay synchronized
- **WHEN** the user edits the amount or percent field in the discount form
- **THEN** the corresponding percent or amount field is recalculated from the line subtotal
- **AND** percent values are constrained to the inclusive range from 0 to 100

#### Scenario: Discount form save persists discount payload
- **WHEN** the user saves a valid discount form
- **THEN** the system persists the line-item `discounts` payload
- **AND** the popover closes
- **AND** row total and invoice summary values are recomputed

### Requirement: Bill item cell supports searchable selection
The system SHALL provide a searchable `Bill item` cell using production billable service data.

#### Scenario: Bill item opens ComboBox
- **WHEN** the user clicks an editable Bill item cell
- **THEN** the item name is replaced with a focused Carbon `ComboBox`
- **AND** the menu is open with the current item pre-selected when available

#### Scenario: Bill item filters services by text
- **WHEN** the user types into the Bill item ComboBox
- **THEN** the options are filtered by contains match against available billable service labels

#### Scenario: Bill item selection updates item and default price
- **WHEN** the user selects a billable service from the ComboBox
- **THEN** the system persists the selected billable service for the row
- **AND** the row's available price options refresh from the selected service
- **AND** the row price resets to the selected service default price when present, otherwise to the selected service first price
- **AND** row total and invoice summary values are recomputed

#### Scenario: Bill item unmatched text cannot save
- **WHEN** the user enters text that does not match a billable service and attempts to commit
- **THEN** the system does not persist a line-item change
- **AND** the cell restores or remains active according to the active editor rules

### Requirement: Visual rest state matches Carbon table cells
The system SHALL render editable cells without persistent editing chrome at rest.

#### Scenario: Cells at rest look plain
- **WHEN** `Bill item`, `Price`, and `Discount` cells are not hovered, focused, editing, or open
- **THEN** they render with the same visual treatment as regular Carbon table cells
- **AND** no input border, persistent icon, dropdown, or popover is visible

#### Scenario: Numeric cells align right
- **WHEN** `Price`, `Discount`, and `Total` values render in the table
- **THEN** the numeric values are right-aligned

### Requirement: Keyboard and dismissal behavior is supported
The system SHALL provide keyboard access and predictable commit/cancel behavior for all editable cells.

#### Scenario: Keyboard opens inline editor
- **WHEN** keyboard focus is on an editable cell and the user presses Enter or Space
- **THEN** the cell enters its primary edit mode

#### Scenario: Escape cancels active edit
- **WHEN** a cell editor, picker, form, or ComboBox is active and the user presses Escape
- **THEN** the system discards the draft value
- **AND** the cell returns to its prior committed display value

#### Scenario: Blur saves valid draft
- **WHEN** a cell has a valid draft and loses focus through Tab or click-away
- **THEN** the system commits the draft value

### Requirement: Floating layers are not clipped
The system SHALL render price popovers, discount popovers, and ComboBox menus above table rows without clipping.

#### Scenario: Popover opens inside table overflow area
- **WHEN** a price picker, discount form, or Bill item ComboBox menu opens near a table edge
- **THEN** the floating layer remains visible above the table
- **AND** the layer is not clipped by the cell, row, table body, or Storybook iframe container

### Requirement: Saves persist and recompute production bill state
The system SHALL persist valid edits through production billing resources and update the displayed bill state after successful saves.

#### Scenario: Save calls line-item update resource
- **WHEN** the user saves a valid Price, Discount, or Bill item edit
- **THEN** the system calls the production line-item update resource for that line-item UUID with the appropriate payload

#### Scenario: Save updates invoice summary
- **WHEN** a line-item edit is saved successfully
- **THEN** the line item row values update immediately
- **AND** the bill total, amount due, and payment section values derived from the bill are recalculated from the updated line items

#### Scenario: Failed save preserves previous state
- **WHEN** the line-item update resource rejects or fails a save
- **THEN** the system restores the previous committed line-item value
- **AND** the system surfaces an error notification to the user
