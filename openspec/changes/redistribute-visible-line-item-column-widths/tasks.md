## 1. Layout Metadata and Width Calculation

- [x] 1.1 Extend line item column definitions with `minWidth`, `growWeight`, and `isFixed` layout metadata.
- [x] 1.2 Add a synthetic layout column definition for the Carbon selection checkbox column.
- [x] 1.3 Ensure fixed columns use `growWeight: 0` and are excluded from surplus distribution.
- [x] 1.4 Add a pure helper that builds the rendered layout column list from selection-column state and visible registry columns.
- [x] 1.5 Add a pure helper that computes total minimum width, final layout width, and per-column pixel widths from rendered layout columns and available width.
- [x] 1.6 Add deterministic rounding so computed column widths sum exactly to the final layout width.

## 2. Table Rendering Integration

- [x] 2.1 Measure the invoice line items table container width with `ResizeObserver`.
- [x] 2.2 Recompute layout widths when the measured container width changes.
- [x] 2.3 Recompute layout widths when visible column keys change.
- [x] 2.4 Render a `<colgroup>` inside the Carbon `Table` before `TableHead`.
- [x] 2.5 Render one `<col>` for every actual rendered table column, including the synthetic selection column when present.
- [x] 2.6 Apply the computed visible minimum width as the table `min-inline-size`.
- [x] 2.7 Preserve `table-layout: fixed` on the line items table.

## 3. CSS and Existing Behavior Preservation

- [x] 3.1 Remove or neutralize static per-column width CSS as the primary width source.
- [x] 3.2 Keep existing column class names for alignment, editable-cell geometry, and visual styling.
- [x] 3.3 Keep the existing column visibility toolbar control in its current location.
- [x] 3.4 Confirm the change does not alter localStorage preference format.
- [x] 3.5 Confirm billing calculations and update payloads are unchanged.

## 4. Alignment and Interaction Coverage

- [x] 4.1 Verify default visible columns render with header/body alignment.
- [x] 4.2 Verify hiding Tax only reallocates space without expanding the Actions column.
- [x] 4.3 Verify hiding Discount and Tax reallocates space without leaving reserved hidden-column gaps.
- [x] 4.4 Verify hiding Status, Discount, and Tax reallocates space across visible flexible columns.
- [x] 4.5 Verify selection-present tables include the synthetic selection width and do not shift data-column widths.
- [x] 4.6 Verify selection-absent tables omit the synthetic selection width and keep data columns aligned.
- [x] 4.7 Verify opening Price, Discount, Quantity, and Bill Item editors does not change computed column widths.

## 5. Tests and Storybook Coverage

- [x] 5.1 Add unit tests for rendered layout column construction with and without the selection column.
- [x] 5.2 Add unit tests for fixed-column exclusion from surplus distribution.
- [x] 5.3 Add unit tests for minimum-width fallback when the container is narrower than visible minimum width.
- [x] 5.4 Add unit tests for surplus redistribution and rounding when the container is wider than visible minimum width.
- [x] 5.5 Add component tests that hide/show optional columns and assert header/body cell counts and order remain synchronized.
- [x] 5.6 Add component tests that assert fixed Action width does not absorb hidden-column slack.
- [x] 5.7 Add Storybook coverage for representative hidden-column combinations and viewport widths.
- [x] 5.8 Add Storybook/DOM smoke validation for column widths before and after toggling optional columns.

## 6. Validation

- [x] 6.1 Run focused layout helper and invoice table component tests.
- [x] 6.2 Run TypeScript validation.
- [x] 6.3 Run focused Storybook smoke validation outside the sandbox.
