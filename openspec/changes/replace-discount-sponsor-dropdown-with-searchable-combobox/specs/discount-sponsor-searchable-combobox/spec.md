## ADDED Requirements

### Requirement: Discount sponsor uses searchable ComboBox
The discount editor popover SHALL render the sponsor selector as a searchable Carbon `ComboBox`.

#### Scenario: Sponsor selector is searchable
- **WHEN** the discount editor popover is open
- **THEN** the sponsor selector accepts text input for filtering sponsor options

### Requirement: Sponsor options remain fixed
The sponsor ComboBox SHALL offer only the existing sponsor options: `Practice and doctor`, `Practice`, and `Doctor`.

#### Scenario: Sponsor option list is unchanged
- **WHEN** the sponsor ComboBox options are shown
- **THEN** the options are `Practice and doctor`, `Practice`, and `Doctor`

### Requirement: Sponsor selection updates existing discount state
Selecting a sponsor option from the ComboBox SHALL update the discount sponsor using the existing discount editor update path.

#### Scenario: Sponsor option is selected
- **WHEN** the user selects a sponsor option from the ComboBox
- **THEN** the discount sponsor value updates to that selected option

### Requirement: Sponsor menu does not push form fields
Opening the sponsor ComboBox menu MUST NOT push the comment field or other discount popover fields downward.

#### Scenario: Sponsor menu opens over form content
- **WHEN** the user opens the sponsor ComboBox menu
- **THEN** the options menu overlays within the discount popover and the comment field keeps its position

### Requirement: Invalid typed sponsor text is not committed
The sponsor ComboBox MUST NOT create or commit sponsor values outside the fixed sponsor option list.

#### Scenario: User types non-matching sponsor text
- **WHEN** the user types text that does not match a sponsor option and closes the ComboBox without selecting a valid option
- **THEN** the previously selected sponsor remains unchanged

### Requirement: Discount editor behavior remains unchanged
Replacing the sponsor selector MUST NOT change discount percent or amount editing, comment editing, auto-commit behavior, discount calculations, payment totals, popover anchoring, bill-item selectors, or price selectors.

#### Scenario: Discount values are edited after sponsor change
- **WHEN** the user edits discount values after changing or opening the sponsor selector
- **THEN** discount calculations and payment totals follow the existing behavior

#### Scenario: Other selectors are unaffected
- **WHEN** bill-item or price selectors are used
- **THEN** their behavior and layout remain unchanged
