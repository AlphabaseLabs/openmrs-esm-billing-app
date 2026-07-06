## ADDED Requirements

### Requirement: Price popover uses bill-item option selected-state colors
The price picker popover SHALL use the same selected-state color model as the bill-item option menu. A selected price option MUST render with a light teal fill, a 2px teal left bar, and a teal check mark. It MUST NOT use blue or lavender for selected state.

#### Scenario: Selected price option uses teal state
- **WHEN** the price picker popover is open and a price option is selected
- **THEN** the selected price option displays a light teal fill
- **AND** the selected price option displays a 2px teal left bar
- **AND** the selected price option displays a teal check mark

#### Scenario: Blue selected price state is removed
- **WHEN** the price picker popover is open
- **THEN** no selected price option uses a blue or lavender selected background

### Requirement: Price popover highlight state is neutral
The price picker popover SHALL render hover and keyboard-highlighted price options with neutral grey styling. Highlighted state MUST remain visually distinct from selected state unless the highlighted option is also selected.

#### Scenario: Hovered price option uses neutral styling
- **WHEN** a user hovers a non-selected price option
- **THEN** the option uses a neutral grey highlight
- **AND** the option does not use teal, blue, or lavender selected styling

#### Scenario: Keyboard-highlighted price option uses neutral styling
- **WHEN** keyboard navigation highlights a non-selected price option
- **THEN** the option uses a neutral grey highlight
- **AND** the option does not use teal, blue, or lavender selected styling

### Requirement: Price option menu width aligns to the active price cell surface
The price picker popover SHALL size from the active price cell overlay surface rather than the old detached generic popover width. Price option rows MUST fill the menu width, and the menu MUST avoid excess empty panel width when the available price options are compact.

#### Scenario: Price menu opens as a cell extension
- **WHEN** a user opens the price picker
- **THEN** the menu reads as an extension of the active price cell
- **AND** the menu does not use the older detached wide generic popover sizing

#### Scenario: Price options fill the menu width
- **WHEN** the price picker popover is open
- **THEN** each price option row fills the full width of the price menu

### Requirement: Price option row rhythm matches bill-item options
The price picker popover SHALL use the same readable option-row rhythm as the bill-item option menu. Row height and padding MUST avoid the compressed generic option appearance while preserving a compact table editor feel.

#### Scenario: Price option rows are readable
- **WHEN** the price picker popover is open
- **THEN** each price option row has readable vertical rhythm matching the bill-item option surface

### Requirement: Price option content structure is preserved
The price picker popover SHALL preserve price option content meaning. Price option labels and amounts MUST remain readable, and amounts SHOULD remain aligned in a stable amount lane when present.

#### Scenario: Price label and amount remain readable
- **WHEN** a price option includes a label and amount
- **THEN** the label remains readable
- **AND** the amount remains readable and consistently aligned

### Requirement: Visual alignment scope excludes behavior and other editors
This change SHALL NOT alter price option selection semantics, line-item recalculation, bill-item search behavior, discount editor behavior, or payment behavior.

#### Scenario: Price selection behavior is unchanged
- **WHEN** a user selects a price option after this visual change
- **THEN** the selected price behavior and line-item recalculation remain unchanged

#### Scenario: Other editors are unaffected
- **WHEN** a user opens the bill-item selector or discount editor
- **THEN** those editors retain their existing behavior and visual contracts
