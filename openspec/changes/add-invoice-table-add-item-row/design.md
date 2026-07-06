## Context

The production invoice line-items table is implemented in `src/invoice/invoice-table.component.tsx` using Carbon `DataTable`. The current table already owns search, selection, column visibility, fixed column widths through `<colgroup>`, inline cell editors, row actions, and the toolbar `Add bill item` action.

The requested behavior is a second add entry point: a final row inside the line-items table with a `+ Add item` affordance. It should open the same add bill item workspace that the toolbar button opens. It should not introduce a new add flow, alter bill calculations, or add the additional-discount UI shown in the mockup.

## Goals / Non-Goals

**Goals:**

- Render a final in-table add row for open bills.
- Make the row visually simple: one full-width cell with a `+ Add item` action.
- Reuse the existing `handleAddBillItem` workspace launch behavior.
- Preserve existing toolbar add behavior.
- Preserve line item table search, sorting, selection, column visibility, and width alignment.
- Cover open, closed, and compact-column states with focused tests.

**Non-Goals:**

- Do not implement additional discount controls.
- Do not change backend REST APIs or bill persistence semantics.
- Do not change payment, totals, tax, discount, or line item calculation behavior.
- Do not modify the billing form workspace contract.
- Do not remove or redesign the existing toolbar `Add bill item` action.

## Decisions

### Render the add affordance as a manual table row, not a DataTable data row

The add row should be rendered directly after the `rows.map(...)` data-row rendering inside `TableBody`. It should not be added to `tableRows`.

Rationale: `tableRows` is consumed by Carbon `DataTable` for sorting, searching, cell generation, row props, and selection mechanics. A synthetic add row in that data model would risk becoming sortable, searchable, selectable, or rendered with normal line-item cells.

Alternative considered: append a synthetic item to `tableRows`. Rejected because it would pollute line item table behavior and make row-selection/search tests fragile.

### Reuse the existing add workspace callback

The in-table add action should call the same `handleAddBillItem` function used by the toolbar button. That function launches `billing-form` with `patientUuid`, `workspaceTitle: Add bill item`, and `navigateToBillAfterSave: true`.

Rationale: the user asked for the same add item workspace that is already triggered from the table header. Reusing the callback keeps behavior consistent and avoids a second workspace contract.

Alternative considered: duplicate the `launchBillingWorkspace` call inline in the row. Rejected because it would create two call sites that could drift.

### Gate the row with the same open-bill rule as the toolbar action

The add row should render only when `!bill.closed`, matching the existing toolbar `Add bill item` visibility rule. A bill with `status: PAID` but `closed !== true` should follow the same rule the toolbar currently follows.

Rationale: this keeps the new affordance aligned with existing invoice table behavior and avoids introducing a new bill-state policy in a UI-only change.

Alternative considered: hide the row based on `bill.status === PAID`. Rejected because the current toolbar action does not use that policy.

### Span the currently rendered table columns

The add row should contain one `TableCell` whose `colSpan` equals the number of rendered columns, including the synthetic selection column when present. The existing `columnLayout.columns.length` is the best source because it is derived from the same visible column set and selection-column condition that drive `<colgroup>`.

Rationale: the table supports hiding optional columns and conditionally renders the selection column. A hard-coded colspan would break compact-column states and header/body alignment.

Alternative considered: use `headers.length` directly. Rejected because it excludes the synthetic selection column.

### Keep the row visually outside line item data

The row should use dedicated SCSS classes rather than line item cell classes. It should have a quiet full-width affordance with a leading plus text/icon and the accessible button name `Add item`.

Rationale: users should read the row as an action, not as an empty billable item. Dedicated styling also avoids interaction with editable-cell hover affordances and numeric alignment classes.

Alternative considered: make the row mimic a blank editable bill item row. Rejected because clicking it opens a workspace, not an inline editor.

## Risks / Trade-offs

- [Risk] The row could disrupt Carbon table selection or sorting if modeled as data. -> Mitigation: render it manually outside the `DataTable` row array.
- [Risk] Column visibility can desynchronize header/body geometry. -> Mitigation: calculate `colSpan` from `columnLayout.columns.length` and test hidden-column states.
- [Risk] Tests that count the first body row cells may accidentally inspect the add row in filtered or empty states. -> Mitigation: keep existing line-item rows first and add targeted tests for the footer row.
- [Risk] The existing empty-state rendering may still appear when filtered line items are empty. -> Mitigation: keep the add row independent of data rows and avoid changing empty-state behavior unless implementation tests show contradictory UI.
- [Risk] Adding a new visible label requires translation coverage. -> Mitigation: use a new `addItem` translation key with fallback `Add item`.

## Migration Plan

No data migration is required. The change ships as a frontend-only update and can be rolled back by removing the manual add row rendering, its styles, translation key, and tests.

## Open Questions

None. Additional discount remains intentionally deferred.
