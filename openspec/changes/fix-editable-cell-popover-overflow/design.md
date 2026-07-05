## Context

The editable invoice line-item work adds rich editors for price, discount, and bill-item cells inside the production `InvoiceTable`. The current implementation positions rich popovers as descendants of the editable table cell.

That placement conflicts with Carbon table layout. Carbon table containers are allowed to scroll and clip overflow to support wide tables and responsive layouts. A high `z-index` cannot escape an ancestor overflow boundary, so a popover rendered inside a table cell can become part of the table's scrollable area. The observed symptom is that clicking the edit trigger causes the icon/table area to scroll instead of the editor floating above the bill UI.

## Goals / Non-Goals

**Goals:**

- Make rich editable-cell popovers visually float above the invoice table instead of participating in table scroll overflow.
- Preserve production `InvoiceTable` ownership of cell values, triggers, disabled states, and commit behavior.
- Keep responsive table scrolling intact.
- Keep Storybook stories on production code paths.
- Provide deterministic behavior for price, discount, and bill-item editor popovers.

**Non-Goals:**

- Redesigning the invoice table.
- Replacing Carbon `DataTable`.
- Introducing a Storybook-only editable-cell component.
- Changing backend line-item update APIs.
- Changing the inline edit value validation rules beyond what is required for overlay ownership.

## Decisions

### Render rich popovers through an overlay/portal

Rich editable-cell popovers MUST render outside the Carbon table overflow container. The trigger and compact cell value remain in the table cell, but the opened editor is owned by an overlay layer attached outside the table, such as `document.body` or a stable bill-details overlay root.

Rationale: table overflow and floating editors have conflicting layout requirements. Keeping the popover inside the table means it can be clipped or force scroll. Portal ownership lets the popover float over parent UI while the table remains scrollable.

Alternative considered: increase `z-index`. Rejected because `z-index` does not escape overflow clipping.

Alternative considered: set table wrappers to `overflow: visible`. Rejected because it risks breaking production responsive table behavior and horizontal scrolling.

### Position by trigger geometry, not table-cell-relative CSS

When a rich editor opens, the implementation should measure the trigger or cell anchor with `getBoundingClientRect()` and position the overlay with viewport coordinates. `position: fixed` is preferred because it avoids dependency on nested offset parents and scroll containers.

Rationale: the overlay is no longer a table-cell descendant, so the anchor relationship must be expressed explicitly.

### Keep one active editor

The existing single-active-editor behavior should remain. Opening a second editor closes or replaces the first editor. This avoids overlapping popovers and keeps commit/cancel behavior predictable.

### Reposition or close on layout changes

The overlay should respond to scroll and resize. The simplest acceptable behavior is to close the active editor on viewport scroll/resize. A stronger behavior is to reposition while open. Either is acceptable if it prevents stale detached overlays.

Rationale: table rows can move under scroll, and a viewport-positioned overlay can become visually detached without a scroll strategy.

### Preserve production stories and tests

Stories must continue using production `BillDetails`, `InvoiceTable`, and editable-cell components. Tests should validate that popovers are not descendants of the table scroll wrapper and that commit behavior still routes through the production line-item update path.

## Risks / Trade-offs

- [Risk] Portal positioning can become stale when the user scrolls or resizes the page. -> Mitigation: close or reposition the overlay on scroll and resize.
- [Risk] Outside-click handling can accidentally close the editor while interacting with Carbon controls inside the popover. -> Mitigation: treat the trigger and overlay root as inside targets.
- [Risk] Keyboard focus can become harder to manage when the editor is portaled. -> Mitigation: move focus into the editor on open and return focus to the trigger on close where practical.
- [Risk] Body-level overlays can conflict with other OpenMRS overlays. -> Mitigation: use a bounded z-index consistent with the app and keep only one line-item editor open.
- [Risk] Tests that query within the table may stop finding editor controls after portalization. -> Mitigation: update tests to query the document/overlay for popover controls while asserting the trigger remains in the table.
