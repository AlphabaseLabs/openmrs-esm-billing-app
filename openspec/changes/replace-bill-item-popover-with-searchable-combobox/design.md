## Context

Editable invoice line-item cells currently use a custom `EditableCellOverlay` so rich editors can escape table overflow and avoid changing table geometry. The bill-item editor uses that overlay with a static custom option list of billable services. That list becomes inefficient when many billable services are available.

Carbon already provides searchable selection controls. The correct integration point is inside the existing bill-item overlay, not inside the table cell itself, because putting a full Carbon field directly in the table cell would risk changing column width, row height, and overflow behavior.

## Goals / Non-Goals

**Goals:**

- Replace the custom bill-item option-button list with a searchable Carbon ComboBox.
- Keep the existing cell surface, chevron affordance, active-cell styling, and `EditableCellOverlay`.
- Keep selection constrained to available billable services.
- Auto-commit when a valid billable service is selected.
- Preserve existing bill-item recalculation and price update semantics.
- Preserve table layout neutrality and overlay overflow behavior.

**Non-Goals:**

- Do not put a Carbon ComboBox directly in the table cell.
- Do not allow arbitrary free-text bill-item commits.
- Do not change price picker, discount picker, payment behavior, table column widths, or invoice summary layout.
- Do not add save/cancel controls.
- Do not change how billable services are fetched or shaped.

## Decisions

### Decision: Use Carbon ComboBox inside the existing overlay

The bill-item editor SHALL keep the current value surface and chevron trigger in the table cell. Opening the selector SHALL render a Carbon ComboBox inside `EditableCellOverlay`.

Alternative considered: replace the entire table cell content with Carbon ComboBox. Rejected because the ComboBox input and menu would participate in table layout and could reintroduce column shifting and clipping issues.

### Decision: Selection is constrained to billable services

The ComboBox SHALL allow searching service names but SHALL only commit an item from the provided `billableServices` collection. Typed text that does not resolve to a selected service MUST NOT be committed as a custom bill item.

Alternative considered: allow free-text line items. Rejected because existing billing semantics depend on billable service UUID/name pairs and optional service price metadata.

### Decision: Preserve existing commit semantics

Selecting a service SHALL reuse the current line-item update path. If the line item already has a selected price, changing the service SHALL continue using the first service price as the next price candidate, matching current behavior.

### Decision: Keep overlay and focus behavior stable

The existing overlay remains responsible for portal placement, outside-click close, Escape close, and viewport overflow. The ComboBox menu must remain usable inside that overlay without requiring a new global positioning system.

## Risks / Trade-offs

- Carbon ComboBox may render internal menu markup with different focus behavior -> keep it inside the overlay and validate selection, Escape, and outside click behavior.
- Carbon ComboBox may have default width/min-width styles that differ from the current popover -> wrap it in bill-item-specific popover styles without affecting table cell sizing.
- Searching large local arrays can still be client-side only -> acceptable for current billable service data shape; no API pagination is introduced in this change.
- Typed-but-unselected values may confuse users -> only commit on selected item change and keep placeholder/label copy clear.
