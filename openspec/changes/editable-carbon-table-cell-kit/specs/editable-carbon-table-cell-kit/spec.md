## ADDED Requirements

### Requirement: Reusable editable Carbon table cell package
The system SHALL provide a reusable editable Carbon table cell package that owns generic editable-cell mechanics and can be consumed by billing adapters and future OpenMRS frontend apps.

#### Scenario: Billing adapter consumes numeric cell primitive
- **WHEN** a billing Price, Discount, or future Quantity adapter renders a numeric editable table cell
- **THEN** it SHALL use the package-owned numeric editable-cell primitive for display, active state, editor geometry, and affordance behavior.

#### Scenario: Billing adapter consumes text cell primitive
- **WHEN** a billing Bill Item adapter renders a text or select editable table cell
- **THEN** it SHALL use the package-owned text editable-cell primitive for display, active state, popover anchoring, and affordance behavior.

### Requirement: Package excludes billing business logic
The package MUST NOT import or own billing-specific models, API calls, invoice recalculation, service price option mapping, discount sponsor rules, discount comments, or bill item search behavior.

#### Scenario: Package source is inspected
- **WHEN** the package source is reviewed
- **THEN** no package file SHALL import billing app modules, invoice models, billing resources, or billing API functions.

#### Scenario: Billing adapter commits a domain update
- **WHEN** a user commits a Price, Discount, or Bill Item edit
- **THEN** the billing adapter SHALL translate the package event into the billing-specific update payload.

### Requirement: Numeric editor preserves Carbon table geometry
Opening a numeric editable cell SHALL NOT change Carbon table column widths, column positions, or table scroll dimensions.

#### Scenario: Price editor opens
- **WHEN** the Price editor opens in a Carbon table row
- **THEN** all measured table columns SHALL keep the same horizontal position and width as before the editor opened.

#### Scenario: Discount editor opens
- **WHEN** the Discount editor opens in a Carbon table row
- **THEN** all measured table columns SHALL keep the same horizontal position and width as before the editor opened.

#### Scenario: Future Quantity editor opens
- **WHEN** a future Quantity editor opens in a Carbon table row
- **THEN** all measured table columns SHALL keep the same horizontal position and width as before the editor opened.

### Requirement: Inline numeric editor remains constrained to the active cell
The active inline numeric editor SHALL remain within the current cell bounds and SHALL NOT push sibling columns.

#### Scenario: Numeric editor contains a long value
- **WHEN** a numeric inline editor contains a long formatted value
- **THEN** the editor SHALL remain inside the active cell bounds and SHALL NOT increase table width.

#### Scenario: Numeric editor is active
- **WHEN** a numeric cell enters active inline edit mode
- **THEN** the visible editor SHALL be overlaid inside the cell while an in-flow sizing value preserves the inactive display width contribution.

### Requirement: Popovers escape table overflow without resizing the table
Editable-cell popovers SHALL render outside table layout flow while remaining anchored to the active cell.

#### Scenario: Price popover opens
- **WHEN** the Price options popover opens
- **THEN** the popover SHALL appear above table content, remain anchored to the active Price cell, and SHALL NOT make the table scroll because of popover dimensions.

#### Scenario: Discount popover opens
- **WHEN** the Discount editor popover opens
- **THEN** the popover SHALL appear above table content, remain anchored to the active Discount cell, and SHALL NOT make the table scroll because of popover dimensions.

#### Scenario: Bill Item popover opens
- **WHEN** the Bill Item search popover opens
- **THEN** the popover SHALL appear above table content, remain anchored to the active Bill Item cell, and SHALL NOT make the table scroll because of popover dimensions.

### Requirement: App supplies popover content
The package SHALL provide popover shell, anchoring, overflow escape, focus handling, and visual attachment behavior, while the consuming app SHALL provide editor-specific popover content.

#### Scenario: Discount editor renders
- **WHEN** the billing Discount adapter opens its editor
- **THEN** the package SHALL render the popover shell and the billing adapter SHALL render amount, percent, sponsor, comment, reset, and commit behavior.

#### Scenario: Bill Item search renders
- **WHEN** the billing Bill Item adapter opens its editor
- **THEN** the package SHALL render the popover shell and the billing adapter SHALL render search input, options, selection, and commit behavior.

### Requirement: Production Storybook stories remain adapter-based
Production billing Storybook stories SHALL render real billing adapters after the package extraction.

#### Scenario: BillDetails default pending bill story renders
- **WHEN** the BillDetails default pending bill story is opened
- **THEN** it SHALL render the production billing Price, Discount, and Bill Item adapters using the package primitives.

#### Scenario: Package primitive stories render
- **WHEN** package primitive stories are opened
- **THEN** they SHALL demonstrate reusable package behavior only and SHALL NOT replace production billing stories as the source of production visual validation.

### Requirement: Conformance tests protect reusable behavior
The package SHALL include reusable conformance tests or test helpers for editable Carbon table cell geometry, popover behavior, keyboard behavior, and adapter boundaries.

#### Scenario: Geometry conformance test runs
- **WHEN** the geometry conformance test opens an editable numeric cell
- **THEN** it SHALL assert that measured table column positions, column widths, and table scroll dimensions remain unchanged.

#### Scenario: Import boundary test runs
- **WHEN** the import boundary test inspects package source
- **THEN** it SHALL fail if package code imports billing app modules.

#### Scenario: Keyboard behavior test runs
- **WHEN** a user interacts with an editable cell using keyboard controls
- **THEN** focus, open, commit, cancel, and close behavior SHALL match the package interaction contract.

### Requirement: Quantity is deferred but supported by the package API
The package API SHALL be sufficient for a future Quantity adapter, but this change SHALL NOT make Quantity editable.

#### Scenario: Change is implemented
- **WHEN** this change is complete
- **THEN** Price, Discount, and Bill Item may use the package primitives, but Quantity SHALL remain unchanged.

#### Scenario: Future Quantity change is proposed
- **WHEN** a future Quantity editable-cell change is implemented
- **THEN** it SHALL use the package numeric primitive instead of copying Price or Discount editable-cell mechanics.
