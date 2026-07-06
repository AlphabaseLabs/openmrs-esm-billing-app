## ADDED Requirements

### Requirement: Bill details summary uses stable stat lanes
The bill details page SHALL render invoice summary stats in stable horizontal lanes so changing one stat value length does not reposition the later stat labels, values, or action controls at the same viewport width.

#### Scenario: Total amount length changes
- **WHEN** the total amount changes from a short amount such as `PKR 1,766.00` to a longer amount such as `PKR 249,765.00`
- **THEN** the Amount tendered, Invoice #, Date and time, Invoice status, and invoice action controls SHALL remain in their same horizontal lanes for the current viewport width

#### Scenario: Responsive summary layout
- **WHEN** the viewport is below the desktop breakpoint where the summary stacks
- **THEN** the summary stats and actions SHALL keep the existing stacked responsive behavior without horizontal overlap

### Requirement: Invoice line item table uses stable column lanes
The invoice line item table SHALL use stable column geometry so changing line item text or numeric values does not reallocate table column widths at the same viewport width.

#### Scenario: Bill item changes to longer service name
- **WHEN** a pending line item changes from `Consultation` to `Clear Aligner`
- **THEN** the Status, Quantity, Price, Discount, Tax, Total, and Action columns SHALL remain in their same horizontal lanes

#### Scenario: Numeric values change digit length
- **WHEN** price, discount, tax, or total values change between short and long formatted numbers
- **THEN** the affected numeric value SHALL remain right-aligned within its column and SHALL NOT push adjacent columns horizontally

#### Scenario: Paid and pending rows coexist
- **WHEN** the table contains both paid and pending rows with different editable states
- **THEN** the column lanes SHALL remain identical across all rows

### Requirement: Editable cell affordances are layout-neutral
Editable cell affordances, inline editors, and popovers SHALL NOT contribute additional intrinsic width to invoice table columns.

#### Scenario: Editable cell chevron appears
- **WHEN** an editable bill item, price, or discount cell shows its chevron affordance on hover or focus
- **THEN** the table column widths SHALL remain unchanged

#### Scenario: Editor popover opens
- **WHEN** an editable cell opens its editor popover
- **THEN** the table column widths SHALL remain unchanged and the popover SHALL render without forcing the table or page summary to shift horizontally
