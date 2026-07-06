## Why

Price option rows currently split the option name and amount into separate layout lanes, creating a large visual gap inside the price popover. This makes short options such as `Cash` or `Card` read as disconnected from their amounts instead of as one option label.

## What Changes

- Render each price option as compact inline text in the form `Name - (Amount)`.
- Keep the selected check indicator as the only trailing aligned element in the row.
- Remove the large name-to-amount spacing caused by separate label and amount lanes.
- Preserve the existing popover behavior, selection behavior, auto-commit behavior, and price update calculations.
- Do not introduce a mock Storybook-only implementation or a redesigned component.

## Capabilities

### New Capabilities

- `compact-price-option-labels`: Price option popovers present each price option as a single compact label while preserving existing selection and commit behavior.

### Modified Capabilities

- None.

## Impact

- Affected code is limited to the production editable price cell and its focused styles/tests/stories.
- No API, dependency, or backend changes.
- No changes to bill item option rows, discount popovers, payment controls, or table column geometry.
