## 1. Price Option Text Rendering

- [x] 1.1 Update the production editable price cell option row to render option name and amount as one compact label in the form `Name - (Amount)`.
- [x] 1.2 Keep the selected check indicator separate from the compact label and aligned to the trailing side of the option row.
- [x] 1.3 Preserve existing price option selection, auto-commit, close-on-select, and line-item recalculation behavior.

## 2. Price Option Row Geometry

- [x] 2.1 Replace the separate label/amount lane geometry for price options with compact label plus optional trailing check geometry.
- [x] 2.2 Ensure the compact label remains single-line and truncates only when the full `Name - (Amount)` text exceeds the available row width.
- [x] 2.3 Avoid changing bill item option row geometry, discount popover geometry, table column widths, or popover anchoring.

## 3. Focused Tests and Stories

- [x] 3.1 Update editable price cell tests to assert compact option text such as `Cash - (15,000)` instead of separate name and amount alignment.
- [x] 3.2 Preserve tests that confirm selecting a price option commits the existing price update.
- [x] 3.3 Update or verify a focused Storybook state that shows multiple price options with different label lengths and amounts.

## 4. Validation

- [x] 4.1 Run focused editable price cell tests if requested.
- [x] 4.2 Run TypeScript validation if requested.
- [x] 4.3 Inspect the affected Storybook state using the available Storybook environment if requested.
