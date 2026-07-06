## Why

The line items table now contains more editable and informational columns than every billing workflow needs at once. Users need a compact view that can hide optional columns such as Status, Tax, and line-level Discount without breaking table alignment, editable-cell behavior, totals, or bill persistence.

## What Changes

- Add a line items table column visibility control for optional columns.
- Drive table headers and row cells from one shared column registry so hidden columns cannot desynchronize header/body alignment.
- Allow optional columns such as Status, Tax, Discount, Quantity, and Number to be shown or hidden based on configured eligibility.
- Keep required columns always visible, including selection/control columns, Bill item, Price, Total, and Actions.
- Persist the user's visible-column preference locally for the billing app table view.
- Ensure hidden columns remain present in the underlying line item data and continue to participate in calculations, validation, commit payloads, and totals.
- Preserve existing editable-cell behavior for Price, Discount, Quantity, and Bill Item when their columns are visible.
- Do not introduce backend changes or change invoice calculation semantics.

## Capabilities

### New Capabilities
- `line-item-column-visibility`: Defines user-controlled visibility for optional invoice line item table columns while preserving layout, editing, calculations, and persistence behavior.

### Modified Capabilities

None.

## Impact

- Affects invoice line items table column definitions, header rendering, row cell rendering, and Storybook coverage.
- Affects client-side UI state/persistence for visible line item columns.
- No API, backend, dependency, billing calculation, or persistence payload changes.
