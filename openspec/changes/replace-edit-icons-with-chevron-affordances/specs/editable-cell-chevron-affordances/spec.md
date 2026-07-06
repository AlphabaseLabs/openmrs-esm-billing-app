## ADDED Requirements

### Requirement: Editable cells use chevron affordances
The system SHALL use a chevron-style affordance, not a pencil edit affordance, for editable invoice line-item cells that open anchored editors.

#### Scenario: Bill item cell displays chevron affordance
- **WHEN** the bill item cell exposes its cell-level editor affordance
- **THEN** the affordance is displayed as a chevron control

#### Scenario: Price cell displays chevron affordance
- **WHEN** the price cell exposes its cell-level editor affordance
- **THEN** the affordance is displayed as a chevron control

#### Scenario: Discount cell displays chevron affordance
- **WHEN** the discount cell exposes its cell-level editor affordance
- **THEN** the affordance is displayed as a chevron control

### Requirement: Chevron affordances use elevated borderless styling
The system SHALL render editable-cell chevron affordances as borderless elevated controls with a subtle radius and shadow-defined edge.

#### Scenario: Chevron affordance has no hard border
- **WHEN** an editable-cell chevron affordance is visible
- **THEN** it does not render a hard outline border

#### Scenario: Chevron affordance uses shadow elevation
- **WHEN** an editable-cell chevron affordance is visible
- **THEN** it uses a soft shadow to distinguish the white chip from the table surface

### Requirement: Chevron replacement preserves existing editable-cell behavior
The system SHALL preserve existing editable-cell trigger behavior while replacing the icon glyph.

#### Scenario: Hover and focus behavior remains unchanged
- **WHEN** a user hovers or focuses an editable cell
- **THEN** the chevron affordance follows the same visibility behavior previously used by the editable-cell icon

#### Scenario: Open editor behavior remains unchanged
- **WHEN** a user opens an editable-cell editor popover
- **THEN** the chevron affordance follows the same open-state visibility behavior previously used by the editable-cell icon

#### Scenario: Cell editor opens from chevron trigger
- **WHEN** a user activates the chevron affordance for an editable cell
- **THEN** the same editor popover opens as before

### Requirement: Non-cell action icons are unchanged
The system SHALL NOT replace row-level Action column icons as part of the editable-cell chevron affordance change.

#### Scenario: Action column icons remain unchanged
- **WHEN** the invoice line-item table renders row actions
- **THEN** those action icons retain their existing glyphs and behavior
