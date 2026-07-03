## ADDED Requirements

### Requirement: Production InvoiceTable story renders the real component
Storybook SHALL include a focused invoice table story that imports and renders the production `InvoiceTable` component instead of recreating the table markup in the story file.

#### Scenario: Story uses production InvoiceTable
- **WHEN** the default invoice table story is opened
- **THEN** Storybook renders `InvoiceTable` from `src/invoice/invoice-table.component.tsx` with fixture props

#### Scenario: Story does not use screenshot-only table markup
- **WHEN** the story source is inspected
- **THEN** the invoice table rows, headers, toolbar, and action cells are produced by the production component rather than local story-only JSX

### Requirement: Stories cover production table states
Storybook SHALL provide focused stories for the production `InvoiceTable` states needed before inline-edit design begins.

#### Scenario: Pending bill story
- **WHEN** the pending bill story is opened
- **THEN** the table shows line items with selectable pending rows, enabled edit/cancel actions for pending rows, a search toolbar, and an add bill item action when the bill is open

#### Scenario: Mixed status story
- **WHEN** the mixed status story is opened
- **THEN** paid or exempted line items appear selected or disabled according to production selection rules while pending line items remain selectable

#### Scenario: Closed bill story
- **WHEN** the closed bill story is opened
- **THEN** the table hides the add bill item action while preserving the production table layout and row display

#### Scenario: Loading story
- **WHEN** the loading story is opened
- **THEN** Storybook renders the production `DataTableSkeleton` state from `InvoiceTable`

#### Scenario: Selected rows story
- **WHEN** the selected rows story is opened
- **THEN** Storybook passes selected line items through `selectedLineItems` and displays the corresponding production selection state

### Requirement: Stories use realistic billing fixtures
Storybook SHALL use realistic bill and line item fixtures that exercise production display and calculation behavior.

#### Scenario: Amount columns reflect production calculations
- **WHEN** a fixture line item has price, quantity, discounts, and taxes
- **THEN** the Price, Discount, Tax, and Total columns display values calculated and formatted by the production component

#### Scenario: Searchable content is present
- **WHEN** billable service fixture data is available
- **THEN** the table can search line items using production search inputs and billable service references

### Requirement: Runtime dependencies are mocked at boundaries
Storybook SHALL mock only external runtime dependencies needed to render `InvoiceTable` outside the OpenMRS application shell.

#### Scenario: OpenMRS runtime dependency is absent
- **WHEN** the story renders in Storybook
- **THEN** OpenMRS framework, translation, billable service data, and workspace launch boundaries are mocked sufficiently for the real component to render

#### Scenario: Workspace actions remain inert
- **WHEN** an action button is clicked in Storybook
- **THEN** the story records or no-ops the workspace launch instead of requiring a live OpenMRS workspace

### Requirement: Inline edit behavior is deferred
Storybook SHALL NOT introduce inline edit UI, rich popup UI, mutation behavior, or new invoice table production behavior as part of this change.

#### Scenario: Inline edit design is not included
- **WHEN** the invoice table stories are reviewed
- **THEN** they document the current production table baseline only and do not add inline-edit cells or popup controls
