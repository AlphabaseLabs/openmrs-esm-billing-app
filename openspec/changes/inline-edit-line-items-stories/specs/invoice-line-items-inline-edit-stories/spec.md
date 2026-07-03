## ADDED Requirements

### Requirement: Minimal Storybook host for focused billing stories
The billing app SHALL provide the minimum Storybook setup needed to render focused React stories in the Alphabase billing repo.

#### Scenario: Storybook can discover billing stories
- **WHEN** a developer runs the Storybook script
- **THEN** Storybook discovers stories from `src/**/*.stories.tsx`

#### Scenario: Storybook uses the repo build stack
- **WHEN** Storybook builds the billing stories
- **THEN** it uses a Webpack-based Storybook configuration compatible with the repo's existing Webpack app setup

### Requirement: Focused line-items inline edit stories
The billing app Storybook SHALL include focused stories only for the bill line-items table area needed to design inline editing for price, discount, tax, and total cells.

#### Scenario: Stories target the inline edit table surface
- **WHEN** a developer opens Storybook for this change
- **THEN** they see stories centered on the bill line-items table and its inline edit cell controls

#### Scenario: Unrelated component stories are not required
- **WHEN** the inline edit story work is implemented
- **THEN** the implementation MUST NOT require creating stories for every component in the billing app

### Requirement: Rich popup edit states are represented
The Storybook stories SHALL represent the rich popup editing states needed for the price, discount, tax, and total cells.

#### Scenario: Price popup story is available
- **WHEN** a developer opens the price edit story
- **THEN** the table shows a price cell with its inline edit affordance and rich popup state visible

#### Scenario: Discount popup story is available
- **WHEN** a developer opens the discount edit story
- **THEN** the table shows a discount cell with amount, percent, sponsor, and comment editing affordances represented

#### Scenario: Tax popup story is available
- **WHEN** a developer opens the tax edit story
- **THEN** the table shows a tax cell with its inline edit affordance and rich popup state visible

#### Scenario: Total behavior story is available
- **WHEN** a developer opens the total calculation story
- **THEN** the table shows how totals respond to line item price, discount, and tax values using deterministic mock data

### Requirement: Story fixtures model required billing states
The Storybook stories SHALL use local mock fixtures that model the billing states needed for inline-edit design review.

#### Scenario: Editable pending bill fixture
- **WHEN** the editable story renders
- **THEN** it displays pending line items where price, discount, tax, and total editing controls are enabled

#### Scenario: Read-only paid bill fixture
- **WHEN** the read-only story renders
- **THEN** it displays non-editable line items where inline edit controls are disabled or hidden according to bill status

#### Scenario: Validation error fixture
- **WHEN** the validation error story renders
- **THEN** it displays an invalid edit state with visible feedback in the popup

### Requirement: Stories stay isolated from runtime services
The inline edit stories SHALL render with local data and mocks instead of requiring live OpenMRS runtime services.

#### Scenario: Stories use isolated local data
- **WHEN** the inline edit stories render
- **THEN** they do not require a live backend, OpenMRS session, or real invoice API response
