## Context

The invoice line-item table originally had acceptable column proportions. Editable-cell work introduced wrapper elements, full-width button surfaces, floating icons, active-cell styling, and popover triggers. Even when popovers are portaled and cannot directly affect table layout, the inline editable-cell DOM still participates in browser table auto-layout. Any `min-width`, fixed width, or flex intrinsic sizing inside a `td` can change the column distribution.

The root principle is that editable cells must be layout-neutral. The table and its existing column/header structure own column widths. Editable-cell components may align content, display hover affordances, and anchor portaled popovers, but they must not impose new intrinsic width requirements.

## Goals / Non-Goals

**Goals:**

- Restore invoice table column proportions to the pre-editable-cell baseline.
- Prevent editable-cell wrappers from contributing extra intrinsic width to table auto-layout.
- Preserve right alignment for numeric values and left alignment for text values.
- Keep floating edit icons out of normal layout flow with no reserved width.
- Keep welded popovers portaled and anchored to the cell without affecting column measurement.
- Add focused regression coverage for editable-cell layout neutrality.

**Non-Goals:**

- Redesigning the invoice table columns.
- Introducing arbitrary fixed column widths inside editable-cell components.
- Changing DataTable structure beyond what is needed to remove editable-cell sizing pressure.
- Changing popover commit behavior, Discount auto-commit behavior, or Bill item/Price list semantics.

## Decisions

1. Remove editable-cell intrinsic width ownership.

   Editable-cell wrappers SHALL avoid `min-width` and fixed widths that exceed the containing `td`. The browser should measure the same content value it would have measured before editable controls were introduced.

   Alternative considered: make Price/Discount cells fixed-width from the editor component. This hides the immediate regression but moves column policy into reusable cell components, making those components unsafe in other table contexts.

2. Keep floating icons absolutely positioned.

   Edit affordances must remain outside normal document flow so they do not reserve horizontal space. Icon readability can be handled with a small background, but the icon must not create a layout lane or change min-content width.

   Alternative considered: reserve icon lanes inside each editable cell. This was explicitly rejected because it changes column widths and text alignment.

3. Keep popovers portaled and geometry-only.

   Popovers remain rendered outside the table overflow chain and anchored from the cell rectangle. Popover width and content must not influence the source `td` size.

4. Use table-level controls for future explicit widths.

   If the invoice table later needs deliberately fixed or proportional columns, those constraints should live in the table/header/column layer, not in Bill item, Price, or Discount editor internals.

## Risks / Trade-offs

- Removing `min-width` may make inline editors feel tight in very narrow columns. Mitigation: editor inputs should shrink within the cell and rely on table-level responsive behavior instead of forcing the column wider.
- Floating icons can overlap content in narrow columns. Mitigation: the icon already floats over content by design and has its own readable background; it must not reserve space.
- Browser table auto-layout is sensitive to nested flex content. Mitigation: ensure editable-cell children use `min-width: 0`, avoid unnecessary full-width intrinsic sizing, and avoid nested flex rules that force min-content expansion.
- Regression tests cannot perfectly assert pixel column widths in jsdom. Mitigation: test structural contracts and Storybook/visual inspection for actual browser geometry.
