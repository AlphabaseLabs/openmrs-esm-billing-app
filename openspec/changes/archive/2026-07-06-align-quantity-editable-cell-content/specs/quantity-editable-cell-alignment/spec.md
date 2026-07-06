## ADDED Requirements

### Requirement: Quantity uses shared editable numeric alignment
The Quantity editable cell MUST use the same horizontal content alignment as the existing Price and Discount editable numeric cells. Quantity MUST NOT introduce a dedicated centered layout for its display value, hover affordance, or inline input.

#### Scenario: Quantity display aligns with editable numeric cells
- **WHEN** a line item row is rendered with editable Quantity, Price, and Discount cells
- **THEN** the Quantity display value MUST align to the same left content edge used by the Price and Discount editable numeric cell content

#### Scenario: Quantity hover affordance aligns with editable numeric cells
- **WHEN** the user hovers or focuses the editable Quantity cell
- **THEN** the Quantity hover affordance MUST follow the same horizontal geometry as the Price and Discount editable numeric affordance

#### Scenario: Quantity inline editor aligns with display content
- **WHEN** the user opens the Quantity inline editor
- **THEN** the Quantity input text MUST align to the same left content edge as the Quantity display value
- **AND** the Quantity cell MUST remain inline-only with no popover

### Requirement: Quantity alignment preserves table layout
The Quantity editable cell MUST preserve table column widths before, during, and after inline edit mode.

#### Scenario: Quantity edit does not change column widths
- **WHEN** the user opens the Quantity inline editor
- **THEN** the invoice line items table column widths MUST remain stable
- **AND** no Quantity-specific centered layout MUST be used to influence intrinsic column sizing
