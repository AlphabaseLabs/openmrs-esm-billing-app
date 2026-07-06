## Context

Editable price and discount cells currently render the floating affordance at the inline start of the numeric cell while the value remains right-aligned. This was useful for protecting numeric table alignment, but it now conflicts with the intended selectable-cell pattern: the user should read the value first and see the chevron/control at the trailing side.

The change is purely geometric. It should not affect totals, recalculation, selection, popover behavior, or table column sizing.

## Goals / Non-Goals

**Goals:**

- Left-align editable price and discount display values.
- Place the floating chevron/control affordance at the right side of editable numeric cells.
- Keep the affordance layout-neutral: it must not reserve a table lane or change the table column width.
- Preserve current popover anchoring and editor behavior.

**Non-Goals:**

- Do not change read-only numeric cells unless they reuse the editable numeric presentation while editable.
- Do not change bill item text cell geometry.
- Do not change table column widths or Carbon `DataTable` structure.
- Do not change price, discount, tax, total, or bill recalculation logic.
- Do not change the visual design of the chevron button itself.

## Decisions

### Swap editable numeric visual positions only

The editable numeric cell should place value/editor content at the inline start and the floating affordance at the inline end. This gives price and discount cells the same readable flow as a selectable control: value first, control second.

Alternative considered: keep numeric values right-aligned and only move the chevron to the right. This creates a cramped trailing cluster where the value and chevron compete for the same visual edge.

### Keep affordances layout-neutral

The chevron/control must remain floating or absolutely positioned so it does not reserve width inside the cell. Table geometry has already been stabilized separately and should not be reopened for this visual swap.

Alternative considered: use a two-column in-cell grid with a reserved control lane. This is easier visually but reintroduces layout allocation and risks affecting table width and text truncation.

### Preserve popover anchoring

The popover should continue to anchor to the editable cell/overlay contract already in place. Moving the visible affordance to the right should not move the popover into table overflow or require a new portal strategy.

Alternative considered: anchor popovers directly to the right-side button. That may be useful later, but it would broaden this change beyond the requested visual swap.

## Risks / Trade-offs

- Long values may visually pass under the floating affordance -> keep the affordance backed by its existing elevated white/gray surface so it remains legible.
- Tests may currently assert right-aligned numeric content or left-side affordance placement -> update focused tests to assert the new classes/geometry instead of incidental layout.
- If discount and price use shared numeric styles, the change can affect both together -> keep task scope explicit and verify both editable price and discount cells.
