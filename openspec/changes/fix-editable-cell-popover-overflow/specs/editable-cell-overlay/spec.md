## ADDED Requirements

### Requirement: Rich editable cell popovers escape table overflow
The system SHALL render rich invoice line-item editable-cell popovers outside the invoice table overflow container while keeping the editable trigger inside the production table cell.

#### Scenario: Opening a rich editor inside a scrollable invoice table
- **WHEN** a user opens a rich editable line-item cell editor from the invoice table
- **THEN** the editor popover is rendered in an overlay layer that is not a descendant of the table's scrollable overflow container

#### Scenario: Popover floats above parent billing UI
- **WHEN** the opened editor extends beyond the visual bounds of the invoice table
- **THEN** the editor remains visible above the parent billing UI instead of causing the table, icon cell, or row area to become scrollable

### Requirement: Editable cell trigger remains production table behavior
The system SHALL keep the editable cell trigger, displayed value, disabled state, and commit entry point in the production `InvoiceTable` code path.

#### Scenario: Trigger remains in the table cell
- **WHEN** a user views an editable price, discount, or bill-item cell
- **THEN** the visible value and edit trigger are rendered inside the production invoice table cell

#### Scenario: Storybook uses production implementation
- **WHEN** the editable cell behavior is exercised in Storybook
- **THEN** the story uses production `BillDetails`, `InvoiceTable`, and editable-cell components rather than a Storybook-only replacement

### Requirement: Overlay remains anchored to the active cell
The system SHALL position the opened editor from the active cell or trigger geometry and maintain a single active editor at a time.

#### Scenario: Opening an editor positions it near the trigger
- **WHEN** a user opens a rich editable cell editor
- **THEN** the editor appears visually anchored to the clicked cell or edit trigger

#### Scenario: Opening another editor replaces the active editor
- **WHEN** a user opens a second editable cell editor while one is already open
- **THEN** the first editor closes or is replaced so only one line-item editor is active

### Requirement: Overlay handles viewport layout changes
The system SHALL prevent an opened editor overlay from remaining visually detached from its table cell after viewport scroll or resize.

#### Scenario: Page scrolls while editor is open
- **WHEN** the page or containing layout scrolls while a rich editable cell editor is open
- **THEN** the system closes or repositions the editor so it does not remain detached from its trigger

#### Scenario: Viewport resizes while editor is open
- **WHEN** the viewport size changes while a rich editable cell editor is open
- **THEN** the system closes or repositions the editor so it does not remain detached from its trigger

### Requirement: Existing commit and cancel behavior is preserved
The system SHALL preserve existing editable-cell commit, cancel, validation, and disabled-state behavior after moving rich editor popovers to an overlay.

#### Scenario: Committing an edit from the overlay
- **WHEN** a user submits a valid price, discount, or bill-item edit from the overlay
- **THEN** the existing line-item update path is used and the invoice table reflects the updated line item

#### Scenario: Cancelling an edit from the overlay
- **WHEN** a user cancels or dismisses an opened editable-cell overlay
- **THEN** no line-item update is committed

#### Scenario: Disabled rows do not open rich editors
- **WHEN** a line item is not editable because of bill or row state
- **THEN** no rich editable-cell overlay opens for that cell
