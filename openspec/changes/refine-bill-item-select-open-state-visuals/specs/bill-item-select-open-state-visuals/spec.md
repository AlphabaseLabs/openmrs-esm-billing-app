## ADDED Requirements

### Requirement: Bill-item active field uses the table cell as its visible surface
The bill-item searchable single-select SHALL render its active in-cell input as transparent and borderless while open. The input MUST inherit the table cell's typography and color, and it MUST NOT add its own colored field fill, visible border, or boxed focus ring.

#### Scenario: Opening bill-item edit mode does not show a colored field block
- **WHEN** a user opens the bill-item searchable select for a line item
- **THEN** the visible field remains transparent and visually integrated with the table row
- **AND** no blue, lavender, or other colored input rectangle appears around the bill-item text

#### Scenario: Active input styling remains scoped to bill item
- **WHEN** the bill-item searchable select is open
- **THEN** price picker and discount editor field surfaces remain unchanged

### Requirement: Bill-item chevron uses the elevated editable-cell affordance
The bill-item searchable single-select SHALL render the dropdown chevron using the elevated white editable-cell affordance. The chevron control MUST be hidden while the select is closed and idle, MUST become visible on hover, focus, and open states, and MUST point down when closed and rotate up when open.

#### Scenario: Closed idle bill-item cell hides the chevron affordance
- **WHEN** the bill-item editable cell is closed and neither hovered nor focused
- **THEN** the chevron affordance is not visible

#### Scenario: Interactive bill-item cell shows the elevated chevron affordance
- **WHEN** the bill-item editable cell is hovered, focused, or opened
- **THEN** the chevron appears in the elevated white affordance box aligned to the cell's right inset

#### Scenario: Open bill-item cell flips the chevron inside the elevated affordance
- **WHEN** the bill-item searchable select opens
- **THEN** the chevron rotates to the open direction
- **AND** the elevated affordance remains visible

### Requirement: Bill-item option states use teal for selected and neutral grey for highlighted
The bill-item options menu SHALL use one accent hue for selected state. The selected option MUST render with a light teal fill, a 2px teal left bar, and a teal check mark. Hover and keyboard-highlighted options MUST use neutral grey and MUST NOT use blue or lavender.

#### Scenario: Selected option uses teal only
- **WHEN** the bill-item menu is open and an option is selected
- **THEN** the selected option displays a teal left bar, teal check mark, and light teal fill
- **AND** the selected option does not use blue or lavender styling

#### Scenario: Highlighted option is visually distinct from selected option
- **WHEN** a user hovers an option or moves keyboard focus through the bill-item menu
- **THEN** the highlighted option uses neutral grey styling
- **AND** the highlighted option does not inherit the selected teal treatment unless it is also the selected option

### Requirement: Bill-item display, input, and option text share one x-position
The bill-item cell SHALL keep the first glyph of the item name at the same horizontal x-position in display state, active input state, and each option row. Opening or closing edit mode MUST NOT shift the bill-item label horizontally.

#### Scenario: Opening edit mode does not move the bill-item label
- **WHEN** a user opens the bill-item searchable select
- **THEN** the current item text remains aligned to the same x-position it used in display state

#### Scenario: Option text aligns with active field text
- **WHEN** the bill-item menu is open
- **THEN** each option label starts at the same x-position as the active field text

### Requirement: Bill-item field and menu read as one welded surface
The bill-item active field and options menu SHALL meet with a single visible seam. The open state MUST NOT show a doubled border where the active field and menu touch. The menu SHALL have a subtle menu-only shadow sufficient to lift it over underlying content while preserving the cell-extension appearance.

#### Scenario: Field and menu join with one seam
- **WHEN** the bill-item menu opens below the active cell
- **THEN** the field/menu join shows a single 1px edge
- **AND** no doubled horizontal line appears at the join

#### Scenario: Menu remains readable over underlying cards
- **WHEN** the bill-item menu overlaps content such as the Payments card
- **THEN** the menu has subtle lift from a low-opacity shadow
- **AND** the active field itself remains flat and integrated with the table row

### Requirement: Visual refinement scope is limited to bill-item searchable select
This visual refinement SHALL apply only to the bill-item cell searchable single-select open/edit state. The price picker and discount editor MUST remain visually and behaviorally unchanged.

#### Scenario: Price picker is unaffected
- **WHEN** a user opens the price picker
- **THEN** the price picker uses its existing visual pattern and behavior

#### Scenario: Discount editor is unaffected
- **WHEN** a user opens the discount editor
- **THEN** the discount editor uses its existing visual pattern and behavior
