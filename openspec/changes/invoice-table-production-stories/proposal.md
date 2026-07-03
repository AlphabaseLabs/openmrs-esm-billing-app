## Why

The current Storybook work is misleading because it does not render the real production invoice line items table. Before designing inline edits, Storybook needs focused stories that exercise the actual `InvoiceTable` component and match production behavior closely enough to use as a reliable design surface.

## What Changes

- Add focused Storybook coverage for the production `InvoiceTable` component.
- Render the real `src/invoice/invoice-table.component.tsx` implementation with representative bill fixtures.
- Cover the production table states needed for future inline-edit design: pending editable bill, mixed paid/pending rows, closed bill, loading state, selected rows, and filtered/searchable rows.
- Mock only external runtime dependencies required to make the real component render outside the OpenMRS shell.
- Defer all inline-edit UI, rich popup UI, data mutation, and table behavior changes to a later change.
- Remove or replace any screenshot-derived story that recreates invoice table markup without using the production component.

## Capabilities

### New Capabilities

- `invoice-table-production-stories`: Storybook stories that render the production invoice line items table with realistic fixtures and runtime mocks.

### Modified Capabilities

- None.

## Impact

- Affected code: Storybook configuration/mocks and focused story files for `InvoiceTable`.
- Production runtime behavior: no intended changes.
- APIs: no intended changes.
- Dependencies: no new runtime dependencies expected beyond existing Storybook setup.
