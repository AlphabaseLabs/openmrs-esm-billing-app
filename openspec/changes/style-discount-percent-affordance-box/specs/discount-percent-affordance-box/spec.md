## ADDED Requirements

### Requirement: Discount percent affordance uses a transparent bordered box
The discount editable-cell `%` affordance SHALL render as a fixed-size transparent box with a light grey border, matching the existing editable chevron affordance's size and border radius.

#### Scenario: Closed discount cell shows boxed percent affordance when visible
- **WHEN** the discount editable cell exposes its percent affordance in its normal visible states
- **THEN** the `%` glyph is displayed inside a transparent fixed-size box with a light grey border and matching chevron affordance radius

### Requirement: Discount percent glyph is centered in the affordance box
The discount editable-cell `%` glyph SHALL be visually centered inside the transparent affordance box.

#### Scenario: Percent glyph alignment
- **WHEN** the discount percent affordance is visible
- **THEN** the `%` glyph is centered horizontally and vertically within the affordance box

### Requirement: Discount percent affordance preserves existing editor behavior
The discount percent affordance styling MUST NOT change discount editor open behavior, hover behavior, focus behavior, auto-commit behavior, calculations, or payment totals.

#### Scenario: Opening the discount editor
- **WHEN** the user activates the discount percent affordance
- **THEN** the existing discount editor opens with unchanged behavior

#### Scenario: Discount behavior remains unchanged
- **WHEN** the user edits discount values through the existing discount editor
- **THEN** discount calculations and payment totals continue to follow the existing behavior

### Requirement: Discount percent affordance styling is scoped
The transparent bordered `%` box styling MUST apply only to the discount editable-cell percent affordance and MUST NOT alter bill-item, price, or action affordances.

#### Scenario: Other editable affordances are unaffected
- **WHEN** bill-item, price, or action affordances are rendered
- **THEN** they retain their existing visual treatment and are not changed to the discount percent affordance styling
