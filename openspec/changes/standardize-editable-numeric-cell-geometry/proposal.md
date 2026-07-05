## Why

Editable line-item cells currently mix display text, active editors, and edit affordances in uncontrolled inline layouts. This causes numeric text misalignment, table column reflow, and inconsistent edit-icon placement across read-only, inactive editable, and active editing states.

This needs a reusable geometry standard before adding more editable billing fields, so every editable cell has predictable alignment, sizing, and table impact.

## What Changes

- Define a reusable editable-cell geometry with stable internal lanes for content and edit affordance.
- Standardize numeric editable cells so the icon lane is on the left and the value/editor lane is on the right.
- Ensure visible values, active editors, and edit icons occupy predictable lanes without changing the column alignment axis.
- Ensure edit icon visibility changes do not change layout width.
- Ensure active editors replace only the content/editor lane and do not cause unexpected table reflow.
- Do not change line-item update APIs, validation rules, or Storybook story composition.
- Do not introduce a Storybook-only editable-cell implementation.

## Capabilities

### New Capabilities

- `editable-numeric-cell-geometry`: Defines the reusable lane-based geometry, alignment, sizing, and table-width behavior for editable numeric invoice table cells.

### Modified Capabilities

- None.

## Impact

- Affected production code:
  - `src/invoice/editable-line-item-cells/*`
  - `src/invoice/invoice-table.component.tsx`
  - `src/invoice/invoice-table.scss`
- Affected tests/stories:
  - Editable-cell tests should assert lane order and stable layout behavior where practical.
  - Production Storybook stories should continue to use real `BillDetails`, `InvoiceTable`, and editable-cell components.
- No backend API changes are expected.
- No package dependency changes are expected.
