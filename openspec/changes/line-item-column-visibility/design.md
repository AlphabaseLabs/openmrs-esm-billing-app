## Context

The invoice line items table has grown from a static billing display into an editable financial grid. It now includes identity columns, workflow columns, editable financial fields, calculated totals, and row actions. Some clinics or workflows need a compact table and do not always need Status, Tax, line-level Discount, Quantity, or Number visible.

The current implementation must avoid the common table bug where headers and body cells are hidden independently. Column visibility has to be modeled structurally so headers, row cells, widths, alignment, editable behavior, and tests all derive from the same column registry.

## Goals / Non-Goals

**Goals:**

- Introduce user-controlled visibility for optional line item columns.
- Keep required columns always visible.
- Generate table headers and row cells from one filtered column list.
- Preserve editable-cell behavior for visible editable columns.
- Keep hidden columns in the underlying line item data and calculations.
- Persist the user preference locally for the billing app line items table.
- Provide Storybook/test coverage for visible, hidden, and persisted column states.

**Non-Goals:**

- Do not change invoice calculation rules.
- Do not change backend APIs, bill payload shape, or persistence semantics.
- Do not redesign the entire invoice table UI.
- Do not add server-backed user preferences in this change.
- Do not allow hiding required financial/control columns.

## Decisions

1. Use a column registry as the table source of truth.

   Each line item column must be represented by a definition that owns its id, header label, required/hideable status, row renderer, className/alignment metadata, and optional width behavior. The table must derive both headers and row cells from the same filtered `visibleColumns` array.

   Alternative considered: hide cells with conditional CSS. Rejected because it risks header/body desynchronization, hidden focusable controls, editable-cell geometry bugs, and fragile tests.

2. Treat visibility as presentation state only.

   Hidden columns must not remove data from line items, calculations, validation, totals, or save payloads. For example, hiding Discount or Tax only hides the visual column; totals must still reflect discount and tax values.

   Alternative considered: remove hidden fields from update payloads. Rejected because column visibility is a view preference, not a business-data mutation.

3. Persist preference locally first.

   Use a namespaced local storage key for the billing app line items table visible-column preference. This avoids backend scope creep while giving users persistence across reloads on the same browser/device.

   Alternative considered: server-backed user preferences. Deferred because it needs a cross-app preference model and is not necessary for this focused table-level change.

4. Keep a conservative required-column set.

   Required columns should remain visible because hiding them would undermine table usability or financial correctness: selection/control columns, Bill item, Price, Total, and Actions. Optional candidates can include Number, Status, Quantity, Discount, and Tax.

   Alternative considered: let users hide any column. Rejected because hiding Bill item, Total, or Actions makes the table hard to operate and easier to misread.

5. Provide the column visibility control near existing table tools.

   Place the control in the line items table toolbar next to Search/Add bill item. The control should expose checkboxes or multi-select actions for hideable columns and should not interrupt editing workflows.

## Risks / Trade-offs

- Hidden editable columns could leave an editor open for a now-hidden column -> Close active editable cell state before applying visibility changes.
- Persisted preferences could hide newly introduced optional columns by default -> Merge persisted user choices with current registry defaults and ignore unknown column ids.
- Local storage can be unavailable or corrupted -> Fall back to default visible columns and avoid crashing the table.
- Reduced column count can shift available width -> Column registry should keep existing width/alignment classes and tests should verify header/body alignment.
- Users may hide financially relevant columns such as Discount or Tax and forget values exist -> Totals remain visible and calculations must remain unchanged.
