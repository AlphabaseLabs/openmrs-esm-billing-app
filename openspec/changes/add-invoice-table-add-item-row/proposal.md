## Why

Cashier users can add bill items from the invoice line-items toolbar, but the mockup and desired workflow place the add affordance directly after the existing bill item rows. Adding a final in-table row makes the continuation point obvious without changing how new bill items are created.

## What Changes

- Add a final non-data row at the bottom of the invoice line-items table for open bills.
- Render a single `+ Add item` button-like affordance inside that row.
- Reuse the existing `Add bill item` workspace launch behavior so the row opens the same `billing-form` workspace with the same patient and post-save navigation props.
- Keep the existing toolbar `Add bill item` action unchanged.
- Hide the in-table add row for closed bills.
- Keep additional discount behavior out of scope.

## Capabilities

### New Capabilities

- `invoice-table-add-item-row`: Invoice line-items table exposes an in-table final add row that launches the existing add bill item workspace.

### Modified Capabilities

- None.

## Impact

- Affected frontend area: `src/invoice/invoice-table.component.tsx` and its styles/tests.
- Affected UI behavior: open invoice line-items tables gain a final add row after rendered bill item rows.
- Reuses existing workspace integration: `launchBillingWorkspace('billing-form', { patientUuid, workspaceTitle, navigateToBillAfterSave: true })`.
- No backend API changes, calculation changes, billing payload changes, payment changes, or additional-discount changes.
