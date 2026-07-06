## Why

The bill-item editor currently uses a custom static option list, which works for a small set of services but does not scale when clinics have many billable services. Replacing the option list with a searchable Carbon ComboBox inside the existing overlay improves service discovery while preserving the table-cell geometry and auto-commit behavior already established for line-item editing.

## What Changes

- Replace the bill-item popover's custom option-button list with a searchable Carbon ComboBox.
- Keep the current editable cell surface, chevron affordance, active-cell styling, and `EditableCellOverlay` portal behavior.
- Search/select only from the provided billable services; do not allow committing arbitrary free-text values.
- Preserve auto-commit on billable service selection.
- Preserve current bill-item recalculation semantics, including price update behavior when the edited line item already has a selected service price.
- Preserve table column sizing, overlay overflow behavior, price picker behavior, discount picker behavior, and invoice summary layout.

## Capabilities

### New Capabilities
- `searchable-bill-item-selector`: Defines searchable billable service selection behavior for editable invoice line-item bill-item cells.

### Modified Capabilities

## Impact

- Affected UI: editable invoice line-item bill-item cell popover.
- Affected code likely includes `EditableBillItemCell`, shared editable-cell styles, focused bill-item cell tests, and invoice table stories that open the bill-item selector.
- No API changes.
- No dependency changes expected because Carbon components are already used in the app.
- No change to price editing, discount editing, payment behavior, totals calculation rules, table column layout, or invoice summary layout.
