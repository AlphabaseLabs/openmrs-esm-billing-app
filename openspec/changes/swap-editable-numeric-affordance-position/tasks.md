## 1. Editable Numeric Cell Geometry

- [x] 1.1 Update shared editable numeric cell styles so editable price and discount display values align to the inline start.
- [x] 1.2 Update active inline numeric editor styles so price and discount editors begin at the inline start.
- [x] 1.3 Move the floating numeric affordance from inline start to inline end for editable numeric cells.

## 2. Layout Neutrality

- [x] 2.1 Keep the numeric affordance absolutely positioned or otherwise layout-neutral so it does not reserve table cell space.
- [x] 2.2 Preserve existing table column widths, row heights, and Carbon `DataTable` structure.
- [x] 2.3 Preserve existing popover overlay anchoring and avoid reintroducing table overflow clipping.

## 3. Focused Coverage

- [x] 3.1 Update editable price cell tests to assert left-aligned content and right-side floating affordance classes.
- [x] 3.2 Update editable discount cell tests to assert left-aligned content and right-side floating affordance classes.
- [x] 3.3 Verify existing Storybook states still show price and discount controls with value-first, affordance-right geometry.

## 4. Validation

- [x] 4.1 Run focused editable price and discount cell tests if requested.
- [x] 4.2 Run TypeScript validation if requested.
- [x] 4.3 Inspect affected Storybook states if requested.
