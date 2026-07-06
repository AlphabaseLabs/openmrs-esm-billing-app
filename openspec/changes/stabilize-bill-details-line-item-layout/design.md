## Context

The bill details page currently has two independent content-driven layout mechanisms that create visible horizontal shifts when an editable line item changes from a short/low-value item to a longer/high-value item.

The top invoice summary is rendered as a flex row with `justify-content: space-between`. When the first summary value changes from a short amount such as `PKR 1,766.00` to a longer amount such as `PKR 249,765.00`, the first flex item becomes wider and the remaining free space is redistributed, moving later summary stats and actions.

The invoice line items table uses Carbon `DataTable`/`Table` with normal auto table layout. Aside from a minimum width on the Bill item column, columns are not explicitly stabilized, so wider bill item text and numeric values can change the browser's intrinsic column width calculations.

## Goals / Non-Goals

**Goals:**
- Keep the bill details summary stats in stable horizontal lanes when displayed values change.
- Keep invoice line item columns in stable horizontal lanes when bill item names, prices, discounts, taxes, and totals change.
- Preserve the current production visual structure and Carbon table components.
- Keep editable cell affordances and popovers layout-neutral, so they do not influence table column widths.
- Preserve responsive behavior for smaller breakpoints.

**Non-Goals:**
- Do not change invoice totals, discount calculations, payment allocation, or persistence behavior.
- Do not redesign the invoice page.
- Do not replace Carbon `DataTable` with a custom table.
- Do not change Storybook fixtures except where needed to demonstrate stable geometry.
- Do not alter the chevron affordance semantics beyond ensuring it remains layout-neutral.

## Decisions

### Use explicit summary stat geometry instead of flex `space-between`

Replace content-distributed summary stat layout with deterministic lanes. The preferred implementation is a CSS grid for the summary area, with stable column definitions for the five stat blocks and a separate action area. This avoids using the width of one value to determine the position of later stats.

Alternative considered: keep flex and assign fixed widths to each stat block. This is less adaptable and easier to break at responsive widths. Grid gives clearer geometry and preserves responsive wrapping rules.

### Stabilize invoice table columns at the table level

Define explicit width/min-width behavior for invoice table columns rather than relying on browser auto-layout. The implementation may use `table-layout: fixed` plus column-specific CSS classes, or a Carbon-compatible equivalent, as long as the visible column lanes remain stable across content changes.

The stable lanes should cover selection, number, bill item, status, quantity, price, discount, tax, total, and action columns. Numeric columns should remain right-aligned. Bill item content should have enough room for production item names without pushing later columns.

Alternative considered: only constrain the editable cell component. This is insufficient because the browser table algorithm still considers non-editable text and numeric content when computing column widths.

### Keep editable controls layout-neutral

Editable cell chevrons, inline editors, and popovers must not add intrinsic width to table cells. Affordances should remain absolutely positioned within the cell surface, and overlays/popovers should be rendered outside normal table flow where applicable.

Alternative considered: allocate a permanent icon lane inside each editable cell. This was rejected for this fix because it changes column content geometry and can reintroduce width drift.

### Preserve responsive behavior with breakpoint-specific rules

Desktop/tablet widths should use stable lanes. Smaller breakpoints may stack the summary area and allow horizontal table scrolling if needed, but content changes must not move columns within a given viewport size.

## Risks / Trade-offs

- Fixed table lanes can truncate or wrap long bill item names if widths are too narrow → mitigate with measured column widths matching production priorities and preserving readable bill item space.
- `table-layout: fixed` can interact with Carbon table internals → mitigate by applying styles through existing table/header/cell class hooks already present in `InvoiceTable`.
- Summary grid may need breakpoint tuning → mitigate by preserving existing less-than-desktop stacking behavior and only replacing desktop/tablet distribution logic.
- Stabilizing columns may expose existing overflow assumptions in Storybook → mitigate by verifying the focused stories at multiple viewport widths after implementation.
