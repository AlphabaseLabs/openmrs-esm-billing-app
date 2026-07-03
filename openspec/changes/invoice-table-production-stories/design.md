## Context

The billing app already has a production invoice line items table implemented in `src/invoice/invoice-table.component.tsx`. That component owns the behavior that matters for the next inline-edit phase: row selection, search, loading state, status-based action availability, add/edit/cancel/cost workspace launches, and amount calculations from price, quantity, discounts, and taxes.

The previous Storybook direction recreated a table-like view from the supplied screenshot. That is not a reliable design surface because it can diverge from production markup, Carbon behavior, CSS modules, runtime hooks, and OpenMRS workspace actions. This change corrects the direction by making Storybook render the production component first.

## Goals / Non-Goals

**Goals:**

- Create focused Storybook stories for the real `InvoiceTable` component.
- Use realistic `MappedBill` and `LineItem` fixtures that represent the production invoice overview table.
- Mock external runtime dependencies only where needed for Storybook isolation.
- Cover table states needed before inline-edit design starts: pending rows, paid/disabled rows, closed bill, loading state, selected rows, discount/tax/total calculations, and searchable content.
- Keep stories narrow to the invoice line items table, not the whole billing page shell.

**Non-Goals:**

- No inline edit buttons, cells, rich popup UI, validation, or save behavior.
- No changes to production invoice table behavior.
- No new screenshot-derived table implementation.
- No requirement to create stories for every billing app component.

## Decisions

### Render the production component directly

Stories MUST import and render `InvoiceTable` from `src/invoice/invoice-table.component.tsx`. They MUST NOT recreate the invoice table with local mock JSX.

Alternative considered: keep a prototype story matching the screenshot. Rejected because it creates a second implementation and makes visual review misleading.

### Mock runtime boundaries, not internal table behavior

Storybook should provide controlled mocks for dependencies that only exist in the OpenMRS shell or backend runtime, such as billable services data, workspace launch behavior, layout hooks, translation, and OpenMRS framework helpers.

Alternative considered: refactor `InvoiceTable` to accept overrides for all runtime hooks. Rejected for this change because it would modify production component API only for Storybook setup.

### Use fixtures that expose production calculations

Fixtures should include pending, paid, and exempted line items with taxes and discounts so the stories expose the existing total calculation:

`total = price * quantity + tax - discount`

Alternative considered: use a minimal one-row bill. Rejected because it would not exercise disabled selection/actions or amount columns.

### Defer inline-edit design

Inline editing is the next step, not part of this change. The stories created here are the baseline against which inline-edit behavior can later be designed and compared.

Alternative considered: add disabled edit affordances now to make the target visible. Rejected because that would mix baseline documentation with future behavior.

## Risks / Trade-offs

- Storybook mocks can still drift from OpenMRS runtime behavior -> keep mocks limited to external boundaries and render the actual component.
- `useBillableServices` depends on SWR and OpenMRS fetch behavior -> provide deterministic mock data or module replacement so search/display behavior is stable in Storybook.
- Full invoice overview page parity is out of scope -> stories will match the production table behavior, not the surrounding shell, header, payments, or app chrome.
- Existing screenshot-derived story files can confuse reviewers if left in place -> remove them or rename them outside this change scope before implementing these production stories.
