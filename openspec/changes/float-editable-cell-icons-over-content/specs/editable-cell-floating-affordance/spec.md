## ADDED Requirements

### Requirement: Edit triggers allocate no cell layout space
The system SHALL render editable line-item cell edit triggers as visual overlays that do not participate in normal table cell layout.

#### Scenario: Numeric edit trigger is out of flow
- **WHEN** an editable numeric line-item cell is rendered
- **THEN** the edit trigger is positioned as an overlay rather than a grid lane, flex lane, gap participant, or reserved content column

#### Scenario: Text edit trigger is out of flow
- **WHEN** an editable text line-item cell is rendered
- **THEN** the edit trigger is positioned as an overlay rather than a grid lane, flex lane, gap participant, or reserved content column

#### Scenario: Cell width is based on content rather than icon
- **WHEN** the invoice table computes editable cell layout
- **THEN** the visible value or active editor remains the normal layout content that determines cell geometry

### Requirement: Numeric editable cells place icon at inline-start
The system SHALL place numeric editable-cell edit triggers at the inline-start edge while keeping numeric values and inline editors right-aligned across the full cell width.

#### Scenario: Numeric display value remains right-aligned
- **WHEN** a numeric editable cell displays a price, discount, tax, or total value
- **THEN** the value is right-aligned across the cell content area and the edit trigger floats at inline-start

#### Scenario: Numeric inline editor remains right-aligned
- **WHEN** a numeric editable cell enters inline edit mode
- **THEN** the inline editor is aligned with numeric cell content and the edit trigger does not consume editor width

### Requirement: Text editable cells place icon at inline-end
The system SHALL place text editable-cell edit triggers at the inline-end edge while keeping text values and editors left-aligned across the full cell width.

#### Scenario: Text display value remains left-aligned
- **WHEN** a text editable cell displays a bill item label
- **THEN** the value is left-aligned across the cell content area and the edit trigger floats at inline-end

#### Scenario: Text editor remains left-aligned
- **WHEN** a text editable cell enters edit or picker mode
- **THEN** the editable text content remains left-aligned and the edit trigger does not consume content width

### Requirement: Floating icons do not truncate cell content
The system SHALL NOT truncate or reserve padding in editable-cell content solely to make room for floating edit triggers.

#### Scenario: Long text remains unreserved for icon
- **WHEN** a text editable cell contains a long bill item label
- **THEN** the label is not shortened because of an edit-trigger layout reservation

#### Scenario: Numeric values remain unreserved for icon
- **WHEN** a numeric editable cell contains a wide amount
- **THEN** the amount is not shifted or shortened because of an edit-trigger layout reservation

### Requirement: Floating icons remain readable over content
The system SHALL give floating edit triggers a compact white or gray visual surface so the icon remains readable when it overlaps cell content.

#### Scenario: Icon overlaps content in constrained cells
- **WHEN** an editable cell is too narrow to visually separate the trigger from the content
- **THEN** the trigger remains readable through its own compact background or surface treatment

#### Scenario: Focused icon remains visible
- **WHEN** a keyboard user focuses an edit trigger
- **THEN** the trigger has a visible focus state without requiring layout space inside the cell

### Requirement: Rich editor popovers continue escaping table overflow
The system SHALL preserve the existing rich editor portal behavior while changing compact edit trigger geometry.

#### Scenario: Opening a rich editor from a floating trigger
- **WHEN** a user opens a rich price, discount, or bill-item editor from a floating trigger
- **THEN** the rich editor content renders through the existing overlay portal outside the table overflow boundary

#### Scenario: Trigger remains associated with production table cell
- **WHEN** a user opens or closes an editable cell editor
- **THEN** the trigger remains associated with the production `InvoiceTable` cell and no Storybook-only editable-cell implementation is used
