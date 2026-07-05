## Context

The invoice line items table is implemented by `src/invoice/invoice-table.component.tsx` with Carbon `DataTable`. The current implementation maps each line item into display strings and renders every column through a generic `TableCell`, so `Price`, `Discount`, and `Bill item` cannot own production edit behavior.

`BillDetails` currently receives a `MappedBill` prop and passes that same object to `InvoiceTable`, `Payments`, `InvoiceActions`, and the invoice summary. Inline edits must update the line-item table and the summary/payment sections together, so the edited bill state must be owned above `InvoiceTable`.

Existing production resource support already exists:

- `updateBillLineItem(lineItemUuid, updates)` persists line-item changes.
- `BillLineItemUpdate` supports `price`, `priceName`, `priceUuid`, `quantity`, `paymentStatus`, and `discounts`.
- `useBillableServices()` fetches services with `servicePrices`.
- The existing edit-bill workspace uses service price options to update `price`, `priceName`, and `priceUuid`.

## Goals / Non-Goals

**Goals:**

- Implement editable `Price`, `Discount`, and `Bill item` cells in production invoice table code.
- Preserve the existing Carbon `DataTable` engine, row selection, action column, search behavior, and loading behavior.
- Keep cell rest state visually equivalent to plain Carbon table cells.
- Persist committed edits through existing billing resources.
- Recompute the edited row and invoice summary immediately after successful saves.
- Add focused Storybook coverage only as an exercise surface for production components.

**Non-Goals:**

- Do not build mock, story-only, or Storybook-prototype editable-cell components.
- Do not replace Carbon `DataTable` with a custom table engine.
- Do not implement total-bill discount in this change.
- Do not redesign the invoice page shell, payment table, navigation, or bill actions.
- Do not sync selected line-item price tier with payment method selection.

## Decisions

### Keep Carbon DataTable and swap production cell renderers by column key

`InvoiceTable` will keep the existing `DataTable` row model and selection flow. The generic `row.cells.map(...)` render path will branch on the column key for `billItem`, `price`, and `discount` and render production editable cell components for those columns.

Alternative considered: create a separate editable table component. That would duplicate selection, search, loading, and action behavior and increase drift from production.

### Add production editable cell components under invoice code

Create a small production component family under `src/invoice/`, for example `src/invoice/editable-line-item-cells/`:

- `EditableBillItemCell`
- `EditablePriceCell`
- `EditableDiscountCell`
- shared active-editor/draft helpers
- shared numeric parsing/formatting/validation helpers
- shared popover positioning styles

These components receive real `LineItem`, `BillingService`, and commit callbacks. They must not depend on Storybook fixtures except through normal props.

Alternative considered: embed all behavior directly in `InvoiceTable`. That would make the table hard to read and make focused tests/stories harder to maintain.

### Lift edited bill state into BillDetails

`BillDetails` will maintain an `editableBill` state initialized from the incoming `bill` prop and synced when the prop changes. It will pass `editableBill` to `InvoiceTable`, `Payments`, `InvoiceActions`, and the invoice summary.

`InvoiceTable` will receive an edit callback. On a successful save, `BillDetails` will apply a line-item update to `editableBill` and recompute bill totals. On failure, the previous bill state remains visible and an error notification is shown.

Alternative considered: keep edited state inside `InvoiceTable`. That would update the table but leave the invoice summary and payment amount calculations stale.

### Reuse updateBillLineItem for persistence

Each committed edit will call `updateBillLineItem(lineItem.uuid, payload)`:

- Price free-type commit sends `price`.
- Price picker commit sends `price`, `priceName`, and `priceUuid`.
- Discount commit sends `discounts`.
- Bill item commit sends the selected service identifier plus the reset `price`, `priceName`, and `priceUuid` needed to keep the row consistent.

The implementation should align payload building with the existing edit-bill workspace helpers where possible, so inline editing and workspace editing remain semantically equivalent.

