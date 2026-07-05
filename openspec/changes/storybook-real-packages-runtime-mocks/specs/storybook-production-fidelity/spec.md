## ADDED Requirements

### Requirement: Storybook uses production component code
Storybook SHALL render focused stories using the repo's production React components rather than recreating production UI markup inside story files.

#### Scenario: Production component story renders
- **WHEN** a story is created for a target UI surface
- **THEN** the story SHALL render the production component exported by the repo source

#### Scenario: Storybook-only UI duplication is avoided
- **WHEN** production markup already exists in a component
- **THEN** the story SHALL provide props, fixtures, and decorators rather than duplicating that markup

### Requirement: Storybook compiles selected real OpenMRS visual packages
Storybook SHALL compile explicitly allowlisted OpenMRS visual packages required for production UI fidelity.

#### Scenario: Patient common visual components compile
- **WHEN** a story imports billing code that depends on `@openmrs/esm-patient-common-lib`
- **THEN** Storybook SHALL transpile that package's TypeScript/TSX source and load its styles

#### Scenario: Shared visual components are real
- **WHEN** billing components render shared visual primitives such as `CardHeader`
- **THEN** Storybook SHALL use the real visual component from the allowlisted OpenMRS package instead of a local visual mock

#### Scenario: Package transpilation remains scoped
- **WHEN** Storybook compiles OpenMRS package source
- **THEN** it SHALL compile only explicitly allowlisted packages rather than all `node_modules`

### Requirement: Storybook mocks runtime side effects only
Storybook SHALL mock OpenMRS shell/runtime services that cannot run deterministically in component stories.

#### Scenario: Framework shell APIs are mocked
- **WHEN** production components call OpenMRS framework APIs for fetch, navigation, sessions, config, visits, feature flags, modals, snackbars, access checks, extensions, or workspace launchers
- **THEN** Storybook SHALL provide deterministic runtime mocks for those APIs

#### Scenario: Non-visual patient common runtime APIs are mocked
- **WHEN** production components call patient-common runtime APIs such as visit prompts or system visit settings
- **THEN** Storybook SHALL provide deterministic mocks for those APIs

#### Scenario: Runtime mocks do not replace visual primitives
- **WHEN** an export controls production visual structure or styling and belongs to an allowlisted visual package
- **THEN** Storybook SHALL use the real export rather than a local visual mock

### Requirement: Storybook TypeScript loader includes Storybook source
Storybook SHALL transpile its own TypeScript configuration and preview files.

#### Scenario: Preview file uses TypeScript syntax
- **WHEN** `.storybook/preview.tsx` imports TypeScript-only syntax such as `import type`
- **THEN** Storybook SHALL process the file through the configured TypeScript/TSX loader

### Requirement: Stories are deterministic and focused
Storybook stories SHALL use fixture-backed data and SHALL be limited to components relevant to the upcoming work.

#### Scenario: Fixture-backed billing state
- **WHEN** stories render bills, line items, payments, payment methods, statuses, totals, selected rows, or patient data
- **THEN** those values SHALL come from deterministic fixtures or fixture-backed runtime mocks

#### Scenario: Focused story set
- **WHEN** setting up Storybook for a repo
- **THEN** stories SHALL be created for the production surfaces needed by the current change rather than for every component in the repo

### Requirement: Setup remains separate from feature implementation
Storybook setup SHALL NOT implement new product behavior unless explicitly requested as a separate change.

#### Scenario: Feature work is deferred
- **WHEN** Storybook is being prepared for upcoming UI work
- **THEN** the setup SHALL avoid implementing the upcoming feature's business logic or backend behavior
