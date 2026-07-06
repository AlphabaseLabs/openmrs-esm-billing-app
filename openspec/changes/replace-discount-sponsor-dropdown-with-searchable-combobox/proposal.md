## Why

The discount sponsor selector inside the discount popover currently opens like an in-flow dropdown, pushing the comment field downward and making the popover feel unstable. It should behave like a standard searchable Carbon selection control while preserving the discount form's existing calculations and commit behavior.

## What Changes

- Replace the discount sponsor dropdown with a searchable Carbon `ComboBox`.
- Keep the sponsor option set unchanged: `Practice and doctor`, `Practice`, and `Doctor`.
- Ensure the ComboBox menu overlays within the discount popover instead of taking layout space and pushing the comment field down.
- Preserve the existing selected sponsor value and update behavior.
- Preserve discount percent/amount editing, comment editing, auto-commit behavior, calculations, payment totals, and popover anchoring.
- Do not change bill-item selectors, price selectors, table layout, or payment UI.

## Capabilities

### New Capabilities

- `discount-sponsor-searchable-combobox`: Defines the searchable sponsor selector inside the discount editor popover.

### Modified Capabilities

## Impact

- Affects only the discount editor popover sponsor selector implementation and scoped styling.
- No API, data model, discount calculation, payment, bill-item, price, or table layout changes.
