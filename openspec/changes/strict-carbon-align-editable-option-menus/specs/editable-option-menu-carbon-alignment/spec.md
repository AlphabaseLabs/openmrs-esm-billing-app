## ADDED Requirements

### Requirement: Editable option menus use Carbon option states
The system SHALL style editable bill-item, price, and discount sponsor option rows using Carbon dropdown/combo box option state semantics.

#### Scenario: Selected option uses Carbon selected state
- **WHEN** an editable option menu is open and an option is selected
- **THEN** the selected option uses Carbon selected-layer styling and a primary-icon checkmark without a custom teal fill, teal left bar, or accent-colored checkmark

#### Scenario: Highlighted option is distinct from selected option
- **WHEN** an editable option is hovered or keyboard-highlighted
- **THEN** the highlighted option uses Carbon hover-layer styling and primary text without applying selected styling unless it is also selected

#### Scenario: Active option uses Carbon active state
- **WHEN** an editable option is actively pressed
- **THEN** the option uses Carbon active-layer styling without introducing custom accent colors

### Requirement: Editable option menus use Carbon row geometry
The system SHALL align editable option menu row typography, height, and spacing with Carbon dropdown/combo box sizing.

#### Scenario: Option rows match the field size
- **WHEN** an editable option menu is open
- **THEN** each option row height matches the associated editable field size, using Carbon small or medium sizing consistently within that menu

#### Scenario: Option text uses Carbon compact body type
- **WHEN** an editable option label is rendered
- **THEN** the label uses Carbon body-compact-01 typography with regular weight

#### Scenario: Option content uses Carbon horizontal spacing
- **WHEN** an editable option row is rendered
- **THEN** its text and selected checkmark use Carbon dropdown spacing rather than custom compressed padding

### Requirement: Editable option menu surfaces follow Carbon dropdown structure
The system SHALL render editable option menus with Carbon dropdown/combo box surface structure.

#### Scenario: Open menu width aligns with field width
- **WHEN** an editable dropdown or combobox menu opens
- **THEN** the menu width aligns to the corresponding editable field width according to Carbon dropdown structure

#### Scenario: Menu surface uses Carbon border and elevation
- **WHEN** an editable option menu is open
- **THEN** the menu uses a Carbon subtle border edge and Carbon dropdown shadow without custom card styling

#### Scenario: Option labels do not wrap or clip
- **WHEN** an editable option label is longer than the available option row width
- **THEN** the label remains on one line and truncates with ellipsis without vertical clipping

### Requirement: Strict Carbon alignment preserves editor behavior
The system SHALL keep existing editable-cell behavior unchanged while applying strict Carbon visual alignment.

#### Scenario: Bill-item selection behavior remains unchanged
- **WHEN** the bill-item searchable select is used
- **THEN** filtering, keyboard navigation, selection, blur handling, and commit behavior remain unchanged

#### Scenario: Price selection behavior remains unchanged
- **WHEN** the price option menu is used
- **THEN** option selection and price commit behavior remain unchanged

#### Scenario: Discount sponsor selection behavior remains unchanged
- **WHEN** the discount sponsor combobox is used
- **THEN** sponsor search, selection, and discount auto-commit behavior remain unchanged

#### Scenario: Non-option editor surfaces are untouched
- **WHEN** this change is implemented
- **THEN** discount amount input, discount percent input, discount comment input, table column layout, and payment method dropdown behavior are not redesigned
