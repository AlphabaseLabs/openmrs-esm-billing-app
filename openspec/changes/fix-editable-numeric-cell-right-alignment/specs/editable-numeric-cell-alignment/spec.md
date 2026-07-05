## ADDED Requirements

### Requirement: Editable numeric display values remain right aligned
The system SHALL keep editable numeric display values aligned to the inline end of their table cell while using a full-width interactive content surface.

#### Scenario: Price display value uses the right edge of the full surface
- **WHEN** an editable price cell renders in display mode
- **THEN** the full editable surface is clickable
- **AND** the visible price value is aligned to the inline end of that surface

#### Scenario: Discount display value uses the right edge of the full surface
- **WHEN** an editable discount cell renders in display mode
- **THEN** the full editable surface is clickable
- **AND** the visible discount value is aligned to the inline end of that surface

### Requirement: Editable numeric inline editors remain right aligned
The system SHALL keep active editable numeric inline editors aligned consistently with their display values.

#### Scenario: Price inline editor preserves numeric alignment
- **WHEN** a user activates inline editing for a price cell
- **THEN** the input text is aligned to the inline end of the cell
- **AND** the row height and column width are not increased to reserve edit-icon space

#### Scenario: Discount inline editor preserves numeric alignment
- **WHEN** a user activates inline editing for a discount cell
- **THEN** the input text is aligned to the inline end of the cell
- **AND** the row height and column width are not increased to reserve edit-icon space

### Requirement: Editable text cells remain left aligned
The system SHALL preserve left alignment for editable text cell surfaces while restoring numeric right alignment.

#### Scenario: Bill item display value remains left aligned
- **WHEN** an editable bill-item cell renders in display mode
- **THEN** the full editable surface is clickable
- **AND** the visible bill-item value remains aligned to the inline start of that surface

### Requirement: Button reset styles do not override field-type alignment
The system SHALL ensure shared full-surface button reset styles do not override numeric or text field-type alignment rules.

#### Scenario: Numeric surface combines full-width hit target with numeric alignment
- **WHEN** a numeric editable cell uses the shared full-surface button style
- **THEN** the surface keeps full-width hit target behavior
- **AND** numeric alignment rules still place the value at the inline end

#### Scenario: Text surface combines full-width hit target with text alignment
- **WHEN** a text editable cell uses the shared full-surface button style
- **THEN** the surface keeps full-width hit target behavior
- **AND** text alignment rules still place the value at the inline start
