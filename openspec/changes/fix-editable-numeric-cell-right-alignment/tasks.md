## 1. Diagnose Current Alignment Regression

- [x] 1.1 Inspect current editable numeric cell class composition in price and discount display mode.
- [x] 1.2 Inspect current shared full-surface button reset styles and confirm how they interact with numeric alignment styles.
- [x] 1.3 Confirm text editable cells remain correctly left-aligned and should not be changed by the numeric fix.

## 2. Restore Numeric Alignment

- [x] 2.1 Add or adjust focused stylesheet rules so numeric full-surface buttons align content to the inline end.
- [x] 2.2 Ensure the fix preserves the full-width clickable surface for price and discount cells.
- [x] 2.3 Ensure active inline price and discount editors remain right-aligned.
- [x] 2.4 Ensure floating edit icons remain out of normal layout flow and do not reserve space inside the numeric cell.
- [x] 2.5 Ensure text editable cell surfaces remain aligned to the inline start.

## 3. Add Regression Coverage

- [x] 3.1 Add or update price cell tests proving numeric full-surface display alignment is preserved.
- [x] 3.2 Add or update discount cell tests proving numeric full-surface display alignment is preserved.
- [x] 3.3 Add or update bill-item tests proving text full-surface alignment is not regressed.
- [x] 3.4 Keep existing full-surface click target and icon isolation tests passing.

## 4. Validate Behavior

- [x] 4.1 Run focused editable line-item cell tests.
- [x] 4.2 Run TypeScript validation if implementation or tests change types.
- [x] 4.3 Inspect the production pending bill Storybook story at desktop width and confirm editable numeric display values are right-aligned.
- [x] 4.4 Inspect the production pending bill Storybook story at narrow width and confirm numeric alignment, row height, and full-surface click target remain stable.
- [x] 4.5 Confirm no Storybook-only component, table redesign, or icon layout-space allocation was introduced.
