## Why

The Alphabase billing app needs a focused Storybook surface for designing inline edits in the bill line-items table. The desired UI work targets the table area with `Price`, `Discount`, `Tax`, and `Total` columns rather than the whole billing app.

## What Changes

- Add the minimal Webpack-based Storybook setup required for this repo.
- Add focused stories only for the bill line-items inline edit area shown in the invoice table.
- Add local fixtures for pending/editable, paid/read-only, discounted, taxed, total-calculation, and validation-error states.
- Represent rich popup edit states for price, discount, tax, and total review without requiring a live backend.
- Keep this change limited to Storybook setup, focused stories, and supporting story fixtures for this UI work.

## Capabilities

### New Capabilities

- `invoice-line-items-inline-edit-stories`: The bill line-items table has focused Storybook coverage for inline edit interactions around price, discount, tax, and total cells using rich popup states.

### Modified Capabilities

- *(none)*

## Impact

- Affected module: `repos/alphabase/openmrs-esm-billing-app`.
- Affected areas: `package.json`, Storybook config, local Storybook mocks/decorators, and line-items story files/fixtures.
- No backend, API, or production billing workflow changes are intended in this change.
