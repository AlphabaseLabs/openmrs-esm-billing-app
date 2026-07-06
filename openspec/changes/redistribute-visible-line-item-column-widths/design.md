## Context

The invoice line items table now supports hiding optional columns through a registry-backed visibility model. The visibility layer removes hidden columns from the rendered headers and row cells, but the geometry layer still uses a static table minimum width and fixed CSS widths that were tuned for the full column set.

With `table-layout: fixed`, static per-column widths, and hidden columns removed from the DOM, the browser must reconcile the remaining fixed widths against the table width. The extra space is redistributed implicitly and can be absorbed by trailing or flexible columns such as Total and Action. That makes compact column sets look unbalanced and can vary across browsers.

The table also has Carbon-managed structure outside the line item registry. In particular, the selection checkbox column is rendered conditionally before the registry-backed data columns. Any explicit width model must account for that synthetic column or the generated column widths will be offset from the rendered table cells.

## Goals / Non-Goals

**Goals:**

- Reallocate available line item table width deterministically whenever optional columns are hidden or restored.
- Keep `table-layout: fixed` so editable cells and inline editors do not resize columns when activated.
- Use the line item column registry as the source of truth for data-column layout metadata.
- Include Carbon-managed synthetic columns, especially the selection checkbox column, in the rendered width model when present.
- Keep selection and action columns fixed-width so they do not absorb surplus table space.
- Let visible flexible data columns absorb surplus by explicit grow weights.
- Compute the visible table minimum width from the actual rendered column set.
- Validate the behavior across representative hide/show combinations and viewport widths.

**Non-Goals:**

- Do not move the column visibility control from the toolbar to a header overflow menu.
- Do not redesign the column visibility UI.
- Do not change localStorage preference shape or persistence behavior.
- Do not change billing calculations, line item save payloads, or backend APIs.
- Do not remove `table-layout: fixed`.
- Do not rely on content-driven auto-layout, because editable controls must not influence table width.

## Decisions

### Use measured pixel widths instead of percentage-only weights

Use a small layout calculation that measures the available table container width with `ResizeObserver`, then computes exact pixel widths for the visible columns.

Algorithm:

1. Build the rendered layout column list:
   - Add the synthetic Carbon selection column only when the table renders the selection column.
   - Add the visible line item registry columns in registry order.
2. Compute `totalMinWidth = sum(column.minWidth)`.
3. Compute `layoutWidth = max(containerContentWidth, totalMinWidth)`.
4. Compute `surplus = layoutWidth - totalMinWidth`.
5. Assign each fixed column exactly its `minWidth`.
6. Assign each flexible column `minWidth + surplus * (growWeight / totalGrowWeight)`.
7. Round widths so the final sum equals `layoutWidth`.
8. Render the widths through a `<colgroup>` in the same order as the rendered table columns.
9. Set the table `min-inline-size` to `totalMinWidth`.

Rationale: percentage-only widths cannot strictly honor minimum widths across narrow and wide viewports. Measuring the container lets the implementation preserve minimum widths, preserve horizontal scroll when needed, and distribute surplus deterministically.

Alternative considered: derive `<col>` percentages from weights. This is simpler but treats `minWidth` as approximate and can under-shrink columns in narrow containers.

Alternative considered: remove explicit widths and let the browser auto-layout the table. This would reintroduce the previous editable-cell problem where opening editors can change column widths.

### Add layout metadata to registry-backed columns

Extend line item column definitions with layout metadata:

- `minWidth`: the minimum usable width for the column.
- `growWeight`: how much surplus width a flexible column receives.
- `isFixed`: whether the column is excluded from surplus distribution.

Fixed columns must have `growWeight: 0`. A column must not be both fixed and weighted.

Expected model:

- Selection checkbox: fixed, synthetic, narrow.
- Number: fixed or low-weight narrow column.
- Bill item: flexible, high-weight text column.
- Status: flexible or low-weight text column.
- Quantity: fixed or low-weight numeric column.
- Price, Discount, Tax, Total: flexible numeric columns with comparable weights.
- Action: fixed, synthetic/action column, excluded from surplus distribution.

Rationale: the registry already defines visible columns and display metadata. Adding layout metadata keeps visibility and layout decisions aligned.

### Treat Carbon selection as a synthetic layout column

The selection checkbox column is rendered before registry columns only under the same condition currently used by the table header and rows. The layout system must include a synthetic selection column in the `<colgroup>` only when that column is rendered.

Rationale: Carbon DataTable markup will otherwise shift every generated width by one column when selection is present.

Alternative considered: include selection in the line item registry. This would blur application data columns with Carbon control columns and make the visibility registry responsible for a non-hideable table-control concern.

### Render widths through `<colgroup>`

Insert a `<colgroup>` as the first child of the Carbon `Table`, before `TableHead`, with one `<col>` for every rendered column.

Rationale: fixed-layout tables are designed to consume column widths from `<colgroup>`. This keeps width allocation declarative and avoids applying duplicated width styles to every header and body cell.

Alternative considered: apply widths directly to the first header row cells. This can work under fixed layout, but it couples width behavior to header markup and is easier to misalign when Carbon conditionally renders leading columns.

### Keep CSS classes for alignment and cell styling, not primary widths

Existing column classes should continue to control alignment, editable-cell geometry, and visual styling. Static width declarations should either be removed or made subordinate to generated `<col>` widths.

Rationale: the current static widths are the source of the hidden-column redistribution bug. Keeping them as primary layout rules would conflict with computed widths.

### Use pure functions for layout math

Implement width calculation as a pure helper that accepts:

- rendered layout columns
- available width

and returns:

- per-column pixel widths
- total minimum width
- final layout width

Rationale: pure calculation is easy to unit test in jsdom, where real layout measurement is limited. Browser-level Storybook smoke tests can validate the ResizeObserver integration and actual DOM geometry.

## Risks / Trade-offs

- ResizeObserver behavior can be hard to test in jsdom -> Keep layout math pure and unit-test it separately; use Storybook/Playwright smoke checks for browser behavior.
- Widths can drift from rendered columns if synthetic columns are missed -> Build the layout column list from the same booleans used to render headers and cells, and test selection-present and selection-absent scenarios.
- Rounding can create one-pixel header/body mismatches -> Centralize rounding in the pure width helper and assert the sum equals the final layout width.
- Long content can clip under fixed layout -> Choose minimum widths from realistic content and keep horizontal scroll by setting table minimum width to the visible minimum width sum.
- Editable cell popovers or inline editors may regress column stability -> Add tests that open Price, Discount, Quantity, and Bill Item editors after hiding columns and verify column counts and widths remain stable.
- The table could re-render frequently during resize -> Debounce is likely unnecessary because ResizeObserver updates are bounded by browser layout cycles, but keep state updates conditional on width changes.