Alternative considered: add a new endpoint wrapper for each cell type. Existing `updateBillLineItem` already covers the required payload shape.

### Resolve price-tier behavior as line-item override only

Selecting a price tier in the Price cell updates only that line item. It does not sync or mutate payment method selection. The apparent label overlap between price tiers and payment methods is treated as naming reuse, not coupled state.

Alternative considered: update payment method when a price tier is selected. That would create cross-section side effects not present in the existing edit-bill workspace.

### Resolve bill-item price reset to selected service default

When Bill item changes, the row's available-price options refresh from the selected billable service. The row price resets to the selected service's default price tier. Default means the service price named `Default` when present; otherwise the first service price returned by the API. The implementation updates `priceName` and `priceUuid` with that selected service price.

Alternative considered: preserve the prior price if it was manually edited. The current data model has no reliable persisted manual-override flag, so preserving a price from another service could keep invalid price metadata attached to the new item.

### Use one active editor key for the entire table

`InvoiceTable` will own a single `activeEditor` key shaped like `{ lineItemUuid, column }`. Opening another cell first asks the current cell to commit if valid or cancel/reject transition if invalid. This prevents stacked popovers, multiple inline inputs, and conflicting blur handlers.

Alternative considered: each cell owns local open state. That makes simultaneous editors likely and complicates click-away behavior.

### Use Carbon controls and production styling

Inline numeric editing uses Carbon `NumberInput`. Bill item editing uses Carbon `ComboBox`. Price and discount overlays use Carbon popover/layer primitives with `autoAlign` and portal behavior where needed. SCSS will be scoped to the invoice table/cell components and will preserve the plain-cell rest state.

Alternative considered: custom inputs/popovers. Carbon components better match the existing app and accessibility behavior.

### Storybook stories exercise production states only

Stories may be added for pending rows, locked rows, picker-open states, discount-form states, validation states, and responsive layouts, but they must render the real `BillDetails`, `InvoiceTable`, and production editable cell components. Storybook may provide runtime data fixtures and API mocks only at the boundary needed to run production components.

Alternative considered: mock story components matching screenshots. That was explicitly ruled out because it creates false confidence and drift from production behavior.

## Risks / Trade-offs

- [Risk] `BillingService.servicePrices` typing is incomplete compared with the API representation used by the app. -> Mitigation: update the local type to include `uuid` and optional `paymentMode` while preserving existing fields.
- [Risk] Recomputing totals locally could drift from backend-calculated bill totals. -> Mitigation: keep the local recompute limited to immediate UI feedback, preserve backend response/SWR revalidation if available, and use existing billing semantics for amount, discounts, taxes, total amount, tendered amount, and balance.
- [Risk] Popovers can be clipped by table overflow or Storybook iframe layout. -> Mitigation: use Carbon auto-align and portal/layer placement, and add focused stories for clipped-table scenarios.
- [Risk] Blur-save and click-away interactions can double-submit. -> Mitigation: centralize commit state per active editor and guard commits while a save is in flight.
- [Risk] Locked rows might accidentally expose hover affordances. -> Mitigation: derive editability from `lineItem.paymentStatus` before rendering editable cell behavior.
- [Risk] Bill item selection payload shape may differ for service-backed versus item-backed rows. -> Mitigation: inspect current `lineItem.item` versus `lineItem.billableService` and reuse existing helper conventions for identifier extraction.

## Migration Plan

No data migration is required.

Implementation can ship behind the normal app bundle:

1. Add production editable cell components and helpers.
2. Wire them into `InvoiceTable`.
3. Lift edited bill state and recomputation into `BillDetails`.
4. Add focused tests and production stories.
5. Keep existing row-level edit workspace available as a fallback path.

Rollback is a code rollback: revert the editable cell rendering branch and return the table to static `TableCell` values.

## Open Questions

None for implementation. The two product ambiguities from the input spec are resolved in this design:

- Price tier selection is override-only and does not sync payment method.
- Bill item changes reset price to the selected service default/first price.
