## Why

Editable line-item option menus currently use custom selected colors, spacing, and row geometry that drift from Carbon dropdown and combo box standards. This makes the bill-item, price, and discount sponsor option surfaces feel inconsistent with the design system and with each other.

## What Changes

- Align editable option menus to strict Carbon dropdown/combo box visual behavior.
- Use Carbon option states for default, hover/highlight, active, and selected rows.
- Remove custom teal selected fills, teal left bars, and custom accent checkmarks from editable option menus.
- Normalize option typography, row height, padding, menu shadow, and overflow behavior to Carbon specs.
- Keep existing editor behavior and data flow unchanged.
- Do not redesign the discount amount/percent fields, comment field, table layout, or payment method dropdown.

## Capabilities

### New Capabilities
- `editable-option-menu-carbon-alignment`: Defines strict Carbon visual requirements for editable bill-item, price, and discount sponsor option menus.

### Modified Capabilities
- None.

## Impact

- Affects editable line-item cell menu styling and any minimal markup/classes required to support Carbon-aligned states.
- Applies to bill-item searchable select options, price option menu rows, and discount sponsor combobox options.
- Does not require API changes, dependency changes, data model changes, or behavior changes to commit/revert logic.
