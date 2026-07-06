## ADDED Requirements

### Requirement: Editable numeric values align left

Editable price and discount cells SHALL present their display value and active inline editor at the inline start of the cell.

#### Scenario: Editable price display

- **WHEN** an editable price cell is rendered in display mode
- **THEN** the displayed price value SHALL align to the inline start of the cell

#### Scenario: Editable discount display

- **WHEN** an editable discount cell is rendered in display mode
- **THEN** the displayed discount value SHALL align to the inline start of the cell

#### Scenario: Active numeric editor

- **WHEN** an editable price or discount cell enters inline edit mode
- **THEN** the active numeric editor SHALL appear from the inline start of the cell without shifting the table column width

### Requirement: Editable numeric affordances align right

Editable price and discount cells SHALL position their floating chevron/control affordance at the inline end of the cell.

#### Scenario: Price affordance placement

- **WHEN** an editable price cell is rendered with a price-option affordance
- **THEN** the affordance SHALL appear at the inline end of the cell

#### Scenario: Discount affordance placement

- **WHEN** an editable discount cell is rendered with its editor affordance
- **THEN** the affordance SHALL appear at the inline end of the cell

### Requirement: Editable numeric affordances remain layout-neutral

Editable numeric affordances MUST NOT reserve table layout space or change table column widths.

#### Scenario: Table column stability

- **WHEN** editable price and discount cells render their right-side affordances
- **THEN** the table SHALL retain its existing column widths and row layout

#### Scenario: Popover anchoring remains stable

- **WHEN** the user opens a price or discount editor popover from the right-side affordance
- **THEN** the popover SHALL use the existing overlay anchoring behavior without introducing table overflow clipping
