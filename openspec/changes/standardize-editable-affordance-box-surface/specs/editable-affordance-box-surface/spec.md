## ADDED Requirements

### Requirement: Shared editable affordance box surface
The system SHALL use `.optionsButton` as the shared visual surface for editable-cell option buttons used by bill item, price, and discount cells.

#### Scenario: Shared surface is applied to editable option buttons
- **WHEN** bill item, price, and discount editable-cell option buttons are rendered
- **THEN** each uses the same `.optionsButton` box surface for size, radius, background, border, and centering

### Requirement: Shared surface uses transparent bordered styling
The shared editable affordance box surface SHALL use a transparent background, a light grey border, the existing affordance size, and the existing affordance radius.

#### Scenario: Affordance surface visual style
- **WHEN** an editable-cell option button is visible
- **THEN** it appears as a transparent fixed-size box with a light grey border and the standardized radius

### Requirement: Glyphs remain control-specific
The shared affordance box MUST NOT change the glyph semantics of the controls: bill item and price controls SHALL continue to render chevrons, and the discount control SHALL continue to render `%`.

#### Scenario: Control glyphs are preserved
- **WHEN** bill item, price, and discount option buttons are visible
- **THEN** bill item and price show chevron glyphs and discount shows the `%` glyph

### Requirement: Chevron open-state behavior is preserved
The bill-item and price chevron controls SHALL preserve their existing open-state rotation behavior while using the shared transparent bordered affordance box.

#### Scenario: Chevron opens
- **WHEN** a bill-item or price option menu is open
- **THEN** its chevron indicates the open state as before while remaining inside the shared affordance box

### Requirement: Discount behavior is preserved
The discount `%` affordance MUST preserve existing discount editor open behavior, focus behavior, hover behavior, calculations, auto-commit behavior, and payment totals.

#### Scenario: Discount editor opens unchanged
- **WHEN** the user activates the discount `%` affordance
- **THEN** the existing discount editor opens with unchanged behavior

#### Scenario: Discount calculations remain unchanged
- **WHEN** the user edits discount values through the discount editor
- **THEN** discount calculations and payment totals remain unchanged

### Requirement: No unrelated layout or popover changes
The shared affordance surface change MUST NOT alter table column widths, popover positioning, popover content layout, bill-item search behavior, or price selection behavior.

#### Scenario: Popover and table behavior remains unchanged
- **WHEN** bill item, price, or discount editable-cell controls are used
- **THEN** only the affordance box surface changes and table layout, popover behavior, and selection/editing behavior remain unchanged
